// ==========================================================
// STUDENT PROJECT HUB - CẤU HÌNH FRONTEND (CONFIG)
// Đổi API_BASE_URL nếu backend chạy ở cổng khác hoặc khi deploy
// ==========================================================

const CONFIG = {
  // Địa chỉ gốc của Backend API (FastAPI / Express)
  API_BASE_URL: "http://127.0.0.1:8000/api",
  
  // Tên ứng dụng hiển thị trên Brand & Title
  APP_NAME: "Student Project Hub",
  
  // Tên key lưu trữ phiên đăng nhập trong localStorage
  AUTH_TOKEN_KEY: "sph_access_token",
  USER_INFO_KEY: "sph_user_info",

  // Múi giờ chuẩn theo nghiệp vụ SRS (BR-19)
  TIMEZONE: "Asia/Ho_Chi_Minh",

  // Phiên bản ứng dụng
  VERSION: "1.0.0",
};

