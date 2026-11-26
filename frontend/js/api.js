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

// Tự động gắn token xác thực nếu đã đăng nhập
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function getErrorMessage(data, status) {
  if (data && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (data && typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e) => (typeof e === "string" ? e : `${e.field ? e.field + ": " : ""}${e.message || e.msg}`))
      .join("; ");
  }
  if (data && Array.isArray(data.detail)) {
    return data.detail
      .map((e) => (typeof e === "string" ? e : `${e.loc ? e.loc[e.loc.length - 1] + ": " : ""}${e.msg}`))
      .join("; ");
  }
  return `Lỗi máy chủ (${status || "Không xác định"})`;
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
    }
    return Promise.reject(
      new ApiError(
        `Không thể kết nối đến máy chủ Backend tại ${CONFIG.API_BASE_URL}. Vui lòng kiểm tra server Backend đã chạy chưa?`,
        0
      )
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
