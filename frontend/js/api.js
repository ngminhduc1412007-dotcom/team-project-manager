// Module gọi API bằng axios: cấu hình 1 lần, mọi trang dùng chung
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const http = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn token xác thực Bearer nếu đã đăng nhập
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

  // Trích xuất thông báo lỗi chuẩn từ Backend (FastAPI / ResponseModel)
  function getErrorMessage(data, status) {
    if (data) {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message || JSON.stringify(e)))
          .join("; ");
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail
          .map((e) => `${e.loc ? e.loc[e.loc.length - 1] : "trường"}: ${e.msg}`)
          .join("; ");
      }
    }
    if (status === 401) return "Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
    if (status === 422) return "Dữ liệu gửi lên không đúng định dạng.";
    return `Lỗi hệ thống (${status})`;
  }

http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
        }
        return Promise.reject(
          new ApiError("Không kết nối được backend (http://127.0.0.1:8000). Kiểm tra server backend đã chạy chưa?", 0)
        );
      }
    );

  const api = {
    get: (path, params) => http.get(path, { params }).then((res) => res.data),
    post: (path, body) => http.post(path, body).then((res) => res.data),
    put: (path, body) => http.put(path, body).then((res) => res.data),
    patch: (path, body) => http.patch(path, body).then((res) => res.data),
    delete: (path) => http.delete(path).then((res) => res.data),
  };
