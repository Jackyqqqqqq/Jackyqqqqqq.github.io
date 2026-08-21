"""
完全免费：Stability AI Stable Fast 3D (无需注册)
===============================================
通过 HuggingFace Gradio API 调用，完全免费
"""

import os
import sys
import shutil

def main():
    INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
    OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar-sf3d.glb")

    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("[ERROR] pip install gradio_client")
        sys.exit(1)

    input_path = os.path.abspath(INPUT_IMAGE)
    if not os.path.exists(input_path):
        print(f"[ERROR] 找不到输入图片: {input_path}")
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_GLB)), exist_ok=True)

    print("[1/2] 连接到 Stability AI Stable Fast 3D Space...")
    print("      (首次调用可能需要排队等待)")

    client = Client("stabilityai/stable-fast-3d")

    print(f"\n[2/2] 生成 3D 模型: {os.path.basename(input_path)}")
    print("      预计 1-3 分钟...")

    # 调用 Stable Fast 3D — /run_button 接口支持高质量纹理和网格控制
    result = client.predict(
        input_image=handle_file(input_path),
        foreground_ratio=0.85,
        remesh_option="Triangle",   # Triangle 网格质量最好
        vertex_count=-1,            # -1 = 自动（最高精度）
        texture_size=2048,          # 2K 纹理
        api_name="/run_button"
    )

    # result = (preview_bg_removal_path, glb_path)
    glb_temp = result[1] if isinstance(result, (list, tuple)) else result

    output_path = os.path.abspath(OUTPUT_GLB)
    shutil.copy(glb_temp, output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n[SUCCESS] 完成: {output_path} ({size_mb:.1f} MB)")
    print("\n[INFO] 前端使用:")
    print('   <script type="module" src="https://unpkg.com/@google/model-viewer"></script>')
    print('   <model-viewer src="avatar-sf3d.glb" auto-rotate camera-controls></model-viewer>')
    print("\n[INFO] 在线预览: https://3dviewer.net")

if __name__ == "__main__":
    main()
