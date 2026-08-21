"""
2.5D 立体卡片生成器（无需下载模型）
=====================================
算法逻辑：
1. 分析图像亮度和边缘，估算"凸出度"
2. 头部、躯干、四肢分层，模拟真实深度
3. 边缘检测 + 梯度分析 → 智能深度图
4. 高密度网格 + 1024px 纹理
"""

import os
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, distance_transform_edt, binary_erosion
import trimesh
import trimesh.visual

INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar-smart-depth.glb")

def smart_depth_estimation(img_arr: np.ndarray, fg_mask: np.ndarray) -> np.ndarray:
    """智能深度估算 - 多层次分析"""
    H, W = img_arr.shape[:2]

    # 1. 距离变换基础深度（边缘=0, 中心=1）
    dist = distance_transform_edt(fg_mask)
    dist_normalized = dist / (dist.max() + 1e-8)

    # 2. 基于亮度的深度提示（亮区=凸出，暗区=凹陷）
    gray = np.mean(img_arr, axis=2) / 255.0
    brightness_depth = (gray - gray[fg_mask > 0].min()) / (gray[fg_mask > 0].max() - gray[fg_mask > 0].min() + 1e-8)
    brightness_depth = brightness_depth * fg_mask

    # 3. 边缘检测（边缘=深度突变）
    from PIL import Image as PILImage
    img_pil = PILImage.fromarray(img_arr)
    edges = np.array(img_pil.filter(ImageFilter.FIND_EDGES).convert('L')) / 255.0
    edge_depth_boost = (1.0 - edges) * fg_mask  # 边缘区域深度降低

    # 4. 垂直位置加权（头部上方，躯干中部，腿部下方）
    y_coords = np.linspace(1, 0, H)[:, np.newaxis]  # 上=1, 下=0
    y_coords = np.tile(y_coords, (1, W))

    # 头部区域（上1/3）额外凸出
    head_mask = (y_coords > 0.65) * fg_mask
    torso_mask = ((y_coords > 0.35) & (y_coords <= 0.65)) * fg_mask
    legs_mask = (y_coords <= 0.35) * fg_mask

    # 合成深度图
    depth = (
        dist_normalized * 0.35 +         # 距离基础
        brightness_depth * 0.25 +        # 亮度提示
        edge_depth_boost * 0.20 +        # 边缘调整
        head_mask * 0.30 +               # 头部凸出
        torso_mask * 0.15 +              # 躯干中等
        legs_mask * 0.05                 # 腿部略平
    )

    # 平滑过渡
    sigma = max(H, W) / 40
    depth = gaussian_filter(depth, sigma=sigma)

    # 归一化
    depth = depth * fg_mask
    depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)

    return depth

def extract_foreground(img_arr: np.ndarray) -> np.ndarray:
    """提取前景 mask"""
    r, g, b = img_arr[:,:,0], img_arr[:,:,1], img_arr[:,:,2]

    # 白色背景检测
    bg = (r > 230) & (g > 230) & (b > 230)
    fg = ~bg

    # 形态学处理
    from scipy.ndimage import binary_dilation, binary_erosion
    fg = binary_dilation(fg, iterations=3)
    fg = binary_erosion(fg, iterations=2)

    return fg.astype(float)

def build_mesh(depth: np.ndarray, fg_mask: np.ndarray, depth_scale: float = 0.55):
    """构建高质量 2.5D 网格"""
    H, W = depth.shape[:2]

    xs = np.linspace(-1, 1, W)
    ys = np.linspace(-1, 1, H)
    gx, gy = np.meshgrid(xs, ys)

    # 应用深度
    depth_masked = depth * fg_mask

    verts = np.column_stack([
        gx.ravel().astype(np.float32),
        (-gy.ravel()).astype(np.float32),
        (depth_masked.ravel() * depth_scale).astype(np.float32),
    ])

    uvs = np.column_stack([
        ((gx.ravel() + 1) / 2).astype(np.float32),
        ((gy.ravel() + 1) / 2).astype(np.float32),
    ])

    # 三角面
    i, j = np.meshgrid(np.arange(H - 1), np.arange(W - 1), indexing='ij')
    base = (i * W + j).ravel()
    tri1 = np.column_stack([base, base + 1, base + W])
    tri2 = np.column_stack([base + 1, base + W + 1, base + W])
    faces = np.vstack([tri1, tri2]).astype(np.int32)

    # 过滤背景
    avg_fg = fg_mask.ravel()[faces].mean(axis=1)
    faces = faces[avg_fg > 0.6]

    return verts, uvs, faces

def main():
    input_path = os.path.abspath(INPUT_IMAGE)
    output_path = os.path.abspath(OUTPUT_GLB)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"[1/5] 加载图片: {os.path.basename(input_path)}")
    img = Image.open(input_path).convert('RGB')
    W, H = img.size
    print(f"      尺寸: {W}x{H}")

    # 调整到工作分辨率
    TARGET_RES = 400
    aspect = W / H
    if aspect > 1:
        work_w, work_h = TARGET_RES, int(TARGET_RES / aspect)
    else:
        work_w, work_h = int(TARGET_RES * aspect), TARGET_RES

    img_work = img.resize((work_w, work_h), Image.LANCZOS)
    img_arr = np.array(img_work)

    print("[2/5] 提取前景...")
    fg_mask = extract_foreground(img_arr)
    fg_ratio = fg_mask.mean() * 100
    print(f"      前景占比: {fg_ratio:.1f}%")

    print("[3/5] 智能深度估算...")
    depth = smart_depth_estimation(img_arr, fg_mask)
    depth_range = f"{depth[fg_mask > 0].min():.3f} - {depth.max():.3f}"
    print(f"      深度范围: {depth_range}")

    print("[4/5] 构建网格...")
    verts, uvs, faces = build_mesh(depth, fg_mask, depth_scale=0.55)
    print(f"      顶点: {len(verts):,}  面: {len(faces):,}")

    print("[5/5] 导出 GLB...")
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
    mesh.fix_normals()

    # 1024px 纹理
    tex_img = img.resize((1024, 1024), Image.LANCZOS)
    material = trimesh.visual.material.PBRMaterial(
        baseColorTexture=tex_img,
        metallicFactor=0.0,
        roughnessFactor=0.8,
        doubleSided=True
    )
    mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, material=material)

    mesh.export(output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n[SUCCESS] 完成: {output_path}  ({size_mb:.1f} MB)")
    print("\n改进点:")
    print("  - 头部/躯干/腿部分层深度")
    print("  - 边缘检测增强轮廓")
    print("  - 亮度分析模拟立体感")
    print("\n前端使用:")
    print('  <model-viewer src="avatar-smart-depth.glb" auto-rotate camera-controls></model-viewer>')

if __name__ == "__main__":
    main()
