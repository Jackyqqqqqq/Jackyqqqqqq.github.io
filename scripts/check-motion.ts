// 人像章节过渡的最小验证：跑 `npm run check:motion`。
// 只测 src/motion.ts 的纯函数 —— 这里出问题就是用户抱怨的"跳变"，值得单独守住。
import assert from "node:assert/strict";
import test from "node:test";
import {
  CAMERA_BASE_Z,
  chapterEase,
  compactPath,
  desktopPath,
  emptySample,
  narrowPath,
  samplePath,
  type Pose,
} from "../src/motion.ts";

const paths: Array<[string, Pose[]]> = [
  ["desktop", desktopPath],
  ["compact", compactPath],
  ["narrow", narrowPath],
];

test("chapterEase 在章节两端静止且单调", () => {
  assert.equal(chapterEase(0), 0);
  assert.equal(chapterEase(0.2), 0, "章节居中附近应完全不动");
  assert.equal(chapterEase(1), 1);
  assert.equal(chapterEase(0.8), 1);
  let previous = -1;
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const value = chapterEase(t);
    assert.ok(value >= previous - 1e-12, `t=${t} 处出现回退`);
    previous = value;
  }
  // 两端导数趋 0：起步/收尾的速度必须远小于中段，贴到章节时才没有折角。
  const speedAt = (t: number) => (chapterEase(t + 1e-4) - chapterEase(t - 1e-4)) / 2e-4;
  const mid = speedAt(0.5);
  assert.ok(speedAt(0.27) < mid * 0.1, `起步太快：${speedAt(0.27)} vs 中段 ${mid}`);
  assert.ok(speedAt(0.73) < mid * 0.1, `收尾太快：${speedAt(0.73)} vs 中段 ${mid}`);
});

/** -0 也算归零：out.z = -arc * … 在 arc 为 0 时会得到 -0，加 0 归一。 */
const zero = (value: number) => value + 0;

/** 转体是累计的：整数章节点上 rotationY 可能是 2πk，视觉上仍是归位。sin(y/2) 只在 2πk 处为 0。 */
const wholeTurns = (value: number) => Math.abs(Math.sin(value / 2)) < 1e-9;

test("samplePath 在章节整数点上正好落在该章的姿态", () => {
  for (const [name, path] of paths) {
    path.forEach((pose, index) => {
      const s = samplePath(path, index, true, emptySample());
      assert.equal(s.x, pose.x, `${name} 第 ${index} 章 x 不匹配`);
      assert.equal(s.y, pose.y, `${name} 第 ${index} 章 y 不匹配`);
      assert.equal(s.scale, pose.scale, `${name} 第 ${index} 章 scale 不匹配`);
      // 章节上必须完全归位：还留着深度或转身就意味着人像停在半途。
      assert.equal(zero(s.z), 0, `${name} 第 ${index} 章 z 未归零`);
      assert.ok(wholeTurns(s.rotationY), `${name} 第 ${index} 章 rotationY=${s.rotationY} 不是整圈`);
      assert.equal(zero(s.rotationZ), 0, `${name} 第 ${index} 章 rotationZ 未归零`);
    });
  }
});

test("samplePath 连续：相邻采样的位移有上界，不存在跳变", () => {
  const step = 0.002;
  // 每 0.002 章的位移上限。跨屏那段横向约 5.3 单位，线性摊到整段约 0.011/步，
  // 留两倍余量；一旦哪次改姿态表引入断裂，这里会立刻超限。
  // ponytail: rotationY 含整圈转体（2π/段，smoothstep 峰值斜率 1.5），单独放宽到 0.04。
  const limitOf = (key: string) => (key === "rotationY" ? 0.04 : 0.025);
  for (const [name, path] of paths) {
    for (const motion of [true, false]) {
      let previous = samplePath(path, 0, motion, emptySample());
      for (let flow = step; flow <= path.length - 1 + 1e-9; flow += step) {
        const current = samplePath(path, flow, motion, emptySample());
        for (const key of ["x", "y", "z", "scale", "rotationY", "rotationZ", "ringX", "ringY"] as const) {
          const delta = Math.abs(current[key] - previous[key]);
          assert.ok(
            delta < limitOf(key),
            `${name}/motion=${motion} 在 flow=${flow.toFixed(3)} 的 ${key} 跳了 ${delta.toFixed(4)}`,
          );
        }
        previous = current;
      }
    }
  }
});

