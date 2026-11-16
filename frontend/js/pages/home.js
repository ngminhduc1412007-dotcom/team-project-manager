// Trang chủ: kiểm tra kết nối API backend
async function checkHealth() {
  const box = document.getElementById("health-status");
  if (!box) return;
  box.className = "status status-loading";
  box.textContent = "Đang kiểm tra kết nối Backend...";

  try {
    const res = await api.get("/health");
    box.className = "status status-ok";
    const appName = res.data?.app_name || CONFIG.APP_NAME;
    const env = res.data?.environment || "development";
    const statusText = res.data?.status || "healthy";
    box.textContent = `✅ Backend kết nối thành công (${statusText}) · Môi trường: ${env} · Dịch vụ: ${appName}`;
  } catch (err) {
    box.className = "status status-error";
    box.textContent = `❌ Chưa kết nối được Backend: ${err.message}`;
  }
}

const apiUrlEl = document.getElementById("api-url");
if (apiUrlEl) {
  apiUrlEl.textContent = CONFIG.API_BASE_URL;
}

const btnRecheck = document.getElementById("btn-recheck");
if (btnRecheck) {
  btnRecheck.addEventListener("click", checkHealth);
}

checkHealth();
