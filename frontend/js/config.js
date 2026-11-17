// Cấu hình chung của frontend: tự động nhận diện URL Backend phù hợp
const getApiBaseUrl = () => {
  // Nếu frontend đang được serve trực tiếp từ backend (cổng 8000)
  if (
    typeof window !== "undefined" &&
    window.location &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") &&
    window.location.port === "8000"
  ) {
    return "/api";
  }
  // Mặc định gọi API backend qua cổng 8000 khi chạy qua Live Server (cổng 5500), Vite hoặc file://
  return "http://127.0.0.1:8000/api";
};

const CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  APP_NAME: "Student Project Management System",
};
