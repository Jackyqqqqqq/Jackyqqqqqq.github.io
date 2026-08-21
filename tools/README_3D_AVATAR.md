# 🎭 生成高质量 3D 头像模型

## 方案对比

| 方案 | 质量 | 速度 | 成本 | VRAM 需求 |
|------|------|------|------|-----------|
| **TripoSR** (本地) | ⭐⭐⭐ | 快 (~20秒) | 免费 | 6GB |
| **Hunyuan3D V3** (云端) | ⭐⭐⭐⭐⭐ | 中 (~90秒) | $0.375/次 | 无 |

## 推荐方案：Hunyuan3D V3 (云端 API)

### 为什么选它？
- 🏆 **2026 年最佳图转3D模型**，专门优化人物/头像效果
- 🎨 自动 PBR 材质（金属度/粗糙度/法线），Three.js 直接用
- 🚀 注册送 $1 免费额度，够生成 2-3 次测试

### 使用步骤

#### 1. 安装依赖
```bash
pip install fal-client
```

#### 2. 获取 API Key
- 注册：https://fal.ai （邮箱注册，无需信用卡）
- 获取 Key：https://fal.ai/dashboard/keys

#### 3. 设置环境变量
```bash
# Windows (CMD)
set FAL_KEY=你的API_KEY

# Windows (PowerShell)
$env:FAL_KEY="你的API_KEY"

# Mac / Linux
export FAL_KEY=你的API_KEY
```

#### 4. 运行脚本
```bash
python tools/gen_3d_avatar.py
```

生成的文件会保存到 `output/3d-avatar-hq/avatar.glb`

---

## 前端使用示例

### Three.js (React)
```jsx
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function Avatar() {
  const ref = useRef();
  
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load('/avatar.glb', (gltf) => {
      scene.add(gltf.scene);
    });
  }, []);
  
  return <Canvas><primitive object={model} /></Canvas>;
}
```

### model-viewer (最简单)
```html
<script type="module" src="https://unpkg.com/@google/model-viewer"></script>

<model-viewer 
  src="avatar.glb" 
  auto-rotate 
  camera-controls
  shadow-intensity="1"
  environment-image="neutral"
  style="width: 100%; height: 600px">
</model-viewer>
```

### React Three Fiber
```jsx
import { useGLTF } from '@react-three/drei';

function Avatar() {
  const { scene } = useGLTF('/avatar.glb');
  return <primitive object={scene} />;
}
```

---

## 本地方案（TripoSR）

如果不想用云端 API，可以继续用 TripoSR（已经在 `tools/TripoSR/` 配置好了）：

```bash
cd tools/TripoSR
.venv/Scripts/python.exe run.py "../../你的图片.png" \
  --output-dir "../../output/3d-avatar-local" \
  --model-save-format glb \
  --mc-resolution 512
```

**优点**：完全离线，无限次生成  
**缺点**：质量比云端差，不支持 PBR 材质，网格细节不足

---

## 参考资料

- [Hunyuan3D V3 官方文档](https://fal.ai/models/fal-ai/hunyuan3d-v3/image-to-3d)
- [fal.ai API 定价](https://fal.ai/pricing) — Image-to-3D: $0.375/次
- [TripoSR GitHub](https://github.com/VAST-AI-Research/TripoSR)
- [model-viewer 文档](https://modelviewer.dev/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
