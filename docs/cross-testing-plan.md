# 📋 Kế hoạch Test Chéo & Bảng Theo Dõi Lỗi — Student Project Hub

> **Dự án:** Team Project Manager (Student Project Hub)
> **Ngày tạo:** 26/11/2026
> **Nguyên tắc:** Mỗi thành viên test chéo module của bạn khác, ghi lỗi vào bảng chung, sửa lỗi thuộc phần mình.

---

## 1. Phân chia Module & Phân công Test chéo

Hệ thống có **5 module chính** (Backend API + Frontend UI):

| # | Module | Mô tả | Người phụ trách (ví dụ) | Người test chéo |
|---|--------|--------|--------------------------|-----------------|
| M1 | **Auth (Xác thực)** | Đăng ký, đăng nhập, refresh token, JWT | Thành viên A | Thành viên B |
| M2 | **Users (Hồ sơ cá nhân)** | Xem/sửa profile, upload avatar, đổi mật khẩu | Thành viên B | Thành viên C |
| M3 | **Projects (Dự án)** | CRUD dự án, tìm kiếm, phân trang, sắp xếp | Thành viên C | Thành viên D |
| M4 | **Tasks (Công việc)** | CRUD task, Kanban kéo thả, lọc, phân trang | Thành viên D | Thành viên A |
| M5 | **Members (Thành viên dự án)** | Thêm/xóa/đổi vai trò thành viên | Thành viên A | Thành viên D |

> **Lưu ý:** Mỗi bạn **KHÔNG test module của mình** mà test module của bạn khác theo bảng trên. Lỗi phát hiện ghi vào **Bảng Theo Dõi Lỗi** (mục 3). Sửa lỗi thuộc module mình phụ trách.

---

## 2. Test Cases theo Module

### M1 — Auth (Xác thực)

| TC | Tên Test Case | Bước tái hiện | Kết quả mong đợi |
|----|---------------|---------------|-------------------|
| A01 | Đăng ký thành công | 1. Mở `login.html` → nhấn "Đăng ký" 2. Nhập Họ tên, Email hợp lệ, Mật khẩu ≥ 8 ký tự, Xác nhận khớp 3. Nhấn "Đăng ký tài khoản" | Hiển thị toast "Đăng ký thành công", tự chuyển về form Đăng nhập, email được điền sẵn |
| A02 | Đăng ký — email đã tồn tại | 1. Đăng ký với email `sinhvien1@example.com` (đã có sẵn) | Hiển thị lỗi 409 / thông báo email đã được sử dụng |
| A03 | Đăng ký — thiếu trường bắt buộc | 1. Bỏ trống Họ tên → nhấn Đăng ký | Hiển thị lỗi validation "Vui lòng nhập họ và tên" |
| A04 | Đăng ký — mật khẩu < 8 ký tự | 1. Nhập mật khẩu `abc` → Đăng ký | Hiển thị "Mật khẩu phải có tối thiểu 8 ký tự" |
| A05 | Đăng ký — mật khẩu xác nhận không khớp | 1. Nhập MK `12345678`, xác nhận `87654321` | Hiển thị "Mật khẩu nhập lại không khớp" |
| A06 | Đăng nhập thành công | 1. Nhập `sinhvien1@example.com` / `password123` 2. Nhấn Đăng nhập | Toast "Đăng nhập thành công", chuyển hướng `projects.html`, token lưu localStorage |
| A07 | Đăng nhập — sai mật khẩu | 1. Nhập email đúng, mật khẩu sai | Hiển thị lỗi 401 "Sai email hoặc mật khẩu" |
| A08 | Đăng nhập — email không tồn tại | 1. Nhập `khongtontai@example.com` | Hiển thị lỗi 401 / 404 |
| A09 | Đăng nhập — email không đúng định dạng | 1. Nhập `abc` vào ô email → Đăng nhập | FE validation "Email không đúng định dạng" |
| A10 | Điền nhanh tài khoản mẫu | 1. Nhấn nút "Điền nhanh" | Ô email = `truongnhom1@example.com`, ô MK = `password123` |
| A11 | Refresh token | 1. Gọi API `POST /api/auth/refresh` với refresh_token hợp lệ | Trả về cặp access_token + refresh_token mới |
| A12 | Truy cập trang cần auth khi chưa đăng nhập | 1. Xóa token → truy cập `projects.html` | Chuyển hướng về `login.html?reason=auth_required` |

