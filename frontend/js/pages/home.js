// ==========================================================
// STUDENT PROJECT HUB - TRANG CHỦ & KIỂM TRA KẾT NỐI (HOME.JS)
// Sử dụng SVG icon đồng bộ cho trạng thái kết nối
// ==========================================================

async function checkBackendHealth() {
  const statusBox = document.getElementById("health-status");
  if (!statusBox) return;

  statusBox.className = "status status-loading";
  const spinnerSvg = typeof getIcon === "function" ? getIcon("spinner", { size: 20 }) : "⏳";
  statusBox.innerHTML = `${spinnerSvg} <span>Đang kiểm tra kết nối Frontend → Backend API...</span>`;

  try {
    // Gọi endpoint health check (tương thích FastAPI hoặc Express)
    const result = await api.get("/health");
    statusBox.className = "status status-ok";
    const dbStatus = result.database || result.db || "OK";
    const checkSvg = typeof getIcon === "function" ? getIcon("checkCircle", { size: 24, className: "text-success" }) : "✅";

    statusBox.innerHTML = `
      ${checkSvg}
      <div>
        <strong>Backend đã sẵn sàng!</strong><br>
        <span class="muted">Trạng thái Database: <code>${escapeHtml(dbStatus)}</code> · Thời gian: ${formatDateTime(new Date())}</span>
      </div>
    `;
    showToast("Kết nối Backend thành công!", "success");
  } catch (error) {
    statusBox.className = "status status-error";
    const errorSvg = typeof getIcon === "function" ? getIcon("alertCircle", { size: 24, className: "text-danger" }) : "❌";

    statusBox.innerHTML = `
      ${errorSvg}
      <div>
        <strong>Chưa kết nối được Backend:</strong> ${escapeHtml(error.message)}<br>
        <span class="muted">Kiểm tra xem backend đã chạy ở cổng 8000 chưa hoặc sửa <code>CONFIG.API_BASE_URL</code> trong <code>js/config.js</code>.</span>
      </div>
    `;
  }
}

// Gán thông tin khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  const apiUrlEl = document.getElementById("api-url");
  if (apiUrlEl) apiUrlEl.textContent = CONFIG.API_BASE_URL;

  const btnRecheck = document.getElementById("btn-recheck");
  if (btnRecheck) {
    btnRecheck.addEventListener("click", checkBackendHealth);
  }

  // Tự động kiểm tra kết nối ngay khi vào trang
  checkBackendHealth();
});
