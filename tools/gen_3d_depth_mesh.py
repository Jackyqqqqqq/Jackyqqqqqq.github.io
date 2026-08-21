"""
本地高质量 3D 头像 - 深度置换网格法
====================================
无需网络，无需API，完全离线运行
原理: 用图像的前景mask做距离变换得到深度图，
      再创建高密度置换网格 + 原图纹理，导出 GLB
"""

import os
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt
import trimesh
import trimesh.visual
import trimesh.visual.material as mat_mod

INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar-depth.glb")

def make_fg_mask(img_arr: np.ndarray) -> np.ndarray:
    """检测白色/浅色背景，返回前景 mask（float 0-1）"""
    r, g, b = img_arr[:,:,0].astype(float), img_arr[:,:,1].astype(float), img_arr[:,:,2].astype(float)
    # 白色背景 RGB 都 > 240
    bg = (r > 235) & (g > 235) & (b > 235)
    fg = (~bg).astype(float)
    # 轻微膨胀去噪
    from scipy.ndimage import binary_dilation
    fg = binary_dilation(fg.astype(bool), iterations=2).astype(float)
    return fg

def make_depth_map(fg: np.ndarray, size: int) -> np.ndarray:
    """从前景 mask 生成深度图"""
    # 距离变换: 前景内部离边缘越远越近
    dist = distance_transform_edt(fg)
    dist = dist / (dist.max() + 1e-8)
    # 头部区域（上半部分）稍微突出一点，更自然
    h = dist.shape[0]
    head_boost = np.zeros_like(dist)
    head_boost[:h//2, :] = 0.15   # 头部区域额外突出
    dist = np.clip(dist + head_boost * (dist > 0.01), 0, 1)
    # 高斯平滑，让过渡更柔和
    sigma = max(dist.shape) / 25
    depth = gaussian_filter(dist, sigma=sigma)
    depth = depth / (depth.max() + 1e-8)
    # 缩放到目标分辨率
    depth_img = Image.fromarray((depth * 255).astype(np.uint8))
    depth_resized = np.array(depth_img.resize((size, size), Image.LANCZOS)) / 255.0
    return depth_resized

def build_mesh(depth: np.ndarray, depth_scale: float = 0.45):
    """用深度图构建置换网格"""
    RES = depth.shape[0]
    # 网格坐标 x,y 范围 [-1, 1]
    xs = np.linspace(-1, 1, RES)
    ys = np.linspace(-1, 1, RES)
    gx, gy = np.meshgrid(xs, ys)

    # 顶点: (x, y, z=depth)
    verts = np.column_stack([
        gx.ravel().astype(np.float32),
        (-gy.ravel()).astype(np.float32),   # 翻转 Y 使图像方向正确
        (depth.ravel() * depth_scale).astype(np.float32),
    ])

    # UV: u 从左到右 0→1，v 从上到下 0→1
    uvs = np.column_stack([
        ((gx.ravel() + 1) / 2).astype(np.float32),
        ((gy.ravel() + 1) / 2).astype(np.float32),
    ])

    # 三角面索引
    i, j = np.meshgrid(np.arange(RES - 1), np.arange(RES - 1), indexing='ij')
    base = (i * RES + j).ravel()
    tri1 = np.column_stack([base,       base + 1,     base + RES    ])
    tri2 = np.column_stack([base + 1,   base + RES + 1, base + RES  ])
    faces = np.vstack([tri1, tri2]).astype(np.int32)

    # 过滤背景（depth≈0 的面）
    avg_d = depth.ravel()[(faces).ravel()].reshape(-1, 3).mean(axis=1)
    faces = faces[avg_d > 0.003]

    return verts, uvs, faces

def main():
    input_path  = os.path.abspath(INPUT_IMAGE)
    output_path = os.path.abspath(OUTPUT_GLB)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"[1/5] 加载图片: {os.path.basename(input_path)}")
    img = Image.open(input_path).convert('RGB')
    W, H = img.size
    img_arr = np.array(img)
    print(f"      尺寸: {W}x{H}")

    print("[2/5] 计算前景 mask...")
    fg = make_fg_mask(img_arr)
    fg_coverage = fg.mean() * 100
    print(f"      前景覆盖: {fg_coverage:.1f}%")

    print("[3/5] 生成深度图 (距离变换)...")
    RES = 320       # 网格分辨率，越高越细腻
    depth = make_depth_map(fg, RES)
    max_depth = depth.max()
    print(f"      最大深度: {max_depth:.3f}  网格: {RES}x{RES}")

    print("[4/5] 构建置换网格...")
    verts, uvs, faces = build_mesh(depth, depth_scale=0.5)
    print(f"      顶点数: {len(verts):,}  三角面: {len(faces):,}")

    # 准备纹理 (1024px)
    tex_size = 1024
    img_tex = img.resize((tex_size, tex_size), Image.LANCZOS)

    # 用 trimesh 构建带纹理的网格
    print("[5/5] 组装 GLB (纹理+网格)...")
    mesh = trimesh.Trimesh(
        vertices=verts,
        faces=faces,
        process=False
    )
    mesh.fix_normals()

    # 应用 PBR 纹理
    material = mat_mod.PBRMaterial(
        baseColorTexture=img_tex,
        baseColorFactor=np.array([1.0, 1.0, 1.0, 1.0]),
        metallicFactor=0.0,
        roughnessFactor=0.8,
        doubleSided=True,
        name="avatar_material"
    )
    mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, material=material)

    # 导出 GLB
    mesh.export(output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n完成: {output_path}  ({size_mb:.1f} MB)")
    print("\n前端使用示例:")
    print('  <script type="module" src="https://unpkg.com/@google/model-viewer"></script>')
    print('  <model-viewer src="avatar-depth.glb" auto-rotate camera-controls shadow-intensity="1"></model-viewer>')

if __name__ == "__main__":
    main()
