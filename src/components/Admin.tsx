/**
 * /admin —— 内容管理页，只在 `vite dev` 下存在（写入端点是 serve 中间件，生产包摇掉整个组件）。
 * 表单不是逐字段手写的，而是照着 content.json 当前形状递归渲染：加了新字段自动出现在页面上，
 * 不用回来改一遍表单代码。保存走 /__content/tree 整棵覆盖写，服务端做形状校验。
 *
 * ponytail: 空数组无法推断新项形状，"添加"会被禁用；这种情况直接编辑 src/content.json 加第一项。
 */
import { ArrowLeft, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "../config";
import content from "../content.json";

const ENDPOINT = "/__content";

// 只给键名一个中文说明，值本身怎么渲染由类型决定。缺的键就显示原名，不影响使用。
const LABELS: Record<string, string> = {
  monogram: "标记字母", email: "邮箱", model: "3D 模型", socials: "社交链接", images: "图片",
  theme: "配色", accent: "主色", accentAlt: "辅色", paper: "纸色", ink: "墨色", night: "夜色",
  copy: "正文", zh: "中文", en: "English", name: "姓名", role: "身份", headline: "大标题",
  intro: "简介", location: "所在地", availability: "状态", about: "关于我", eyebrow: "小标题",
  title: "标题", body: "正文", sections: "章节标题", education: "教育经历", stats: "数据",
  skills: "技能", projects: "项目", institution: "学校", school: "院系", degree: "学位",
  period: "时间", detailLabel: "备注名", detail: "备注", value: "数值", label: "名称",
  category: "分类", year: "年份", description: "描述", tags: "标签", flow: "流程",
  href: "链接", image: "配图", contact: "联系", note: "说明",
};

// 这些字段通常很长，直接给多行输入框
const MULTILINE = new Set(["body", "intro", "description", "note", "headline"]);

type AssetList = { models: Array<{ name: string; size: number }>; images: Array<{ name: string; size: number }> };
type Path = Array<string | number>;

/** 不可变地改一处深层值，返回新树。 */
function setIn(root: any, path: Path, value: unknown): any {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[key as number] = setIn(root[key as number], rest, value);
    return copy;
  }
  return { ...root, [key]: setIn(root[key as string], rest, value) };
}

/** 照着样本造一个同形状的空值，用于数组"添加"。 */
function blankLike(sample: unknown): unknown {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankLike(v)]));
  }
  return "";
}

async function post(url: string, body: BodyInit, json: boolean) {
  try {
    const res = await fetch(url, { method: "POST", body, headers: json ? { "Content-Type": "application/json" } : undefined });
    const data = (await res.json()) as { ok?: boolean; error?: string; exists?: boolean };
    if (!res.ok || !data.ok) return { error: data.error ?? "未知错误", exists: data.exists };
    return {};
  } catch {
    return { error: "网络错误" };
  }
}

const label = (key: string | number) => (typeof key === "number" ? `${key + 1}` : LABELS[key] ?? key);
/** 数组项标题用「父级名 + 序号」，否则嵌套数组里会出现一堆光秃秃的 "1" "2"。 */
const title = (path: Path) => {
  const key = path[path.length - 1];
  if (typeof key !== "number") return label(key);
  const parent = path[path.length - 2];
  return parent === undefined ? `${key + 1}` : `${label(parent)} ${key + 1}`;
};
const isColor = (path: Path) => path[0] === "theme" && typeof path[1] === "string";
const assetKind = (path: Path): keyof AssetList | null => {
  const key = path[path.length - 1];
  if (key === "model") return "models";
  if (path.includes("images") || key === "image") return "images";
  return null;
};

type FieldProps = {
  node: unknown;
  path: Path;
  assets: AssetList;
  onChange: (path: Path, value: unknown) => void;
};

