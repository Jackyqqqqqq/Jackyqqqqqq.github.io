const CHAPTER_HOLD = 0.26;

export function chapterEase(t: number) {
  const p = Math.min(1, Math.max(0, (t - CHAPTER_HOLD) / (1 - CHAPTER_HOLD * 2)));
  return p * p * (3 - 2 * p);
}

/** 章节之间的“运镜进度”：停在章节上是 0，走到两章正中间是 1。 */
export function crossingArc(flow: number) {
  const safe = Number.isFinite(flow) ? flow : 0;
  const t = safe - Math.floor(safe);
  return Math.sin(t * Math.PI);
}

/** fov 是这一章的机位焦段：数值越小越长焦、越"贴脸"。 */
export type Pose = { x: number; y: number; scale: number; ringX: number; ringY: number; fov: number };

export const desktopPath: Pose[] = [
  { x: 2.25, y: -0.12, scale: 1, ringX: 0, ringY: 0, fov: 38 },
  { x: 2.52, y: -0.16, scale: 0.86, ringX: 0.08, ringY: -0.2, fov: 40 },
  { x: -2.62, y: -0.2, scale: 0.82, ringX: -0.08, ringY: 0.22, fov: 41 },
  { x: 2.66, y: -0.08, scale: 0.8, ringX: 0.12, ringY: -0.18, fov: 41 },
  { x: 2.4, y: -0.15, scale: 0.92, ringX: -0.05, ringY: 0.18, fov: 39 },
];
export const compactPath: Pose[] = [
  { x: 0.72, y: 1.18, scale: 0.43, ringX: 0, ringY: 0, fov: 38 },
  { x: 0.68, y: 0.78, scale: 0.47, ringX: 0.08, ringY: -0.2, fov: 39 },
  { x: -0.68, y: 0.78, scale: 0.47, ringX: -0.08, ringY: 0.22, fov: 40 },
  { x: 0.7, y: 0.84, scale: 0.44, ringX: 0.1, ringY: -0.16, fov: 40 },
  { x: 0.62, y: 0.76, scale: 0.5, ringX: -0.05, ringY: 0.18, fov: 39 },
];
export const narrowPath: Pose[] = [
  { x: 1.35, y: -0.14, scale: 0.72, ringX: 0, ringY: 0, fov: 38 },
  { x: 1.45, y: -0.16, scale: 0.7, ringX: 0.08, ringY: -0.2, fov: 40 },
  { x: -1.42, y: -0.18, scale: 0.7, ringX: -0.08, ringY: 0.22, fov: 41 },
  { x: 1.5, y: -0.05, scale: 0.66, ringX: 0.12, ringY: -0.18, fov: 41 },
  { x: 1.4, y: -0.14, scale: 0.76, ringX: -0.05, ringY: 0.18, fov: 39 },
];

/** 相机静止时的基准位置，和 Canvas 的初始 camera 必须一致。 */
export const CAMERA_BASE_Z = 8;

/** 段内横移超过这个值算“跨屏”，人物转整整一圈；短段只是推镜，不该原地转体。 */
const FULL_SPIN_TRAVEL = 1;

export type Sample = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  rotationZ: number;
  ringX: number;
  ringY: number;
  camX: number;
  camY: number;
  camZ: number;
  camPan: number;
  camRoll: number;
  fov: number;
  crossing: number;
};
export function emptySample(): Sample {
  return {
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rotationY: 0,
    rotationZ: 0,
    ringX: 0,
    ringY: 0,
    camX: 0,
    camY: 0,
    camZ: CAMERA_BASE_Z,
    camPan: 0,
    camRoll: 0,
    fov: desktopPath[0].fov,
    crossing: 0,
  };
}

export function samplePath(path: Pose[], flow: number, motion: boolean, out: Sample): Sample {
  // Number.isFinite 兜住 NaN：布局测量偶发拿到 0 尺寸时会算出 NaN，
  // 直接 floor(NaN) 会索引到 undefined，让整个画面停在最后一帧。
  const safe = Number.isFinite(flow) ? flow : 0;
  const clamped = Math.min(path.length - 1, Math.max(0, safe));
  const from = path[Math.floor(clamped)];
  const to = path[Math.min(path.length - 1, Math.ceil(clamped))];
  const t = clamped - Math.floor(clamped);

  out.x = from.x + (to.x - from.x) * t;
  out.y = from.y + (to.y - from.y) * t;
  out.scale = from.scale + (to.scale - from.scale) * t;
  out.ringX = from.ringX + (to.ringX - from.ringX) * t;
  out.ringY = from.ringY + (to.ringY - from.ringY) * t;

  const travel = to.x - from.x;
  const arc = motion ? Math.sin(t * Math.PI) : 0;
  const reach = Math.min(1, Math.abs(travel) / 4.4);
  const heading = Math.sign(travel);
  out.crossing = arc;

  // 主体自身的退距压到 0.09：现在相机也会后拉，两边同时退会把人推得太小。
  out.z = -arc * (0.09 + reach * 0.62);
  // 弧线飞行：跨屏途中先升后落，配合后拉像一次起跳，而不是贴地平移。
  out.y += arc * (0.06 + reach * 0.38);

  // 长段跨屏时人物转整整一圈（2π 视觉上归位），短段保留原来的半侧身。
  // 圈数用"已完成段累计 + 当前段进度"算，跨节点数值连续，lerp 不会倒着回卷。
  const spinOf = (index: number) => {
    const d = path[index + 1].x - path[index].x;
    return Math.abs(d) > FULL_SPIN_TRAVEL ? -Math.sign(d) * Math.PI * 2 : 0;
  };
  let spin = 0;
  if (motion) {
    const seg = Math.floor(clamped);
    for (let i = 0; i < seg; i += 1) spin += spinOf(i);
    if (seg < path.length - 1) spin += spinOf(seg) * t * t * (3 - 2 * t);
  }
  out.rotationY = -heading * arc * (0.2 + reach * 0.5) + spin;
  // 入弯侧倾：横移越远压得越低，像滑行入弯而不是直挺挺地平移。
  out.rotationZ = heading * arc * (0.04 + reach * 0.08);

  // 运镜：跨章途中相机横移跟拍 + 后拉留白 + 微升机 + 荷兰角，走到下一章全部归零，
  // 所以每个章节的构图仍然只由 Pose 决定，机位不会带偏排版。
  out.camX = heading * arc * (0.24 + reach * 1.05);
  out.camY = arc * (0.07 + reach * 0.26);
  out.camZ = CAMERA_BASE_Z + arc * (0.3 + reach * 1.6);
  // 横移量换算成极小的回摇，让平移读起来像跟拍而不是整块画面滑动。
  out.camPan = -out.camX * 0.05;
  out.camRoll = -heading * arc * (0.008 + reach * 0.024);
  // 后拉时同步收焦段：视野被距离拉宽的部分补回来，保持“移动感强、主体不缩水”。
  const dolly = out.camZ - CAMERA_BASE_Z;
  out.fov = from.fov + (to.fov - from.fov) * t - dolly * 1.15;
  return out;
}
