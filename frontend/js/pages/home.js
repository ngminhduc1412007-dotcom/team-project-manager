// Trang chủ: kiểm tra kết nối API backend
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

document.getElementById("api-url").textContent = CONFIG.API_BASE_URL;
document.getElementById("btn-recheck").addEventListener("click", checkHealth);
checkHealth();
