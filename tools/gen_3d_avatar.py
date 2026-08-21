"""
图片转高质量 3D GLB 模型 — 使用 fal.ai Hunyuan3D V3
=======================================================
使用前准备:
  1. 注册 fal.ai: https://fal.ai  (注册送 $1 免费额度)
  2. 获取 API Key: https://fal.ai/dashboard/keys
  3. 安装依赖: pip install fal-client
  4. 设置环境变量: set FAL_KEY=你的key (Windows) 或 export FAL_KEY=你的key (Mac/Linux)
"""

import os
import sys
import urllib.request

def main():
    # ── 配置 ──────────────────────────────────────────────────────────────
    INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
    OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar.glb")
    # ──────────────────────────────────────────────────────────────────────

    # 检查 API Key
    if not os.environ.get("FAL_KEY"):
        print("[ERROR] 缺少 FAL_KEY 环境变量")
        print("   1. 注册 https://fal.ai  (送 $1 免费额度)")
        print("   2. 获取 Key: https://fal.ai/dashboard/keys")
        print("   3. Windows:  set FAL_KEY=你的key")
        print("      Mac/Linux: export FAL_KEY=你的key")
        sys.exit(1)

    # 检查依赖
    try:
        import fal_client
    except ImportError:
        print("[ERROR] 缺少 fal-client，请运行: pip install fal-client")
        sys.exit(1)

    # 检查输入图片
    input_path = os.path.abspath(INPUT_IMAGE)
    if not os.path.exists(input_path):
        print(f"[ERROR] 找不到输入图片: {input_path}")
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_GLB)), exist_ok=True)

    # Step 1: 上传图片到 fal.ai
    print(f"[1/3] 上传图片: {os.path.basename(input_path)} ...")
    image_url = fal_client.upload_file(input_path)
    print(f"      上传成功: {image_url}")

    # Step 2: 调用 Hunyuan3D V3
    print("\n[2/3] 生成 3D 模型中 (通常需要 60-120 秒)...")

    def on_queue_update(update):
        if hasattr(update, "logs") and update.logs:
            for log in update.logs:
                print(f"   [{log.get('level', 'INFO')}] {log.get('message', '')}")

    result = fal_client.subscribe(
        "fal-ai/hunyuan3d-v3/image-to-3d",
        arguments={
            "image_url": image_url,
            "generation_type": "Normal",   # Normal / LowPoly / Geometry
            "enable_pbr": True,            # 开启 PBR 材质，效果更真实
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )

    # Step 3: 下载 GLB
    glb_url = result["model_glb"]["url"]
    output_path = os.path.abspath(OUTPUT_GLB)
    print(f"\n[3/3] 下载 GLB: {glb_url}")
    urllib.request.urlretrieve(glb_url, output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n[SUCCESS] 完成！文件保存到:")
    print(f"   {output_path}  ({size_mb:.1f} MB)")
    print("\n[INFO] 前端使用示例:")
    print('   <script type="module" src="https://unpkg.com/@google/model-viewer"></script>')
    print('   <model-viewer src="avatar.glb" auto-rotate camera-controls></model-viewer>')

if __name__ == "__main__":
    main()