### M2 — Users (Hồ sơ cá nhân)

| TC | Tên Test Case | Bước tái hiện | Kết quả mong đợi |
|----|---------------|---------------|-------------------|
| U01 | Xem thông tin cá nhân | 1. Đăng nhập → vào trang Profile (`profile.html`) | Hiển thị đầy đủ: Họ tên, Email, Role, Avatar, Bio |
| U02 | Sửa họ tên | 1. Vào Profile → sửa Họ tên thành "Nguyễn Văn Test" → Lưu | Thông báo thành công, tên cập nhật hiển thị đúng |
| U03 | Sửa bio | 1. Vào Profile → thêm/sửa Bio → Lưu | Bio cập nhật đúng trên giao diện |
| U04 | Upload avatar — file hợp lệ (JPG/PNG ≤ 5MB) | 1. Vào Profile → chọn file ảnh `.png` ≤ 5MB → Upload | Avatar hiển thị ảnh mới, URL trả về đúng |
| U05 | Upload avatar — file quá lớn (> 5MB) | 1. Chọn file ảnh > 5MB → Upload | Hiển thị lỗi "File vượt quá dung lượng cho phép" |
| U06 | Upload avatar — sai định dạng (.pdf, .exe) | 1. Chọn file `.pdf` → Upload | Hiển thị lỗi "Định dạng file không được hỗ trợ" |
| U07 | Đổi mật khẩu thành công | 1. Profile → Đổi mật khẩu: nhập MK cũ đúng, MK mới hợp lệ ≥ 8 ký tự, xác nhận khớp | Thông báo "Đổi mật khẩu thành công" |
| U08 | Đổi mật khẩu — MK cũ sai | 1. Nhập MK cũ sai → Lưu | Hiển thị lỗi 400/401 "Mật khẩu hiện tại không đúng" |
| U09 | Đổi mật khẩu — MK mới = MK cũ | 1. Nhập MK mới giống MK cũ | Hiển thị lỗi "Mật khẩu mới phải khác mật khẩu cũ" |
| U10 | Gọi API `/users/me` không có token | 1. Gọi `GET /api/users/me` không gửi Authorization header | Trả về 401 Unauthorized |

### M3 — Projects (Dự án)

| TC | Tên Test Case | Bước tái hiện | Kết quả mong đợi |
|----|---------------|---------------|-------------------|
| P01 | Tạo dự án mới | 1. Vào trang Dự án → nhấn "Tạo dự án" 2. Nhập tên, mô tả, ngày bắt đầu, deadline 3. Nhấn Lưu | Dự án hiển thị trong danh sách, owner = user hiện tại |
| P02 | Tạo dự án — thiếu tên | 1. Bỏ trống tên dự án → Lưu | Validation lỗi 422 "Tên dự án là bắt buộc" |
| P03 | Xem danh sách dự án (phân trang) | 1. Vào trang Dự án với > 10 dự án | Hiển thị trang 1 (10 items), có nút chuyển trang |
| P04 | Tìm kiếm dự án theo tên | 1. Nhập "Quản lý" vào ô tìm kiếm | Chỉ hiển thị dự án có chứa "Quản lý" trong tên |
| P05 | Sắp xếp dự án (theo tên ASC) | 1. Chọn sắp xếp theo Tên A→Z | Danh sách sắp xếp đúng thứ tự alphabet |
| P06 | Lọc "Dự án của tôi" (my=true) | 1. Bật filter "Dự án của tôi" | Chỉ hiển thị dự án mà user hiện tại là owner |
| P07 | Xem chi tiết dự án | 1. Nhấn vào 1 dự án trong danh sách | Hiển thị đầy đủ: tên, mô tả, trạng thái, deadline, owner, danh sách thành viên |
| P08 | Cập nhật dự án (đổi tên, mô tả) | 1. Mở chi tiết dự án mình sở hữu → sửa tên/mô tả → Lưu | Thông tin cập nhật thành công |
| P09 | Cập nhật dự án — không phải chủ | 1. Đăng nhập user khác → sửa dự án không thuộc mình | Trả về 403 Forbidden |
| P10 | Cập nhật trạng thái dự án | 1. Chủ dự án → đổi status từ `planning` → `in_progress` | Trạng thái cập nhật đúng |
| P11 | Xóa dự án — đúng chủ | 1. Chủ dự án → nhấn Xóa → xác nhận | Dự án bị xóa, không còn trong danh sách |
| P12 | Xóa dự án — không phải chủ | 1. User khác → thử xóa dự án | Trả về 403 Forbidden |
| P13 | Xem dự án không tồn tại (id=99999) | 1. Truy cập `GET /api/projects/99999` | Trả về 404 Not Found |

