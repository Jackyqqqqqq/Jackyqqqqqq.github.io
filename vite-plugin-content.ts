import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

// 只在 `vite dev` 下挂载：apply:"serve" 保证它不会进生产包，也不会出现在 GitHub Pages 上。
// /admin 管理页用到 /tree（整棵覆盖写）、/assets（列素材）、/upload（传 GLB / 图片）。

const ENDPOINT = "/__content";
const MAX_BODY = 64 * 1024;
const MAX_UPLOAD = 32 * 1024 * 1024; // GLB 动辄十几 MB，给到 32MB

// 上传只认这两个目录和这些扩展名。目录是白名单而不是拼路径，从根上没有穿越的机会。
const UPLOAD_DIRS = { models: "public/models", images: "public/images" } as const;
const ALLOWED_EXT = new Set([".glb", ".gltf", ".png", ".jpg", ".jpeg", ".webp", ".svg"]);

// 项目没装 @types/node，这里只声明真正用到的字段，省掉一个纯类型依赖。
type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  on(event: string, cb: (chunk: any) => void): void;
  destroy(): void;
};
type Res = { statusCode: number; setHeader(k: string, v: string): void; end(body: string): void };

/** 剥掉一切目录成分后再校验，`../x` / `a/b.png` 都只剩尾段，穿越不可能成立。 */
function safeFilename(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 120) return null;
  const base = path.basename(raw);
  if (!/^[A-Za-z0-9._-]+$/.test(base) || base.startsWith(".")) return null;
  if (!ALLOWED_EXT.has(path.extname(base).toLowerCase())) return null;
  return base;
}

/**
 * 整棵覆盖写之前的形状校验。表单能增删数组、能留空字段，一旦写坏整站白屏 ——
 * 所以这里挡住的是"结构缺失"，而不是"内容不合口味"。
 */
function validateTree(tree: unknown): string | null {
  if (!tree || typeof tree !== "object") return "根节点必须是对象";
  const root = tree as Record<string, any>;
  for (const key of ["monogram", "email", "model"]) {
    if (typeof root[key] !== "string" || !root[key]) return `${key} 必须是非空字符串`;
  }
  if (!Array.isArray(root.socials)) return "socials 必须是数组";
  if (!root.theme || typeof root.theme !== "object") return "theme 必须是对象";
  for (const key of ["accent", "accentAlt", "paper", "ink", "night"]) {
    if (typeof root.theme[key] !== "string") return `theme.${key} 必须是字符串`;
  }
  if (!root.copy || typeof root.copy !== "object") return "copy 必须是对象";

  // 两种语言的键集合必须一致：只改一半语言会让切换后出现空白区块。
  const zh = root.copy.zh;
  const en = root.copy.en;
  if (!zh || !en) return "copy.zh 和 copy.en 都必须存在";
  const zhKeys = Object.keys(zh).sort().join(",");
  const enKeys = Object.keys(en).sort().join(",");
  if (zhKeys !== enKeys) return "copy.zh 和 copy.en 的字段必须一致";

  for (const [locale, lc] of [["zh", zh], ["en", en]] as const) {
    for (const key of ["name", "role", "headline", "intro", "location", "availability"]) {
      if (typeof lc[key] !== "string" || !lc[key]) return `copy.${locale}.${key} 不能为空`;
    }
    for (const key of ["education", "stats", "skills", "projects"]) {
      if (!Array.isArray(lc[key])) return `copy.${locale}.${key} 必须是数组`;
    }
    for (const [i, project] of lc.projects.entries()) {
      if (!Array.isArray(project?.tags) || !Array.isArray(project?.flow)) {
        return `copy.${locale}.projects.${i} 的 tags/flow 必须是数组`;
      }
    }
  }
  return null;
}

