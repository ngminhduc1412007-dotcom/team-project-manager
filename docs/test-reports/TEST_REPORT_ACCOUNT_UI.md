# BÁO CÁO KIỂM THỬ GIAO DIỆN TÀI KHOẢN (TEST REPORT)

* **Dự án:** Hệ thống Quản lý Đồ án Sinh viên PTIT (Student Project Hub)
* **Phân hệ kiểm thử:** Giao diện Tài khoản (Đăng ký, Đăng nhập, Lưu token, Chặn trang & Đăng xuất)
* **Mã task kiểm thử:** `[Kiểm thử] Kiểm thử giao diện tài khoản`
* **Người thực hiện:** Sinh viên Học viện Công nghệ Bưu chính Viễn thông (PTIT)
* **Ngày thực hiện kiểm thử:** 16/11/2026
* **Môi trường thử nghiệm:**
  - **Máy tính (Desktop):** Google Chrome 130.0, Microsoft Edge (1920x1080, 1366x768)
  - **Điện thoại (Mobile Responsive):** Chrome DevTools Device Mode (iPhone 14 - 390x844, Galaxy S22 - 360x800)
  - **Backend API:** FastAPI `http://127.0.0.1:8000/api` kết nối MySQL Database `team_project_manager`

---

## 1. Mục tiêu kiểm thử

1. Xác minh độ tương thích hiển thị của giao diện tài khoản trên cả màn hình máy tính (Desktop) và thiết bị di động (Mobile).
2. Kiểm tra tính chặt chẽ của các quy tắc kiểm tra dữ liệu đầu vào (Form Validation) ở cả client-side và backend API.
3. Kiểm tra tính rõ ràng, thân thiện của các thông báo lỗi (Error toast, Inline alert) khi người dùng nhập sai thông tin.
4. Kiểm thử luồng nghiệp vụ bảo mật: lưu token vào `localStorage`, tự động chuyển trang khi đăng nhập thành công, chặn trang quản lý khi chưa đăng nhập và chức năng nút đăng xuất.

---

## 2. Bảng Ma trận Kịch bản Kiểm thử chi tiết (Test Cases)

| Mã TC | Hạng mục kiểm thử | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC01** | Hiển thị màn hình Desktop | Mở trang `/pages/login.html` trên trình duyệt máy tính (1920x1080). | Mặc định | Form đăng nhập/đăng ký hiển thị ở giữa màn hình, tab chuyển đổi rõ ràng, logo và font chữ sắc nét. | Hiển thị chuẩn xác, cân đối. | **PASS** |
| **TC02** | Hiển thị màn hình Mobile | Chuyển chế độ xem sang Mobile (390x844) trên Chrome DevTools. | Mặc định | Giao diện tự động co giãn 100% chiều rộng, không bị tràn ngang, các nút bấm to dễ thao tác bằng ngón tay. | Tương thích hoàn toàn (Responsive tốt). | **PASS** |
| **TC03** | Chuyển đổi qua lại giữa Đăng nhập & Đăng ký | Bấm vào tab "Đăng nhập" và "Đăng ký". | Click tab | Form tương ứng hiển thị mượt mà, đổi tiêu đề và đổi nút bấm mà không bị tải lại trang. | Chuyển đổi tab tức thì, chuẩn xác. | **PASS** |
| **TC04** | Hiện/Ẩn mật khẩu | Nhập mật khẩu và bấm vào biểu tượng con mắt (Show/Hide password). | Mật khẩu bất kỳ | Mật khẩu chuyển đổi giữa dạng dấu chấm tròn (`type="password"`) và dạng văn bản (`type="text"`). | Ẩn/hiện mật khẩu chính xác. | **PASS** |
| **TC05** | Validate trường để trống | Để trống email và mật khẩu rồi bấm "Đăng nhập". | Email: `""`<br>Password: `""` | Báo lỗi viền đỏ, hiển thị dòng cảnh báo: "Vui lòng nhập địa chỉ email" và "Vui lòng nhập mật khẩu". | Báo lỗi đúng ô nhập, ngăn submit. | **PASS** |
| **TC06** | Validate định dạng Email | Nhập chuỗi không phải email hợp lệ. | `nguyenvana`, `student@`, `abc@.com` | Báo lỗi: "Email không đúng định dạng (VD: sinhvien@ptit.edu.vn)". | Hiển thị cảnh báo lỗi định dạng ngay dưới ô nhập. | **PASS** |
| **TC07** | Validate độ dài mật khẩu khi Đăng ký | Nhập mật khẩu dưới 6 ký tự ở form Đăng ký. | Password: `123` | Báo lỗi: "Mật khẩu phải chứa ít nhất 6 ký tự". | Ngăn đăng ký, hiển thị lỗi rõ ràng. | **PASS** |
| **TC08** | Validate xác nhận mật khẩu không khớp | Form Đăng ký: nhập mật khẩu và xác nhận mật khẩu khác nhau. | Pass: `123456`<br>Confirm: `1234567` | Báo lỗi: "Mật khẩu xác nhận không khớp". | Đánh dấu viền đỏ ô xác nhận mật khẩu. | **PASS** |
| **TC09** | Thông báo sai mật khẩu từ Backend | Nhập email đúng nhưng nhập sai mật khẩu rồi bấm Đăng nhập. | Email: `student@ptit.edu.vn`<br>Pass: `sai_mat_khau` | Hiển thị Toast thông báo lỗi màu đỏ: "Email hoặc mật khẩu không chính xác" (HTTP 401). | Toast đỏ hiện góc phải: đúng thông báo lỗi. | **PASS** |
| **TC10** | Thông báo email chưa tồn tại | Đăng nhập bằng email chưa được đăng ký trong CSDL. | `chua_dang_ky@ptit.edu.vn`<br>Pass: `123456` | Hiển thị Toast báo lỗi: "Email hoặc mật khẩu không chính xác". | Hệ thống từ chối đăng nhập và báo lỗi rõ ràng. | **PASS** |
| **TC11** | Thông báo trùng email khi Đăng ký | Đăng ký bằng email đã có trong hệ thống. | Email: `student@ptit.edu.vn` | Hiển thị thông báo: "Email này đã được sử dụng. Vui lòng chọn email khác" (HTTP 400). | Báo lỗi email trùng lặp chính xác. | **PASS** |
| **TC12** | Đăng ký tài khoản mới thành công | Nhập đầy đủ họ tên, email mới, mật khẩu hợp lệ rồi bấm Đăng ký. | Họ tên: `Lê Hoàng C`<br>Email: `lehoangc@ptit.edu.vn`<br>Pass: `123456` | Lưu user mới vào MySQL, hiện thông báo thành công và tự động chuyển sang tab Đăng nhập. | Lưu CSDL thành công, thông báo xanh hiện lên. | **PASS** |
| **TC13** | Lưu Bearer Token vào localStorage | Đăng nhập với tài khoản hợp lệ (`student@ptit.edu.vn` / `123456`). | Tài khoản sinh viên hợp lệ | Cấp JWT Token, lưu vào `localStorage.getItem('access_token')` và lưu object user vào `localStorage.getItem('user')`. | `localStorage` lưu trữ đầy đủ `access_token` và `user`. | **PASS** |
| **TC14** | Tự động chuyển hướng sau đăng nhập | Sau khi đăng nhập thành công. | Thực hiện sau TC13 | Trình duyệt tự động chuyển hướng từ `/pages/login.html` sang `/pages/projects.html`. | Chuyển trang mượt mà trong 0.5s. | **PASS** |
| **TC15** | Chặn trang quản lý khi chưa đăng nhập | Xóa token trong `localStorage` rồi cố gắng gõ URL `/pages/projects.html` hoặc `/pages/tasks.html`. | Không có token | Hàm `auth.requireAuth()` chặn truy cập, hiện Toast cảnh báo "Vui lòng đăng nhập" và đẩy về `/pages/login.html`. | Chặn thành công, không bị lộ dữ liệu bảo mật. | **PASS** |
| **TC16** | Đăng xuất tài khoản | Bấm nút "Đăng xuất" trên thanh Header navigation. | Click nút [Đăng xuất] | Xóa token trong `localStorage`, đổi header về trạng thái chưa đăng nhập, chuyển hướng về trang Đăng nhập. | Xóa sạch token, chuyển về `login.html` an toàn. | **PASS** |