### M4 — Tasks (Công việc)

| TC | Tên Test Case | Bước tái hiện | Kết quả mong đợi |
|----|---------------|---------------|-------------------|
| T01 | Tạo task mới trong dự án | 1. Vào dự án → nhấn "Tạo công việc" 2. Nhập tiêu đề, mô tả, deadline, priority, assignee 3. Lưu | Task hiển thị trên Kanban ở cột "Todo" |
| T02 | Tạo task — thiếu tiêu đề | 1. Bỏ trống tiêu đề → Lưu | Validation 422 "Tiêu đề là bắt buộc" |
| T03 | Tạo task — user không thuộc dự án | 1. Đăng nhập user ngoài dự án → tạo task trong dự án đó | Trả về 403 |
| T04 | Xem danh sách task (lọc theo project_id) | 1. Gọi `GET /api/tasks?project_id=1` | Chỉ trả về task thuộc dự án id=1 |
| T05 | Lọc task theo status | 1. Lọc status=`in_progress` | Chỉ hiển thị task có trạng thái "Đang làm" |
| T06 | Lọc task theo priority | 1. Lọc priority=`urgent` | Chỉ hiển thị task độ ưu tiên "Khẩn cấp" |
| T07 | Lọc task theo due_date range | 1. Đặt `due_date_from=2026-11-01`, `due_date_to=2026-11-30` | Chỉ task có hạn trong tháng 11 |
| T08 | Tìm kiếm task theo tiêu đề/mô tả | 1. Nhập "Kanban" vào ô tìm kiếm | Hiển thị task có "Kanban" trong tiêu đề hoặc mô tả |
| T09 | Xem chi tiết task | 1. Nhấn vào task trên Kanban | Hiển thị modal/trang chi tiết: tiêu đề, mô tả, priority, assignee, deadline, status |
| T10 | Cập nhật task (đổi tiêu đề, priority) | 1. Mở chi tiết task → sửa → Lưu | Thông tin cập nhật đúng |
| T11 | Kéo thả task đổi trạng thái (Kanban) | 1. Kéo task từ cột "Todo" → "In Progress" | Task chuyển cột, API `PATCH /tasks/{id}/status` trả 200 |
| T12 | Đổi status task — Viewer bị từ chối | 1. Đăng nhập user có role `viewer` trong dự án → kéo thả task | Trả về 403 "Viewer không có quyền" |
| T13 | Xóa task — chủ dự án | 1. Đăng nhập chủ dự án → xóa task | Task bị xóa thành công |
| T14 | Xóa task — thành viên thường | 1. Đăng nhập member → xóa task | Trả về 403 |
| T15 | Xem task không tồn tại (id=99999) | 1. Gọi `GET /api/tasks/99999` | Trả về 404 |

### M5 — Members (Thành viên dự án)

