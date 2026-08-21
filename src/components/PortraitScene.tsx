import { Environment, Lightformer, Line, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { assetUrl } from "../config";
import { CAMERA_BASE_Z, compactPath, desktopPath, emptySample, narrowPath, samplePath } from "../motion";

export type SceneStage = "hero" | "about" | "education" | "projects" | "contact";

type SceneProps = {
  model: string;
  accent: string;
  accentAlt: string;
  dark: boolean;
  motion: boolean;
  compact: boolean;
  narrow: boolean;
  /** 连续的章节坐标（0 = hero，1 = about …），由 useChapterFlow 写入。 */
  flow: { current: number };
  onLoaded?: () => void;
};

const modelHeight = 5.65;
const modelWidth = modelHeight * 0.706;

function NormalizedModel({ path, onLoaded }: { path: string; onLoaded?: () => void }) {
  const { scene } = useGLTF(assetUrl(path));

  // Suspense 解除后才会挂载，此时模型已可见 —— 用它关掉 DOM 层的 shimmer 占位。
  useEffect(() => { onLoaded?.(); }, [onLoaded]);

  const normalized = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const longestDimension = Math.max(size.x, size.y, size.z, 0.001);
    const scale = modelHeight / longestDimension;

    clone.position.set(-center.x, -center.y, -center.z);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });

    const root = new THREE.Group();
    root.scale.setScalar(scale);
    root.add(clone);
    return root;
  }, [scene]);

  return <primitive object={normalized} />;
}

function Portrait({ model, accent, accentAlt, dark, motion, compact, narrow, flow, onLoaded }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const subject = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const ringSpin = useRef(0);
  const settled = useRef(false);
  const sample = useRef(emptySample());
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const altColor = useMemo(() => new THREE.Color(accentAlt), [accentAlt]);
  const path = compact ? compactPath : narrow ? narrowPath : desktopPath;

  // 接触阴影：一张 128px 径向渐变贴图贴在地面，比实时深度阴影便宜几个量级。
  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    gradient.addColorStop(0, "rgba(6, 8, 8, 0.62)");
    gradient.addColorStop(0.55, "rgba(6, 8, 8, 0.22)");
    gradient.addColorStop(1, "rgba(6, 8, 8, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // 断点切换会换整条路径，需要重新贴一次，避免从旧断点的位置慢慢爬过去。
  useEffect(() => { settled.current = false; }, [path]);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  useFrame((state, delta) => {
    if (!group.current || !subject.current || !rings.current) return;
    // 阻尼只用来滤掉滚轮的离散步进（约 160ms），姿态本身已经跟着滚动连续变化。
    const ease = settled.current ? 1 - Math.exp(-delta * 6) : 1;
    settled.current = true;
    const pointerX = motion ? pointer.current.x : 0;
    const pointerY = motion ? pointer.current.y : 0;
    const target = samplePath(path, flow.current, motion, sample.current);

    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, target.x + pointerX * 0.11, ease);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, target.y + pointerY * 0.055, ease);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, target.z, ease);
    const scale = THREE.MathUtils.lerp(group.current.scale.x, target.scale, ease);
    group.current.scale.setScalar(scale);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target.rotationY, ease);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, target.rotationZ, ease);

    // 运镜：机位值同样来自 samplePath —— motion=false 时那些量全为 0，
    // 所以这里不需要额外分支，关掉动效相机会自己滑回 [0, 0, CAMERA_BASE_Z]。
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, target.camX, ease);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, target.camY, ease);
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, target.camZ, ease);
    cam.rotation.y = THREE.MathUtils.lerp(cam.rotation.y, target.camPan, ease);
    cam.rotation.z = THREE.MathUtils.lerp(cam.rotation.z, target.camRoll, ease);
    if (cam instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(cam.fov, target.fov, ease);
      // ponytail: 每帧 updateProjectionMatrix 会重算投影矩阵，用 0.01° 阈值挡住稳态帧。
      if (Math.abs(nextFov - cam.fov) > 0.01) {
        cam.fov = nextFov;
        cam.updateProjectionMatrix();
      }
    }

    // 光环平时慢转，过章时跟着 crossing 加速甩起来，到站再缓回巡航速度。
    ringSpin.current += motion ? delta * (0.035 + target.crossing * 1.3) : 0;
    rings.current.rotation.x = THREE.MathUtils.lerp(rings.current.rotation.x, target.ringX, ease);
    rings.current.rotation.y = THREE.MathUtils.lerp(rings.current.rotation.y, target.ringY, ease);
    rings.current.rotation.z = THREE.MathUtils.lerp(rings.current.rotation.z, ringSpin.current, ease);

    // 接触阴影贴着人物脚下走：起跳时缩小、变淡、铺开，落地时收拢变实。
    if (shadow.current) {
      const bottom = group.current.position.y - (modelHeight * scale) / 2;
      shadow.current.position.set(group.current.position.x, bottom + 0.02, group.current.position.z);
      const spread = scale * (2.3 + target.crossing * 0.8);
      shadow.current.scale.set(spread, spread * 0.42, 1);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - target.crossing * 0.55);
    }
    // 轮廓光在飞行途中爆发，到站回落 —— 移动的能量感。
    if (rim.current) rim.current.intensity = (dark ? 44 : 34) * (1 + target.crossing * 0.9);

    const time = state.clock.elapsedTime;
    subject.current.position.y = motion ? Math.sin(time * 1.05) * 0.045 : 0;
    subject.current.rotation.x = THREE.MathUtils.lerp(subject.current.rotation.x, pointerY * 0.055, ease);
    subject.current.rotation.y = THREE.MathUtils.lerp(
      subject.current.rotation.y,
      pointerX * 0.48 + (motion ? Math.sin(time * 0.34) * 0.035 : 0),
      ease,
    );
  });

  return (
    <>
      {/* 边缘光：主色，从背后打出轮廓；强度在 useFrame 里随 crossing 呼吸 */}
      <spotLight
        ref={rim}
        position={[-4.2, 2.6, -3.4]}
        angle={0.9}
        penumbra={1}
        intensity={dark ? 44 : 34}
        color={accent}
        distance={16}
      />
      {/* 手机上人物悬在版面中段，脚下没有"地面"可言，阴影反而出戏 */}
      {!compact && (
        <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[2.2, -2.6, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}
      <group ref={group}>
      <group ref={rings} position={[0.02, 0.28, -0.76]}>
        <mesh rotation={[0, 0, 0.2]} scale={[1, 0.58, 1]}>
          <torusGeometry args={[2.18, 0.012, 8, 180]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[0, 0, -0.55]} scale={[0.8, 1, 1]}>
          <torusGeometry args={[1.74, 0.009, 8, 160]} />
          <meshBasicMaterial color={altColor} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[0, 0, 1.08]} scale={[1.1, 0.46, 1]}>
          <torusGeometry args={[1.42, 0.006, 8, 140]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.26} />
        </mesh>
      </group>

      <Line
        points={[
          [-modelWidth * 0.58, -modelHeight * 0.43, -0.52],
          [-modelWidth * 0.63, modelHeight * 0.36, -0.52],
          [modelWidth * 0.46, modelHeight * 0.5, -0.52],
        ]}
        color={accentAlt}
        lineWidth={0.75}
        transparent
        opacity={0.3}
      />

      <group ref={subject}>
        <NormalizedModel path={model} onLoaded={onLoaded} />
      </group>
    </group>
    </>
  );
}

