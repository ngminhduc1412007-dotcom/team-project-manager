# Hướng dẫn chạy Backend & Frontend - Student Project Hub

Hệ thống bao gồm 2 phần:
- **Backend:** FastAPI (Python), SQLAlchemy, PyMySQL, JWT Authentication.
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Axios CDN).

---

## 1. Khởi động Backend (FastAPI)

### Bước 1: Mở Terminal tại thư mục `backend`
```powershell
cd backend
```

### Bước 2: Tạo môi trường ảo và cài đặt thư viện
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Bước 3: Cấu hình file `.env`
Tạo file `.env` từ `.env.example`:
```powershell
copy .env.example .env
```
Mở file `.env` và cập nhật thông tin kết nối MySQL (User, Password, Tên Database):
```env
DB_HOST="127.0.0.1"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="team_project_manager"
```

### Bước 4: Chạy server Backend
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Địa chỉ API:** `http://127.0.0.1:8000/api`
- **Tài liệu Swagger UI:** `http://127.0.0.1:8000/docs`

---

## 2. Khởi động Frontend

1. Cấu hình địa chỉ API nằm tại `frontend/js/config.js` (mặc định đã trỏ tới `http://127.0.0.1:8000/api`).
2. Mở file `frontend/index.html` bằng **Live Server** (VS Code) hoặc bất kỳ HTTP server tĩnh nào.
3. Các trang chính:
   - **Trang chủ:** `frontend/index.html` (kiểm tra kết nối API qua `/api/health`).
   - **Đăng ký & Đăng nhập:** `frontend/pages/login.html` (gọi `/api/auth/login`, `/api/auth/register`, tự lưu JWT token).
   - **Quản lý danh sách dự án:** `frontend/pages/projects.html` (gọi `/api/projects` hỗ trợ tìm kiếm, sắp xếp, phân trang và tạo dự án mới).

*Lưu ý: Nếu Backend chưa bật, Frontend sẽ tự động chuyển sang chế độ Demo để xem trước giao diện và chức năng.*