| TC | Tên Test Case | Bước tái hiện | Kết quả mong đợi |
|----|---------------|---------------|-------------------|
| MB01 | Thêm thành viên bằng email | 1. Chủ dự án → trang Members → nhập email `sinhvien2@example.com`, role=member → Thêm | Thành viên mới hiển thị trong danh sách |
| MB02 | Thêm thành viên — email không tồn tại | 1. Nhập `khongtontai@xyz.com` → Thêm | Trả về 404 "Người dùng không tồn tại" |
| MB03 | Thêm thành viên — đã là thành viên | 1. Thêm lại email đã có trong dự án | Trả về 409 "Đã là thành viên" |
| MB04 | Thêm thành viên — không phải chủ dự án | 1. Đăng nhập user thường → thử thêm thành viên | Trả về 403 |
| MB05 | Xem danh sách thành viên | 1. Vào dự án → tab Members | Hiển thị đầy đủ: tên, email, role, ngày tham gia |
| MB06 | Đổi vai trò thành viên (member → viewer) | 1. Chủ dự án → chọn thành viên → đổi role thành `viewer` | Role cập nhật đúng |
| MB07 | Chuyển quyền chủ dự án (đổi thành owner) | 1. Chủ dự án → đổi role 1 thành viên thành `owner` | Quyền chủ sở hữu chuyển giao, chủ cũ thành member |
| MB08 | Đổi vai trò — không phải chủ | 1. User thường → thử đổi role thành viên | Trả về 403 |
| MB09 | Xóa thành viên khỏi dự án | 1. Chủ dự án → nhấn Xóa thành viên → Xác nhận | Thành viên bị xóa khỏi danh sách |
| MB10 | Xóa chủ dự án | 1. Thử xóa user có role `owner` | Trả về 400 "Không thể xóa chủ dự án" |
| MB11 | Xóa thành viên — không phải chủ | 1. User thường → thử xóa thành viên | Trả về 403 |

---

## 3. 🐛 Bảng Theo Dõi Lỗi Chung (Bug Tracking)

> Copy bảng này ra Google Sheets hoặc Excel để cả nhóm cùng cập nhật real-time. Mỗi dòng = 1 bug. Người test ghi bug, người phụ trách module sửa bug.

| Bug ID | Module | TC liên quan | Tiêu đề lỗi | Bước tái hiện | Kết quả thực tế | Mức độ | Người phát hiện | Người sửa (owner module) | Trạng thái | Ngày phát hiện | Ngày sửa xong |
|--------|--------|--------------|--------------|---------------|-----------------|--------|-----------------|--------------------------|------------|----------------|----------------|
| BUG-001 | | | | | | | | | 🔴 Mở | | |
| BUG-002 | | | | | | | | | 🔴 Mở | | |
| BUG-003 | | | | | | | | | 🔴 Mở | | |
| BUG-004 | | | | | | | | | 🔴 Mở | | |
| BUG-005 | | | | | | | | | 🔴 Mở | | |
| BUG-006 | | | | | | | | | 🔴 Mở | | |
| BUG-007 | | | | | | | | | 🔴 Mở | | |
| BUG-008 | | | | | | | | | 🔴 Mở | | |
| BUG-009 | | | | | | | | | 🔴 Mở | | |
| BUG-010 | | | | | | | | | 🔴 Mở | | |

### Quy ước mức độ lỗi

| Mức độ | Ý nghĩa | Ví dụ |
|--------|----------|-------|
| 🔴 **Critical** | Hệ thống sập / mất dữ liệu / không thể sử dụng | API crash 500, mất token, xóa nhầm dữ liệu |
| 🟠 **Major** | Chức năng chính không hoạt động đúng | Không tạo được dự án, kéo thả task lỗi |
| 🟡 **Minor** | Chức năng phụ bị ảnh hưởng hoặc UI sai | Sắp xếp không đúng thứ tự, toast không hiện |
| 🟢 **Trivial** | Lỗi giao diện nhỏ, chính tả | Typo trong label, khoảng trắng thừa |

### Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|------------|---------|
| 🔴 Mở | Vừa phát hiện, chưa ai xử lý |
| 🟡 Đang sửa | Người phụ trách module đã nhận, đang fix |
| 🟢 Đã sửa | Đã fix xong, chờ verify |
| ✅ Đóng | Người test chéo đã verify OK |
| ⬜ Không sửa | Không phải bug / thiết kế cố ý / sẽ sửa sau |

---

## 4. Quy trình Test Chéo

