// Trang chủ: kiểm tra kết nối API backend & hiển thị trạng thái đăng nhập
async function checkHealth() {
  const box = document.getElementById("health-status");
  if (!box) return;
  box.className = "status status-loading";
  box.textContent = "Đang kiểm tra kết nối Backend...";

  try {
    const res = await api.get("/health");
    box.className = "status status-ok";
    box.textContent = `✅ Backend kết nối thành công · Database: ${res.database || "OK"}`;
  } catch (err) {
    box.className = "status status-error";
    box.textContent = `❌ Chưa kết nối được Backend: ${err.message}`;
  }
}

function updateAuthBanner() {
  const container = document.getElementById("home-auth-banner");
  if (!container) return;

  if (auth.isAuthenticated()) {
    const user = auth.getUser();
    const name = (user && (user.full_name || user.email)) || "Sinh viên";
    container.innerHTML = `
      <div style="padding: 12px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="color: #065f46; font-weight: 600;">👋 Chào mừng ${escapeHtml(name)}!</span>
          <span style="color: #047857; font-size: 13px; margin-left: 6px;">(Đã đăng nhập, token hợp lệ)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="pages/projects.html" class="btn btn-primary btn-small">Vào Dự án của tôi &rarr;</a>
          <button type="button" class="btn btn-small btn-danger" onclick="auth.logout()">Đăng xuất</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="color: #92400e; font-size: 13px;">🔒 Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập trang quản lý dự án.</span>
        <a href="pages/login.html" class="btn btn-primary btn-small">Đăng nhập ngay</a>
      </div>
    `;
  }
}

document.getElementById("api-url").textContent = CONFIG.API_BASE_URL;
document.getElementById("btn-recheck").addEventListener("click", checkHealth);

checkHealth();
updateAuthBanner();
