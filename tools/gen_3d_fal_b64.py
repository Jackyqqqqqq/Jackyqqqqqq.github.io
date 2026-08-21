"""
fal.ai Hunyuan3D V3 — 用 base64 绕过 storage 上传
"""
import os, sys, base64, urllib.request

def main():
    INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
    OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar.glb")

    if not os.environ.get("FAL_KEY"):
        print("[ERROR] 缺少 FAL_KEY"); sys.exit(1)

    try:
        import fal_client
    except ImportError:
        print("[ERROR] pip install fal-client"); sys.exit(1)

    input_path = os.path.abspath(INPUT_IMAGE)
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_GLB)), exist_ok=True)

    # 直接用 base64 data URL，不走 storage upload
    print("[1/2] 编码图片为 base64...")
    with open(input_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    image_url = f"data:image/png;base64,{b64}"
    print(f"      图片大小: {len(b64) // 1024} KB (base64)")

    print("\n[2/2] 调用 Hunyuan3D V3 生成 3D 模型...")
    print("      预计需要 60-120 秒...")

    def on_update(update):
        if hasattr(update, "logs"):
            for log in (update.logs or []):
                msg = log.get("message", "")
                if msg:
                    print(f"   {msg}")

    result = fal_client.subscribe(
        "fal-ai/hunyuan3d-v3/image-to-3d",
        arguments={"image_url": image_url, "generation_type": "Normal", "enable_pbr": True},
        with_logs=True,
        on_queue_update=on_update,
    )

    glb_url = result["model_glb"]["url"]
    output_path = os.path.abspath(OUTPUT_GLB)
    print(f"\n下载 GLB: {glb_url}")
    urllib.request.urlretrieve(glb_url, output_path)

    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n[SUCCESS] 完成: {output_path} ({size_mb:.1f} MB)")

if __name__ == "__main__":
    main()