function SceneContent(props: SceneProps) {
  // 环境光压到很低，让主光/边缘光/补光各自可见 —— 原来 ambient 1.7 + hemi 1.8 把人像照平了。
  return (
    <>
      <ambientLight intensity={props.dark ? 0.42 : 0.6} />
      <hemisphereLight
        color={props.dark ? "#c9d8ff" : "#fff7ef"}
        groundColor={props.dark ? "#141c20" : "#8b9691"}
        intensity={props.dark ? 0.7 : 0.95}
      />
      {/* 主光：偏暖，斜上方 45° */}
      <directionalLight position={[4.5, 5.5, 5]} intensity={props.dark ? 2.4 : 3.0} color="#fff2e4" />
      {/* 补光：辅色，压暗部 */}
      <directionalLight position={[-3.4, -0.6, 3.2]} intensity={props.dark ? 0.7 : 1.0} color={props.accentAlt} />
      {/* 底部反光，模拟地面弹光 */}
      <pointLight position={[0, -3.2, 2.6]} intensity={props.dark ? 5 : 7} color={props.accentAlt} distance={9} />

      {/* 人像的 PBR 材质需要环境反射才有高光层次。用本地 Lightformer 生成，不下载 HDR。 */}
      {!props.compact && (
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={props.dark ? 1.6 : 2.4} position={[3, 3, 2]} scale={[6, 6, 1]} color="#fff5ea" />
          <Lightformer intensity={props.dark ? 1.1 : 1.5} position={[-4, 1, -2]} scale={[5, 5, 1]} color={props.accent} />
          <Lightformer intensity={0.8} position={[0, -3, 3]} scale={[7, 3, 1]} color={props.accentAlt} />
        </Environment>
      )}

      <Portrait {...props} />
    </>
  );
}

export function PortraitScene(props: SceneProps) {
  return (
    <Canvas
      className="portrait-canvas"
      camera={{ position: [0, 0, CAMERA_BASE_Z], fov: desktopPath[0].fov, near: 0.1, far: 100 }}
      dpr={[1, props.compact ? 1.4 : 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      fallback={<div className="canvas-fallback" />}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