/** 递归渲染一个节点：字符串→输入框，数组→可增删的卡片列表，对象→嵌套分组。 */
function Field({ node, path, assets, onChange }: FieldProps) {
  const key = path[path.length - 1];

  if (typeof node === "string") {
    const kind = assetKind(path);
    const id = path.join("-");
    return (
      <label className="admin-field" htmlFor={id}>
        <span>{title(path)}</span>
        {kind ? (
          <div className="admin-inline">
            {/* 素材用下拉选已上传的文件，避免手打路径打错 */}
            <select id={id} value={node} onChange={(e) => onChange(path, e.target.value)}>
              <option value="">（不使用）</option>
              {assets[kind].map((file) => {
                const value = `${kind}/${file.name}`;
                return <option key={value} value={value}>{file.name}</option>;
              })}
              {node && !assets[kind].some((f) => `${kind}/${f.name}` === node) && (
                <option value={node}>{node}（当前）</option>
              )}
            </select>
            {kind === "images" && node && <img className="admin-thumb" src={assetUrl(node)} alt="" />}
          </div>
        ) : isColor(path) ? (
          <div className="admin-inline">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(node) ? node : "#000000"}
              onChange={(e) => onChange(path, e.target.value)} aria-label={`${label(key)} 取色`} />
            <input id={id} type="text" value={node} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        ) : MULTILINE.has(String(key)) ? (
          <textarea id={id} rows={3} value={node} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <input id={id} type="text" value={node} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </label>
    );
  }

  if (Array.isArray(node)) {
    const sample = node[0];
    const flat = node.every((v) => typeof v === "string");
    return (
      <fieldset className="admin-group">
        <legend>{title(path)}<small>{node.length}</small></legend>
        <div className={flat ? "admin-chips" : "admin-cards"}>
          {node.map((item, i) => (
            <div className="admin-item" key={i}>
              <Field node={item} path={[...path, i]} assets={assets} onChange={onChange} />
              <button type="button" className="icon-button subtle admin-del" title={`删除第 ${i + 1} 项`}
                aria-label={`删除第 ${i + 1} 项`}
                onClick={() => onChange(path, node.filter((_, j) => j !== i))}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button text-button admin-add" disabled={sample === undefined}
          title={sample === undefined ? "空数组无法推断新项结构，请先在 src/content.json 里加一项" : undefined}
          onClick={() => onChange(path, [...node, blankLike(sample)])}>
          <Plus size={15} /> 添加{label(key)}
        </button>
      </fieldset>
    );
  }

  if (node && typeof node === "object") {
    return (
      <fieldset className="admin-group">
        <legend>{title(path)}</legend>
        {Object.entries(node).map(([k, v]) => (
          <Field key={k} node={v} path={[...path, k]} assets={assets} onChange={onChange} />
        ))}
      </fieldset>
    );
  }

  return null;
}
// 顶层字段分成几组，避免一页拉到底。copy.zh / copy.en 各自成一组。
const TABS = [
  { id: "basic", name: "基础", keys: ["monogram", "email", "model", "socials", "images"] },
  { id: "theme", name: "配色", keys: ["theme"] },
  { id: "zh", name: "中文内容", keys: [] },
  { id: "en", name: "English", keys: [] },
] as const;

export function Admin() {
  const initial = content as unknown as Record<string, any>;
  const [tree, setTree] = useState(initial);
  const [tab, setTab] = useState<string>("basic");
  const [assets, setAssets] = useState<AssetList>({ models: [], images: [] });
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadKind = useRef<keyof AssetList>("images");
  const themeStyle = useMemo(() => {
    const t = tree.theme ?? {};
    return {
      "--accent": t.accent, "--accent-2": t.accentAlt,
      "--paper": t.paper, "--ink": t.ink, "--night": t.night,
    } as React.CSSProperties;
  }, [tree.theme]);

  // 保存后 HMR 会把 content.json 的新值推进来，脏标记就靠和模块当前值比对。
  const dirty = useMemo(() => JSON.stringify(tree) !== JSON.stringify(initial), [tree, initial]);

  const say = useCallback((text: string, bad = false) => {
    setNotice({ text, bad });
    window.setTimeout(() => setNotice(null), bad ? 5000 : 2400);
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch(`${ENDPOINT}/assets`);
      const data = (await res.json()) as AssetList & { ok?: boolean };
      if (data.ok) setAssets({ models: data.models ?? [], images: data.images ?? [] });
    } catch {
      /* 列不出来只是下拉为空，不阻塞编辑 */
    }
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);
  useEffect(() => { document.title = "内容管理 | Admin"; }, []);

  // 离开前拦一下未保存的改动：这页的输入不落 localStorage，刷新就没了。
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = useCallback((path: Path, value: unknown) => {
    setTree((current) => setIn(current, path, value));
  }, []);
  const save = async () => {
    setSaving(true);
    const { error } = await post(`${ENDPOINT}/tree`, JSON.stringify(tree), true);
    setSaving(false);
    say(error ? `保存失败：${error}` : "已保存 ✓，首页已同步", !!error);
  };

  const upload = async (file: File) => {
    const send = (overwrite: boolean) => {
      const form = new FormData();
      form.set("kind", uploadKind.current);
      form.set("file", file);
      if (overwrite) form.set("overwrite", "1");
      return post(`${ENDPOINT}/upload`, form, false);
    };
    let result = await send(false);
    // 同名不静默覆盖：素材可能已被别处引用，覆盖不可逆，问一句再说。
    if (result.exists && window.confirm(`${file.name} 已存在，覆盖它？`)) result = await send(true);
    if (result.error) say(`上传失败：${result.error}`, true);
    else { say(`已上传 ${file.name} ✓`); void loadAssets(); }
  };

  const pick = (kind: keyof AssetList) => {
    uploadKind.current = kind;
    fileInput.current?.click();
  };

  const activeKeys: readonly string[] =
    tab === "zh" || tab === "en" ? [] : TABS.find((t) => t.id === tab)!.keys;

  return (
    // 主题变量在 App 里是挂在 .site 上的内联样式，/admin 不在 .site 里，所以这里自己挂一份。
    // 顺带让「配色」页改颜色时当场看到效果，不用回首页确认。
    <div className="admin" style={themeStyle}>
      <header className="admin-header glass">
        <a className="button text-button" href="./"><ArrowLeft size={16} /> 回到首页</a>
        <strong>内容管理</strong>
        <div className="admin-actions">
          <button type="button" className="button text-button" onClick={() => pick("models")}>
            <Upload size={15} /> 传模型
          </button>
          <button type="button" className="button text-button" onClick={() => pick("images")}>
            <Upload size={15} /> 传图片
          </button>
          <button type="button" className="button text-button" disabled={!dirty} onClick={() => setTree(initial)}>
            <RotateCcw size={15} /> 放弃改动
          </button>
          <button type="button" className="button primary" disabled={!dirty || saving} onClick={save}>
            <Save size={16} /> {saving ? "保存中…" : dirty ? "保存" : "已保存"}
          </button>
        </div>
      </header>

      <input ref={fileInput} type="file" hidden accept=".glb,.gltf,.png,.jpg,.jpeg,.webp,.svg"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />

      <nav className="admin-tabs" aria-label="内容分组">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "is-active" : ""}
            aria-current={tab === t.id ? "true" : undefined} onClick={() => setTab(t.id)}>
            {t.name}
          </button>
        ))}
      </nav>

      <main className="admin-body">
        {activeKeys.map((key) => (
          <Field key={key} node={tree[key]} path={[key]} assets={assets} onChange={change} />
        ))}
        {(tab === "zh" || tab === "en") &&
          Object.entries(tree.copy[tab]).map(([k, v]) => (
            <Field key={k} node={v} path={["copy", tab, k]} assets={assets} onChange={change} />
          ))}
      </main>

      {notice && (
        <div className={`admin-notice ${notice.bad ? "is-bad" : ""}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      )}
    </div>
  );
}
