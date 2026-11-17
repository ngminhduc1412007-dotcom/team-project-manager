import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent

# Khởi động uvicorn server
python_exe = sys.executable
proc = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=str(backend_dir),
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)

try:
    print("Đang khởi động Uvicorn server tại http://127.0.0.1:8000 ...")
    time.sleep(3)

    # 1. Kiểm tra trang chủ frontend (GET /)
    req = urllib.request.urlopen("http://127.0.0.1:8000/")
    html = req.read().decode("utf-8")
    assert "<title>Trang chủ | Student Project Hub</title>" in html
    print("[PASS] 1. Phục vụ Frontend index.html thành công tại http://127.0.0.1:8000/")

    # 2. Kiểm tra API Health Check (GET /api/health)
    req2 = urllib.request.urlopen("http://127.0.0.1:8000/api/health")
    res2 = json.loads(req2.read().decode("utf-8"))
    assert res2["data"]["status"] == "healthy"
    print(f"[PASS] 2. API Health check /api/health trả về: status={res2['data']['status']}, env={res2['data']['environment']}")

    # 3. Kiểm tra API Login (POST /api/auth/login)
    login_data = json.dumps({"email": "truongnhom1@example.com", "password": "password123"}).encode("utf-8")
    req3 = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"},
    )
    res3 = json.loads(urllib.request.urlopen(req3).read().decode("utf-8"))
    token = res3["data"]["access_token"]
    assert token and len(token) > 20
    print(f"[PASS] 3. Đăng nhập thành công tài khoản truongnhom1@example.com, nhận JWT token hợp lệ!")

    # 4. Kiểm tra API Projects có gắn Bearer token (GET /api/projects)
    req4 = urllib.request.Request(
        "http://127.0.0.1:8000/api/projects?page=1&page_size=5",
        headers={"Authorization": f"Bearer {token}"},
    )
    res4 = json.loads(urllib.request.urlopen(req4).read().decode("utf-8"))
    items = res4["data"]["items"]
    meta = res4["data"]["meta"]
    print(f"[PASS] 4. API /api/projects lấy thành công {len(items)}/{meta['total_records']} dự án từ MySQL!")
    for p in items[:2]:
        print(f"       + Dự án #{p['id']}: '{p['name']}' (Trạng thái: {p.get('status')})")

    # 5. Kiểm tra trang Dự án frontend (GET /pages/projects.html)
    req5 = urllib.request.urlopen("http://127.0.0.1:8000/pages/projects.html")
    html5 = req5.read().decode("utf-8")
    assert "Dự án của tôi" in html5
    print("[PASS] 5. Phục vụ trang /pages/projects.html thành công")

    # 6. Kiểm tra trang Đăng nhập frontend (GET /pages/login.html)
    req6 = urllib.request.urlopen("http://127.0.0.1:8000/pages/login.html")
    html6 = req6.read().decode("utf-8")
    assert "Đăng nhập" in html6
    print("[PASS] 6. Phục vụ trang /pages/login.html thành công")

    print("\n" + "=" * 60)
    print(" KẾT NỐI FRONTEND VÀ BACKEND ĐÃ ĐỒNG BỘ VÀ HOÀN HẢO 100%!")
    print("=" * 60)
finally:
    proc.terminate()
    proc.wait()
    print("Đã dừng tiến trình kiểm thử server.")