```
1. Nhận module test chéo
       ↓
2. Chạy từng test case
       ↓
3. Có lỗi? ── Không → Đánh dấu TC = PASS
       │
      Có
       ↓
4. Ghi bug vào bảng chung
       ↓
5. Người phụ trách module nhận bug
       ↓
6. Sửa lỗi & commit
       ↓
7. Người test verify lại
       ↓
8. Lỗi đã hết? ── Không → Quay lại bước 4
       │
      Có
       ↓
   ✅ Đóng bug
```

### Checklist cho mỗi người test:

- [ ] Đã pull code mới nhất (main branch)
- [ ] Backend đã chạy (`uvicorn app.main:app --reload`)
- [ ] Database đã import `init.sql` (có dữ liệu mẫu)
- [ ] Frontend mở bằng Live Server
- [ ] Đã test qua TẤT CẢ test cases của module được giao
- [ ] Mọi bug đã ghi vào bảng chung với đầy đủ: bước tái hiện, kết quả thực tế, mức độ
- [ ] Đã sửa hết bug thuộc module mình phụ trách (nếu có)

---

## 5. Lỗi tiềm ẩn đã phát hiện trong mã nguồn

> ⚠️ Các vấn đề sau đã được phát hiện khi review code, nên kiểm tra kỹ khi test:

### 5.1. Lỗi cú pháp SQL trong `init.sql`

Trong file `backend/sql/init.sql`:

- **Dòng 24-27 (bảng `users`):** Có các dòng `KEY idx_tasks_...` không thuộc bảng `users` — đây là index của bảng `tasks` bị copy nhầm vào. Ngoài ra thiếu dấu `,` trước `KEY` và cột `project_id` / `status` không tồn tại trong bảng `users`.

- **Dòng 49-52 (bảng `projects`):** Tương tự, có `KEY idx_tasks_project_id`, `idx_tasks_status`, `idx_tasks_project_status` bị copy nhầm vào bảng `projects`. Thiếu dấu `,` sau `CONSTRAINT fk_projects_owner`.

- **Dòng 74-77 (bảng `tasks`):** Các dòng `KEY` nằm sau `CONSTRAINT` nhưng thiếu dấu `,` phân cách.

- **Dòng 95-97 (bảng `project_members`):** Index `idx_tasks_...` bị copy nhầm vào bảng `project_members`. Cột `status` không tồn tại trong bảng này. Thiếu dấu `,` sau `UNIQUE`.

> Script `init.sql` hiện tại sẽ lỗi syntax khi chạy trực tiếp trên MySQL. Cần sửa trước khi test.

### 5.2. Router `project_members.py` bị trùng

File `backend/app/routers/project_members.py` định nghĩa các endpoint `/{project_id}/members` với prefix `/projects`, nhưng các endpoint này cũng đã được định nghĩa trong `backend/app/routers/projects.py` (dòng 252-403). Tuy nhiên `project_members.router` không được include trong `main.py`, nên hiện tại không gây conflict — nhưng cần xác nhận rõ.

### 5.3. Danh sách trống trả 404 thay vì mảng rỗng

Trong `projects.py` dòng 127-128 và `tasks.py` dòng 110-111: khi không tìm thấy kết quả, API raise `NotFoundException` (404). Thông thường, danh sách trống nên trả `200 OK` với data=[] để frontend dễ xử lý hơn.

---

## 6. Mẫu ghi Bug

Khi phát hiện lỗi, ghi theo mẫu sau:

```
Bug ID:      BUG-001
Module:      M3 — Projects
TC liên quan: P04
Tiêu đề:     Tìm kiếm dự án theo tên trả 404 khi không tìm thấy thay vì danh sách rỗng
Bước tái hiện:
  1. Đăng nhập với tài khoản sinhvien1@example.com / password123
  2. Vào trang Dự án
  3. Nhập "xyzkhongtontai" vào ô tìm kiếm
  4. Nhấn Enter hoặc bấm tìm kiếm
Kết quả thực tế:  API trả 404, frontend hiển thị lỗi "Không tìm thấy dự án"
Kết quả mong đợi: API trả 200 với data=[], frontend hiển thị "Không có dự án nào phù hợp"
Mức độ:      🟡 Minor
Người phát hiện: Thành viên D
Người sửa:   Thành viên C (phụ trách M3)
```
