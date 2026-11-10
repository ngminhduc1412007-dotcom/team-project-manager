// ==========================================================
// STUDENT PROJECT HUB - MODULE GỌI API DÙNG CHUNG (API CLIENT)
// Sử dụng Axios instance, tích hợp token tự động, gom xử lý lỗi
// ==========================================================

class ApiError extends Error {
  constructor(message, status = 0, code = "UNKNOWN_ERROR", data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status; // HTTP status code (400, 401, 403, 404, 409, 500,...)
    this.code = code;     // Mã lỗi định danh theo SRS (VD: CONFLICT_VERSION)
    this.data = data;     // Dữ liệu thô từ server trả về
  }
}

// Khởi tạo instance axios dùng chung
const http = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000, // Quá 10 giây báo timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- REQUEST INTERCEPTOR ----------
// Tự động đính kèm Bearer token vào header Authorization nếu đã đăng nhập
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- HÀM PHÂN TÍCH LỖI SERVER ----------
function extractErrorInfo(data, status) {
  let message = `Lỗi hệ thống (${status})`;
  let code = "HTTP_ERROR";

  if (!data) return { message, code };

  // 1. Định dạng lỗi chuẩn theo SRS Mục 10.3: { success: false, error: { message, code } }
  if (data.error && typeof data.error === "object") {
    if (data.error.message) message = data.error.message;
    if (data.error.code) code = data.error.code;
    return { message, code };
  }

  // 2. Định dạng lỗi của FastAPI: { detail: "..." } hoặc { detail: [...] }
  if (typeof data.detail === "string") {
    message = data.detail;
    code = "FASTAPI_ERROR";
    return { message, code };
  }

  if (Array.isArray(data.detail)) {
    message = data.detail.map((e) => {
      const field = e.loc ? e.loc[e.loc.length - 1] : "dữ liệu";
      return `${field}: ${e.msg}`;
    }).join("; ");
    code = "VALIDATION_ERROR";
    return { message, code };
  }

  // 3. Tin nhắn lỗi dạng chuỗi thông thường
  if (typeof data.message === "string") {
    message = data.message;
  }

  // 4. Các mã HTTP phổ biến
  if (status === 401) {
    message = message || "Phiên làm việc đã hết hạn hoặc chưa đăng nhập.";
    code = "UNAUTHORIZED";
  } else if (status === 403) {
    message = message || "Bạn không có quyền thực hiện thao tác này.";
    code = "FORBIDDEN";
  } else if (status === 404) {
    message = message || "Không tìm thấy dữ liệu yêu cầu.";
    code = "NOT_FOUND";
  } else if (status === 409) {
    message = message || "Dữ liệu bị xung đột do có người khác vừa cập nhật.";
    code = "CONFLICT_VERSION";
  }

  return { message, code };
}

// ---------- RESPONSE INTERCEPTOR ----------
http.interceptors.response.use(
  (response) => {
    // Trả về thẳng payload dữ liệu
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const { message, code } = extractErrorInfo(data, status);

      // Nếu gặp lỗi 401 (chưa đăng nhập / phiên bị khoá theo FR-064):
      if (status === 401) {
        console.warn("[API] 401 Unauthorized:", message);
        // Có thể bắn custom event để layout/UI xử lý đăng xuất
        window.dispatchEvent(new CustomEvent("sph:unauthorized", { detail: { message } }));
      }

      return Promise.reject(new ApiError(message, status, code, data));
    }

    // Không có phản hồi từ backend (mất mạng, CORS, sai port, timeout)
    const netMsg = "Không thể kết nối đến Backend. Vui lòng kiểm tra server hoặc CONFIG.API_BASE_URL.";
    return Promise.reject(new ApiError(netMsg, 0, "NETWORK_ERROR"));
  }
);

// Wrapper tiện lợi trả về thẳng response.data
const api = {
  get: (path, params) => http.get(path, { params }).then((res) => res.data),
  post: (path, body) => http.post(path, body).then((res) => res.data),
  put: (path, body) => http.put(path, body).then((res) => res.data),
  patch: (path, body) => http.patch(path, body).then((res) => res.data),
  delete: (path) => http.delete(path).then((res) => res.data),
};