export function contentWriter(): Plugin {
  return {
    name: "content-writer",
    apply: "serve",
    configureServer(server) {
      const file = path.resolve(server.config.root, "src/content.json");
      const reply = (res: Res, code: number, body: Record<string, unknown>) => {
        res.statusCode = code;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      /** 收 body 并限流。超限就地回 413 并断流，返回 null 表示调用方无需继续。 */
      const collect = (req: Req, res: Res, limit: number) =>
        new Promise<Uint8Array | null>((resolve) => {
          const chunks: Uint8Array[] = [];
          let size = 0;
          req.on("data", (chunk: Uint8Array) => {
            size += chunk.length;
            if (size > limit) {
              reply(res, 413, { error: `内容超过 ${Math.round(limit / 1024 / 1024) || 1}MB 上限` });
              req.destroy();
              resolve(null);
              return;
            }
            chunks.push(chunk);
          });
          req.on("end", () => {
            const merged = new Uint8Array(size);
            let at = 0;
            for (const chunk of chunks) {
              merged.set(chunk, at);
              at += chunk.length;
            }
            resolve(merged);
          });
          req.on("error", () => resolve(null));
        });

      // 整棵覆盖写：admin 表单能增删数组、能改新字段，逐字段 patch 不划算。
      server.middlewares.use(`${ENDPOINT}/tree`, async (req, res) => {
        if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
        const body = await collect(req, res, MAX_BODY * 8);
        if (!body) return;
        try {
          const tree = JSON.parse(new TextDecoder().decode(body));
          const failure = validateTree(tree);
          if (failure) return reply(res, 400, { error: failure });
          await writeFile(file, `${JSON.stringify(tree, null, 2)}\n`, "utf8");
          reply(res, 200, { ok: true });
        } catch (error) {
          reply(res, 400, { error: error instanceof Error ? error.message : "写入失败" });
        }
      });

      // 列素材：admin 的模型/图片下拉用。
      server.middlewares.use(`${ENDPOINT}/assets`, async (_req, res) => {
        try {
          const listing: Record<string, Array<{ name: string; size: number }>> = {};
          for (const [kind, dir] of Object.entries(UPLOAD_DIRS)) {
            const abs = path.resolve(server.config.root, dir);
            const names = await readdir(abs).catch(() => [] as string[]);
            listing[kind] = [];
            for (const name of names) {
              if (!ALLOWED_EXT.has(path.extname(name).toLowerCase())) continue;
              const info = await stat(path.join(abs, name)).catch(() => null);
              if (info?.isFile()) listing[kind].push({ name, size: info.size });
            }
          }
          reply(res, 200, { ok: true, ...listing });
        } catch (error) {
          reply(res, 500, { error: error instanceof Error ? error.message : "读取失败" });
        }
      });

      // 上传 GLB / 图片。multipart 用 Node 原生 Response.formData() 解，不引第三方解析器。
      server.middlewares.use(`${ENDPOINT}/upload`, async (req, res) => {
        if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
        const body = await collect(req, res, MAX_UPLOAD);
        if (!body) return;
        try {
          const contentType = req.headers["content-type"] ?? "";
          if (!contentType.startsWith("multipart/form-data")) {
            return reply(res, 400, { error: "需要 multipart/form-data" });
          }
          const form = await new Response(body as unknown as BodyInit, {
            headers: { "content-type": String(contentType) },
          }).formData();
          const kind = String(form.get("kind") ?? "");
          if (!(kind in UPLOAD_DIRS)) return reply(res, 400, { error: "kind 只能是 models 或 images" });

          const upload = form.get("file");
          if (!(upload instanceof File)) return reply(res, 400, { error: "缺少 file 字段" });
          const name = safeFilename(String(form.get("name") ?? upload.name));
          if (!name) return reply(res, 400, { error: "文件名或扩展名不被允许" });

          const dir = path.resolve(server.config.root, UPLOAD_DIRS[kind as keyof typeof UPLOAD_DIRS]);
          const target = path.join(dir, name);
          // 同名不静默覆盖：素材被别处引用时覆盖是不可逆的。
          const exists = await stat(target).then(() => true).catch(() => false);
          if (exists && form.get("overwrite") !== "1") {
            return reply(res, 409, { error: `${name} 已存在`, exists: true, name });
          }
          await writeFile(target, new Uint8Array(await upload.arrayBuffer()));
          reply(res, 200, { ok: true, path: `${kind}/${name}` });
        } catch (error) {
          reply(res, 400, { error: error instanceof Error ? error.message : "上传失败" });
        }
      });

    },
  };
}