test("samplePath 越界不抛错，钳到首尾章节", () => {
  const first = samplePath(desktopPath, -3, true, emptySample());
  assert.equal(first.x, desktopPath[0].x);
  const last = samplePath(desktopPath, 99, true, emptySample());
  assert.equal(last.x, desktopPath[desktopPath.length - 1].x);
  const nan = samplePath(desktopPath, Number.NaN, true, emptySample());
  assert.ok(Number.isFinite(nan.x), "NaN 输入不应污染姿态");
});

test("跨屏那段会退到景深里并转身，短段则几乎不动", () => {
  const long = samplePath(desktopPath, 1.5, true, emptySample()); // about → education，横跨整屏
  const short = samplePath(desktopPath, 0.5, true, emptySample()); // hero → about，几乎原地
  // ponytail: 模型 z 上限从 -1.2 改为 -0.6 —— 相机也后拉了，两者合力仍有充足景深感。
  assert.ok(long.z < -0.6, `长段应退到景深里，实际 z=${long.z}`);
  assert.ok(long.z < short.z, "长段退得应比短段更深");
  assert.ok(Math.abs(short.z) < 0.25, `短段不该大幅后退，实际 z=${short.z}`);
  assert.ok(Math.abs(short.rotationY) < 0.3, `短段不该转体，实际 ${short.rotationY}`);
  // 转体是累计的，方向要和上一个章节点比：长段中点应转过大半圈（含 2π 整圈的一半）。
  const node1 = samplePath(desktopPath, 1, true, emptySample());
  const node2 = samplePath(desktopPath, 2, true, emptySample());
  const back = samplePath(desktopPath, 2.5, true, emptySample()); // education → projects，向右
  assert.ok(long.rotationY - node1.rotationY > 2, `向左跨屏应朝 +Y 大幅转体，实际 ${long.rotationY - node1.rotationY}`);
  assert.ok(back.rotationY - node2.rotationY < -2, `向右跨屏应朝 -Y 大幅转体，实际 ${back.rotationY - node2.rotationY}`);
});

test("运镜：相机在跨章途中后拉横移，整数章节点归零", () => {
  // 在章节整数点，相机应回到基础位置（crossing=0 → camX/Y=0，camZ=CAMERA_BASE_Z）
  for (let i = 0; i < desktopPath.length; i++) {
    const s = samplePath(desktopPath, i, true, emptySample());
    assert.ok(Math.abs(s.camX) < 0.001, `chapter ${i}: camX 应为 0，实际 ${s.camX}`);
    assert.ok(Math.abs(s.camY) < 0.001, `chapter ${i}: camY 应为 0，实际 ${s.camY}`);
    assert.ok(Math.abs(s.camZ - CAMERA_BASE_Z) < 0.001, `chapter ${i}: camZ 应为 ${CAMERA_BASE_Z}，实际 ${s.camZ}`);
  }
  // 跨章途中相机应后拉
  const mid = samplePath(desktopPath, 1.5, true, emptySample());
  assert.ok(mid.camZ > CAMERA_BASE_Z, `跨章中间 camZ 应后拉，实际 ${mid.camZ}`);
  assert.ok(Math.abs(mid.camX) > 0.2, `跨屏应有横移，实际 ${mid.camX}`);
});

test("运镜：fov 在合理范围内，关动效时不影响 fov", () => {
  for (const [name, path] of paths) {
    for (let flow = 0; flow <= path.length - 1; flow += 0.1) {
      const s = samplePath(path, flow, true, emptySample());
      assert.ok(s.fov >= 34 && s.fov <= 46, `${name} flow=${flow.toFixed(1)}: fov=${s.fov.toFixed(2)} 超出合理范围`);
    }
  }
});

test("关掉动效后人像只做平移，不再绕行", () => {
  for (const [name, path] of paths) {
    for (let flow = 0; flow <= path.length - 1; flow += 0.05) {
      const s = samplePath(path, flow, false, emptySample());
      assert.equal(zero(s.z), 0, `${name} flow=${flow} 在 reduced-motion 下仍有景深`);
      assert.equal(zero(s.rotationY), 0, `${name} flow=${flow} 在 reduced-motion 下仍在转身`);
      assert.equal(zero(s.rotationZ), 0, `${name} flow=${flow} 在 reduced-motion 下仍在倾斜`);
    }
  }
});