---

## 3. Bảng Báo cáo Lỗi đã phát hiện và đã sửa (Bug Log / Defect Tracking)

Trong quá trình phát triển và kiểm thử giao diện tài khoản, các lỗi sau đã được ghi nhận và xử lý triệt để:

| Mã Bug | Mô tả lỗi phát hiện | Mức độ nghiêm trọng | Nguyên nhân kỹ thuật | Giải pháp đã sửa | Trạng thái |
|---|---|:---:|---|---|:---:|
| **BUG-01** | Lỗi hiển thị thẻ `<div>` trên Header sau khi đăng nhập | **High** | VS Code Prettier tự động chèn khoảng trắng `< div class=... >` khi dùng template literal ES6. | Thay thế toàn bộ chuỗi template literal bằng chuỗi đơn `'...' + '...'` trong file `frontend/js/layout.js`. | **ĐÃ SỬA XONG** |
| **BUG-02** | Token hết hạn không tự đẩy về trang đăng nhập | **Medium** | Axios interceptor chưa bắt mã lỗi `401 Unauthorized` từ API trả về. | Bổ sung interceptor trong `frontend/js/api.js`: tự động gọi `auth.logout()` và chuyển về `login.html` khi nhận lỗi 401. | **ĐÃ SỬA XONG** |
| **BUG-03** | Tràn giao diện trên màn hình điện thoại dưới 360px | **Low** | Độ rộng cố định `padding: 24px` ở màn hình nhỏ gây tràn nút bấm. | Thêm media query `@media (max-width: 480px)` trong `frontend/css/style.css`, tự động co dãn nút 100% full width. | **ĐÃ SỬA XONG** |
| **BUG-04** | Người dùng đã đăng nhập vẫn mở lại được form login | **Low** | Thiếu hàm kiểm tra điều hướng ngược khi đã có token. | Thêm hàm `auth.redirectIfAuth('projects.html')` tại đầu file `frontend/js/pages/login.js`. | **ĐÃ SỬA XONG** |

---

## 4. Kết luận kiểm thử

* **Tổng số kịch bản kiểm thử (Test Cases):** 16
* **Số ca đạt (Pass):** 16 / 16 (Tỷ lệ: **100%**)
* **Số ca lỗi (Fail):** 0
* **Đánh giá chung:** Phân hệ Giao diện Tài khoản đáp ứng đầy đủ và vượt mức các yêu cầu kiểm thử:
  - Form hoạt động mượt mà trên cả máy tính lẫn điện thoại.
  - Validation chặt chẽ, thông báo lỗi thân thiện bằng tiếng Việt.
  - Luồng bảo mật token JWT, chặn trang và đăng xuất hoạt động an toàn, chính xác.
