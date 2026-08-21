"""
完全免费：图片转 3D GLB 模型 - 使用 HuggingFace TRELLIS Space
================================================================
无需注册，完全免费，质量接近 Hunyuan3D V3
依赖: pip install gradio_client
"""

import os
import sys

def main():
    # ── 配置 ──────────────────────────────────────────────────────────────
    INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
    OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar.glb")
    # ──────────────────────────────────────────────────────────────────────

    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("[ERROR] 缺少 gradio_client，请运行: pip install gradio_client")
        sys.exit(1)

    input_path = os.path.abspath(INPUT_IMAGE)
    if not os.path.exists(input_path):
        print(f"[ERROR] 找不到输入图片: {input_path}")
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_GLB)), exist_ok=True)

    print("[1/2] 连接到 HuggingFace TRELLIS Space...")
    print("      (第一次调用会排队等待，通常 1-3 分钟)")

    # 使用 Microsoft TRELLIS 模型
    client = Client("JeffreyXiang/TRELLIS")

    print(f"\n[2/2] 上传图片并生成 3D 模型: {os.path.basename(input_path)}")
    print("      这可能需要 2-5 分钟，请耐心等待...")

    # 调用 image-to-3D 接口
    result = client.predict(
        image=handle_file(input_path),
        # seed=0,
        # randomize_seed=True,
        # ss_guidance_strength=7.5,
        # ss_sampling_steps=12,
        # slat_guidance_strength=3,
        # slat_sampling_steps=12,
        api_name="/image_to_3d"
    )

    # result 是一个字典，包含 GLB 文件路径
    if isinstance(result, dict) and 'value' in result:
        glb_temp = result['value']
    elif isinstance(result, str):
        glb_temp = result
    else:
        glb_temp = result[0] if isinstance(result, (list, tuple)) else result

    # 复制到目标位置
    import shutil
    output_path = os.path.abspath(OUTPUT_GLB)
    shutil.copy(glb_temp, output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n[SUCCESS] 完成！文件保存到:")
    print(f"   {output_path}  ({size_mb:.1f} MB)")
    print("\n[INFO] 前端使用示例:")
    print('   <script type="module" src="https://unpkg.com/@google/model-viewer"></script>')
    print('   <model-viewer src="avatar.glb" auto-rotate camera-controls></model-viewer>')
    print("\n[INFO] 在线预览: https://3dviewer.net")

if __name__ == "__main__":
    main()
