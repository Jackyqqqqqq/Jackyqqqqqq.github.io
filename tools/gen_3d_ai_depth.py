"""
AI 深度估算 + 高质量 3D 网格生成
使用 Intel DPT 模型自动识别图像深度
"""
import os
import sys
import numpy as np
from PIL import Image
import torch
import trimesh
import trimesh.visual

INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar-ai-depth.glb")

def estimate_depth(img_pil):
    """用 DPT 模型估算深度"""
    from transformers import DPTImageProcessor, DPTForDepthEstimation

    print("      加载 DPT 深度估算模型...")
    processor = DPTImageProcessor.from_pretrained("Intel/dpt-large")
    model = DPTForDepthEstimation.from_pretrained("Intel/dpt-large")

    # 检测 GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    print(f"      使用设备: {device.upper()}")

    # 处理图像
    inputs = processor(images=img_pil, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth

    # 插值到目标分辨率
    depth = torch.nn.functional.interpolate(
        predicted_depth.unsqueeze(1),
        size=(512, 512),
        mode="bicubic",
        align_corners=False,
    ).squeeze()

    depth_np = depth.cpu().numpy()

    # 归一化到 0-1，反转（远处=0，近处=1）
    depth_np = (depth_np - depth_np.min()) / (depth_np.max() - depth_np.min() + 1e-8)
    depth_np = 1.0 - depth_np  # DPT 输出是距离，我们需要深度

    return depth_np

def remove_background(img_arr, depth):
    """用深度图辅助去背景"""
    # 深度 < 0.15 的区域判定为背景
    fg_mask = depth > 0.15

    # RGB 通道也考虑：白色背景
    r, g, b = img_arr[:,:,0], img_arr[:,:,1], img_arr[:,:,2]
    bg_color = (r > 235) & (g > 235) & (b > 235)

    fg_mask = fg_mask & (~bg_color)
    return fg_mask.astype(float)

def build_mesh(depth, fg_mask, depth_scale=0.6):
    """构建高质量置换网格"""
    RES = depth.shape[0]

    # 网格坐标
    xs = np.linspace(-1, 1, RES)
    ys = np.linspace(-1, 1, RES)
    gx, gy = np.meshgrid(xs, ys)

    # 应用前景 mask
    depth_masked = depth * fg_mask

    # 顶点
    verts = np.column_stack([
        gx.ravel().astype(np.float32),
        (-gy.ravel()).astype(np.float32),
        (depth_masked.ravel() * depth_scale).astype(np.float32),
    ])

    # UV
    uvs = np.column_stack([
        ((gx.ravel() + 1) / 2).astype(np.float32),
        ((gy.ravel() + 1) / 2).astype(np.float32),
    ])

    # 三角面
    i, j = np.meshgrid(np.arange(RES - 1), np.arange(RES - 1), indexing='ij')
    base = (i * RES + j).ravel()
    tri1 = np.column_stack([base, base + 1, base + RES])
    tri2 = np.column_stack([base + 1, base + RES + 1, base + RES])
    faces = np.vstack([tri1, tri2]).astype(np.int32)

    # 过滤背景面
    avg_fg = fg_mask.ravel()[faces].mean(axis=1)
    faces = faces[avg_fg > 0.5]

    return verts, uvs, faces

def main():
    input_path = os.path.abspath(INPUT_IMAGE)
    output_path = os.path.abspath(OUTPUT_GLB)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"[1/5] 加载图片: {os.path.basename(input_path)}")
    img = Image.open(input_path).convert('RGB')
    W, H = img.size
    print(f"      尺寸: {W}x{H}")

    print("[2/5] AI 深度估算 (Intel DPT)...")
    depth = estimate_depth(img)
    print(f"      深度范围: {depth.min():.3f} - {depth.max():.3f}")

    # 调整图像尺寸匹配深度图
    img_resized = img.resize((512, 512), Image.LANCZOS)
    img_arr = np.array(img_resized)

    print("[3/5] 前景分割...")
    fg_mask = remove_background(img_arr, depth)
    fg_coverage = fg_mask.mean() * 100
    print(f"      前景覆盖: {fg_coverage:.1f}%")

    print("[4/5] 构建 3D 网格...")
    verts, uvs, faces = build_mesh(depth, fg_mask, depth_scale=0.6)
    print(f"      顶点: {len(verts):,}  面: {len(faces):,}")

    print("[5/5] 导出 GLB...")
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
    mesh.fix_normals()

    # 纹理
    tex_img = img.resize((1024, 1024), Image.LANCZOS)
    material = trimesh.visual.material.PBRMaterial(
        baseColorTexture=tex_img,
        metallicFactor=0.0,
        roughnessFactor=0.85,
        doubleSided=True
    )
    mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, material=material)

    mesh.export(output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n✅ 完成: {output_path}  ({size_mb:.1f} MB)")
    print("\n前端使用:")
    print('  <model-viewer src="avatar-ai-depth.glb" auto-rotate camera-controls></model-viewer>')

if __name__ == "__main__":
    main()
