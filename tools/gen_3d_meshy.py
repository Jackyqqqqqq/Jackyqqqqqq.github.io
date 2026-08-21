"""
完全免费：Meshy.ai Image to 3D (每月 200 免费额度)
====================================================
1. 注册: https://www.meshy.ai (GitHub/Google 登录)
2. 获取 API Key: https://www.meshy.ai/api
3. 运行: set MESHY_API_KEY=你的key && python tools/gen_3d_meshy.py
"""

import os
import sys
import time
import base64
import urllib.request
import requests

def main():
    INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "..", "23a1012a-34a3-4daf-9a9b-8151daa5a287.png")
    OUTPUT_GLB  = os.path.join(os.path.dirname(__file__), "..", "output", "3d-avatar-hq", "avatar-meshy.glb")

    api_key = os.environ.get("MESHY_API_KEY")
    if not api_key:
        print("[ERROR] 缺少 MESHY_API_KEY 环境变量")
        print("   1. 注册: https://www.meshy.ai (用 GitHub/Google 登录)")
        print("   2. 获取 Key: https://www.meshy.ai/api")
        print("   3. Windows:  set MESHY_API_KEY=你的key")
        print("      Mac/Linux: export MESHY_API_KEY=你的key")
        sys.exit(1)

    input_path = os.path.abspath(INPUT_IMAGE)
    if not os.path.exists(input_path):
        print(f"[ERROR] 找不到输入图片: {input_path}")
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_GLB)), exist_ok=True)

    # Step 1: 编码图片为 base64 data URL
    print(f"[1/3] 编码图片: {os.path.basename(input_path)}")
    with open(input_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    image_url = f"data:image/png;base64,{b64}"

    # Step 2: 创建任务
    print("[2/3] 提交任务到 Meshy.ai...")
    response = requests.post(
        "https://api.meshy.ai/openapi/v1/image-to-3d",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={"image_url": image_url}
    )

    if response.status_code != 200:
        print(f"[ERROR] API 调用失败: {response.status_code}")
        print(response.text)
        sys.exit(1)

    task_id = response.json()["result"]
    print(f"      任务 ID: {task_id}")

    # Step 3: 轮询结果
    print("[3/3] 生成中 (通常需要 2-5 分钟)...")
    poll_count = 0
    while True:
        poll_count += 1
        response = requests.get(
            f"https://api.meshy.ai/openapi/v1/image-to-3d/{task_id}",
            headers={"Authorization": f"Bearer {api_key}"}
        )

        task = response.json()
        status = task.get("status")
        progress = task.get("progress", 0)

        if poll_count % 6 == 1:  # 每 30 秒打印一次
            print(f"      状态: {status}, 进度: {progress}%")

        if status == "SUCCEEDED":
            glb_url = task["model_urls"]["glb"]
            print(f"\n下载 GLB: {glb_url}")

            output_path = os.path.abspath(OUTPUT_GLB)
            urllib.request.urlretrieve(glb_url, output_path)

            size_mb = os.path.getsize(output_path) / 1024 / 1024
            print(f"\n[SUCCESS] 完成: {output_path} ({size_mb:.1f} MB)")
            print("\n[INFO] 前端使用:")
            print('   <script type="module" src="https://unpkg.com/@google/model-viewer"></script>')
            print('   <model-viewer src="avatar-meshy.glb" auto-rotate camera-controls></model-viewer>')
            break

        elif status == "FAILED":
            error = task.get("task_error", {}).get("message", "未知错误")
            print(f"\n[ERROR] 任务失败: {error}")
            sys.exit(1)

        time.sleep(5)

if __name__ == "__main__":
    main()
