import { useEffect, useRef, useState } from "react";
import { chapterEase, crossingArc } from "./motion";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

// 液态玻璃的镜面反光：一个 document 级监听，把指针在最近 .glass 元素内的相对位置写进
// --mx/--my，CSS 用它画径向高光。比每个卡片挂一个监听便宜得多。
// 另外写 --px/--py（-1..1 的中心偏移，驱动描边亮度方向和面板倾斜）和 --pd（到中心的归一化距离）。
const SHEEN_VARS = ["--mx", "--my", "--px", "--py", "--pd", "--sheen-on"];

export function usePointerSheen(active: boolean) {
  useEffect(() => {
    if (!active || window.matchMedia("(hover: none)").matches) return;
    let current: HTMLElement | null = null;

    const onMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(".glass") ?? null;
      if (current && current !== target) {
        for (const v of SHEEN_VARS) current.style.removeProperty(v);
      }
      current = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const fx = (event.clientX - rect.left) / rect.width;
      const fy = (event.clientY - rect.top) / rect.height;
      const px = fx * 2 - 1;
      const py = fy * 2 - 1;
      target.style.setProperty("--mx", `${fx * 100}%`);
      target.style.setProperty("--my", `${fy * 100}%`);
      target.style.setProperty("--px", px.toFixed(3));
      target.style.setProperty("--py", py.toFixed(3));
      target.style.setProperty("--pd", Math.min(1, Math.hypot(px, py)).toFixed(3));
      // 高光在元素正中最强、往边缘衰减：CSS 的 :hover 是布尔的，玻璃的反光不是。
      target.style.setProperty("--sheen-on", (1 - Math.min(1, Math.hypot(px, py)) * 0.45).toFixed(3));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active]);
}

// 磁性吸附：挂在 [data-magnetic] 元素上，指针靠近时元素向光标方向微移几像素，
// 离开后 CSS transition 把它弹回原位。位移走独立的 translate 属性，
// 不和各组件已有的 transform 悬停态打架。
export function useMagnetic(active: boolean) {
  useEffect(() => {
    if (!active || window.matchMedia("(hover: none)").matches) return;
    let current: HTMLElement | null = null;

    const clear = () => {
      if (!current) return;
      current.style.removeProperty("--mgx");
      current.style.removeProperty("--mgy");
      current = null;
    };
    const onMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (target !== current) {
        clear();
        current = target;
      }
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);
      target.style.setProperty("--mgx", `${(Math.max(-1, Math.min(1, dx)) * 4).toFixed(2)}px`);
      target.style.setProperty("--mgy", `${(Math.max(-1, Math.min(1, dy)) * 3).toFixed(2)}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      clear();
    };
  }, [active]);
}

// hero-meta 里的本地时钟：20s 走一次，显示分针级精度就够。
// ponytail: 时区写死 Asia/Shanghai，因为 copy.location 固定是杭州；
// 哪天内容里加了时区字段再改成由 content.json 驱动。
export function useClock(localeTag: string) {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat(localeTag, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Shanghai",
        }).format(new Date()),
      );
    tick();
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, [localeTag]);
  return now;
}

// 顶部进度条：把整页滚动比例写进 --progress，CSS 用 scaleX 渲染，不触发布局。
export function useScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--progress", max > 0 ? String(Math.min(1, window.scrollY / max)) : "0");
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--progress");
    };
  }, []);
}

// 每块面板相对视口中心的位置：--pass 带符号（负=在上方，正=在下方），--near 是贴近度。
// 用最近边而不是中心测距，否则比视口还高的项目卡在读的时候会被自己压暗。
function paintShots(viewportHeight: number) {
  const center = viewportHeight * 0.5;
  const nodes = document.querySelectorAll<HTMLElement>("[data-shot]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    const gap = rect.top > center ? rect.top - center : rect.bottom < center ? rect.bottom - center : 0;
    const pass = Math.max(-1.2, Math.min(1.2, gap / Math.max(1, viewportHeight * 0.62)));
    const distance = Math.min(1, Math.abs(pass));
    node.style.setProperty("--pass", pass.toFixed(4));
    node.style.setProperty("--near", (1 - distance * distance).toFixed(4));
  }
}

function clearShots() {
  for (const node of document.querySelectorAll<HTMLElement>("[data-shot]")) {
    node.style.removeProperty("--pass");
    node.style.removeProperty("--near");
  }
}

// 章节流：把滚动位置映射成连续的章节坐标（0 = 第一章，1 = 第二章 …）。
// 人像读 ref 里的连续值插值姿态，导航只用取整后的下标 —— 离散 state 翻转时
// 人像的目标不再整段跳走，这是"关于/经历/项目"之间跳变的根因。
//
// 运镜的 DOM 一侧也挂在这一次测量上：同一帧里先读完所有 rect 再统一写 CSS 变量，
// 比另起一个 rAF 循环少一轮 layout flush。shots=false（减动效）时只算 flow。
export function useChapterFlow(ids: string[], shots: boolean) {
  const flow = useRef(0);
  const [index, setIndex] = useState(0);
  const key = ids.join("|");

  useEffect(() => {
    const sectionIds = key.split("|");
    const root = document.documentElement;
    let scheduled = false;

    const commit = (next: number, activeIndex: number) => {
      flow.current = next;
      setIndex(activeIndex);
      root.style.setProperty("--flow", next.toFixed(4));
      // 黑边、极光呼吸都由 --crossing 驱动，关动效时钳成 0，别让页面在静止偏好下抽动。
      root.style.setProperty("--crossing", (shots ? crossingArc(next) : 0).toFixed(4));
    };

    const update = () => {
      scheduled = false;
      const viewportHeight = window.innerHeight;
      const focus = window.scrollY + viewportHeight * 0.5;
      // 每章是一段"驻留区间"而不是一个中心点：焦点在章节内部时 flow 恒为整数，
      // 人像完全落位；过渡只发生在章节之间的缝隙。否则项目这种长章节会让
      // 读者一边看卡片、人像一边悬在半途的飞行姿态里。
      const zones: Array<{ index: number; start: number; end: number }> = [];
      sectionIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const half = Math.min(viewportHeight * 0.5, rect.height / 2);
        zones.push({ index, start: top + half, end: top + rect.height - half });
      });
      if (shots) paintShots(viewportHeight);
      if (zones.length === 0) return;
      if (zones.length === 1 || focus <= zones[0].start) {
        commit(zones[0].index, zones[0].index);
        return;
      }

      const last = zones[zones.length - 1];
      if (focus >= last.end) {
        commit(last.index, last.index);
        return;
      }

      for (let i = 0; i < zones.length; i += 1) {
        const zone = zones[i];
        if (focus >= zone.start && focus <= zone.end) {
          commit(zone.index, zone.index);
          return;
        }
        const next = zones[i + 1];
        if (!next || focus < zone.end || focus >= next.start) continue;
        const span = next.start - zone.end;
        const t = span > 0 ? (focus - zone.end) / span : 0;
        commit(zone.index + (next.index - zone.index) * chapterEase(t), t < 0.5 ? zone.index : next.index);
        return;
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--flow");
      root.style.removeProperty("--crossing");
      clearShots();
    };
  }, [key, shots]);

  return { flow, index };
}
