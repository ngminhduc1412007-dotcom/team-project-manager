const PROFILE_STORAGE_KEY = "sph_user_profile_demo";

const defaultProfile = {
  id: 1,
  full_name: "Lê Quang Huy",
  email: "huy.lq@ptit.edu.vn",
  role: "STUDENT",
  avatar_url: "",
  bio: "Sinh viên CNTT PTIT · Tham gia phát triển nền tảng quản lý đồ án nhóm Student Project Hub.",
  is_active: true,
  created_at: "2026-09-01T08:00:00Z",
  updated_at: new Date().toISOString()
};

let currentProfile = { ...defaultProfile };

const summaryAvatar = document.getElementById("summary-avatar");
const summaryFullname = document.getElementById("summary-fullname");
const summaryEmail = document.getElementById("summary-email");
const summaryRole = document.getElementById("summary-role");
const summaryStatus = document.getElementById("summary-status");
const summaryBio = document.getElementById("summary-bio");
const summaryId = document.getElementById("summary-id");
const summaryCreated = document.getElementById("summary-created");
const summaryUpdated = document.getElementById("summary-updated");

const profileForm = document.getElementById("profile-form");
const profileAlert = document.getElementById("profile-alert");
const fullnameInput = document.getElementById("profile-fullname");
const fullnameError = document.getElementById("profile-fullname-error");
const fullnameCounter = document.getElementById("fullname-counter");
const emailInput = document.getElementById("profile-email");
const emailError = document.getElementById("profile-email-error");
const avatarInput = document.getElementById("profile-avatar-url");
const avatarError = document.getElementById("profile-avatar-error");
const bioInput = document.getElementById("profile-bio");
const bioError = document.getElementById("profile-bio-error");
const bioCounter = document.getElementById("bio-counter");
const btnResetProfile = document.getElementById("btn-reset-profile");
const btnSaveProfile = document.getElementById("btn-save-profile");

const passwordForm = document.getElementById("password-form");
const passwordAlert = document.getElementById("password-alert");
const oldPasswordInput = document.getElementById("old-password");
const oldPasswordError = document.getElementById("old-password-error");
const newPasswordInput = document.getElementById("new-password");
const newPasswordError = document.getElementById("new-password-error");
const confirmPasswordInput = document.getElementById("confirm-password");
const confirmPasswordError = document.getElementById("confirm-password-error");
const strengthFill = document.getElementById("password-strength-fill");
const strengthText = document.getElementById("password-strength-text");
const btnChangePassword = document.getElementById("btn-change-password");

function getInitials(name) {
  const parts = String(name || "U").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function safeFormatDate(val) {
  if (typeof formatDate === "function") return formatDate(val);
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("vi-VN");
}

function showAlert(el, message, type) {
  if (typeof showToast === "function") {
    showToast(message, type);
  }
  if (!el) return;
  el.textContent = message;
  el.className = "feedback-alert is-visible " + (type === "error" ? "error" : "success");
}

function hideAlert(el) {
  if (!el) return;
  el.className = "feedback-alert";
  el.textContent = "";
}

function setFieldError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add("is-invalid");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("is-visible");
  }
}

function clearFieldError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove("is-invalid");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("is-visible");
  }
}

function renderAvatarPreview(avatarUrl, fullName) {
  if (!summaryAvatar) return;
  const trimmedUrl = String(avatarUrl || "").trim();
  if (trimmedUrl && /^https?:\/\/.+/i.test(trimmedUrl)) {
    const img = document.createElement("img");
    img.src = trimmedUrl;
    img.alt = fullName || "Avatar";
    img.onerror = () => {
      summaryAvatar.textContent = getInitials(fullName);
    };
    summaryAvatar.innerHTML = "";
    summaryAvatar.appendChild(img);
  } else {
    summaryAvatar.textContent = getInitials(fullName);
  }
}

function updateCharCounters() {
  if (fullnameCounter && fullnameInput) {
    fullnameCounter.textContent = fullnameInput.value.length + "/100";
  }
  if (bioCounter && bioInput) {
    bioCounter.textContent = bioInput.value.length + "/1000";
  }
}

function renderProfileSummary(profile) {
  renderAvatarPreview(profile.avatar_url, profile.full_name);

  if (summaryFullname) summaryFullname.textContent = profile.full_name || "Chưa cập nhật";
  if (summaryEmail) summaryEmail.textContent = profile.email || "—";
  if (summaryRole) summaryRole.textContent = String(profile.role || "STUDENT").toUpperCase();

  if (summaryStatus) {
    const active = profile.is_active !== false;
    summaryStatus.textContent = active ? "Đang hoạt động" : "Đã khóa";
    summaryStatus.className = "badge " + (active ? "badge-active" : "badge-locked");
  }

  if (summaryBio) {
    summaryBio.textContent = profile.bio && profile.bio.trim()
      ? profile.bio
      : "Chưa có mô tả giới thiệu bản thân.";
  }

  if (summaryId) summaryId.textContent = "#" + (profile.id || 1);
  if (summaryCreated) summaryCreated.textContent = safeFormatDate(profile.created_at);
  if (summaryUpdated) summaryUpdated.textContent = safeFormatDate(profile.updated_at);
}

function fillProfileForm(profile) {
  if (fullnameInput) fullnameInput.value = profile.full_name || "";
  if (emailInput) emailInput.value = profile.email || "";
  if (avatarInput) avatarInput.value = profile.avatar_url || "";
  if (bioInput) bioInput.value = profile.bio || "";
  updateCharCounters();
}

function loadLocalProfileFallback() {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return { ...defaultProfile, ...parsed };
    }
  } catch (e) {}

  const authUser = typeof auth !== "undefined" && auth.getUser ? auth.getUser() : null;
  if (authUser && (authUser.full_name || authUser.email)) {
    return { ...defaultProfile, ...authUser };
  }
  return { ...defaultProfile };
}

function persistLocalProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (typeof auth !== "undefined" && auth.setUser && auth.getUser && auth.getUser()) {
      auth.setUser({ ...auth.getUser(), ...profile });
      if (typeof renderLayout === "function") renderLayout();
    }
  } catch (e) {}
}

async function loadUserProfile() {
  currentProfile = loadLocalProfileFallback();
  renderProfileSummary(currentProfile);
  fillProfileForm(currentProfile);

  try {
    const hasToken = typeof auth !== "undefined" && auth.getToken ? Boolean(auth.getToken()) : false;
    if (hasToken && typeof api !== "undefined" && api.get) {
      const res = await api.get("/users/me");
      const data = res?.data || res;
      if (data && data.email) {
        currentProfile = { ...currentProfile, ...data };
        persistLocalProfile(currentProfile);
        renderProfileSummary(currentProfile);
        fillProfileForm(currentProfile);
      }
    }
  } catch (err) {
    // Giữ dữ liệu local nếu backend chưa bật
  }
}

/* ---------- VALIDATE & LƯU FORM THÔNG TIN CÁ NHÂN ---------- */
function validateProfileForm() {
  let valid = true;
  const fullName = (fullnameInput?.value || "").trim();
  const email = (emailInput?.value || "").trim();
  const avatarUrl = (avatarInput?.value || "").trim();
  const bio = (bioInput?.value || "").trim();

  clearFieldError(fullnameInput, fullnameError);
  clearFieldError(emailInput, emailError);
  clearFieldError(avatarInput, avatarError);
  clearFieldError(bioInput, bioError);

  if (!fullName) {
    setFieldError(fullnameInput, fullnameError, "Vui lòng nhập họ và tên.");
    valid = false;
  } else if (fullName.length > 100) {
    setFieldError(fullnameInput, fullnameError, "Họ và tên không được vượt quá 100 ký tự.");
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError(emailInput, emailError, "Vui lòng nhập địa chỉ email.");
    valid = false;
  } else if (!emailRegex.test(email)) {
    setFieldError(emailInput, emailError, "Định dạng email không hợp lệ (VD: ten@ptit.edu.vn).");
    valid = false;
  }

  if (avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl)) {
    setFieldError(avatarInput, avatarError, "URL ảnh đại diện phải bắt đầu bằng http:// hoặc https://");
    valid = false;
  }

  if (bio.length > 1000) {
    setFieldError(bioInput, bioError, "Giới thiệu bản thân không được vượt quá 1000 ký tự.");
    valid = false;
  }

  return valid;
}

if (fullnameInput) {
  fullnameInput.addEventListener("input", () => {
    clearFieldError(fullnameInput, fullnameError);
    updateCharCounters();
  });
}

if (emailInput) {
  emailInput.addEventListener("input", () => clearFieldError(emailInput, emailError));
}

if (avatarInput) {
  avatarInput.addEventListener("input", () => {
    clearFieldError(avatarInput, avatarError);
    renderAvatarPreview(avatarInput.value, fullnameInput?.value || currentProfile.full_name);
  });
}

if (bioInput) {
  bioInput.addEventListener("input", () => {
    clearFieldError(bioInput, bioError);
    updateCharCounters();
  });
}

if (btnResetProfile) {
  btnResetProfile.addEventListener("click", () => {
    fillProfileForm(currentProfile);
    renderProfileSummary(currentProfile);
    clearFieldError(fullnameInput, fullnameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(avatarInput, avatarError);
    clearFieldError(bioInput, bioError);
    hideAlert(profileAlert);
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(profileAlert);
    if (!validateProfileForm()) {
      showAlert(profileAlert, "Vui lòng kiểm tra lại các trường thông tin bị lỗi.", "error");
      return;
    }

    const payload = {
      full_name: fullnameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      avatar_url: avatarInput.value.trim() || null,
      bio: bioInput.value.trim() || null
    };

    if (btnSaveProfile) {
      btnSaveProfile.disabled = true;
      btnSaveProfile.textContent = "Đang lưu...";
    }

    try {
      let updated = null;
      const hasToken = typeof auth !== "undefined" && auth.getToken ? Boolean(auth.getToken()) : false;

      if (hasToken && typeof api !== "undefined" && api.put) {
        try {
          const res = await api.put("/users/me", payload);
          updated = res?.data || res;
        } catch (apiErr) {
          if (apiErr && apiErr.status && apiErr.status !== 0) {
            throw new Error(apiErr.data?.message || apiErr.message || "Cập nhật thông tin thất bại.");
          }
        }
      }

      currentProfile = {
        ...currentProfile,
        ...(updated || payload),
        updated_at: (updated && updated.updated_at) || new Date().toISOString()
      };

      persistLocalProfile(currentProfile);
      renderProfileSummary(currentProfile);
      fillProfileForm(currentProfile);
      showAlert(profileAlert, "Cập nhật thông tin cá nhân thành công!", "success");
    } catch (err) {
      showAlert(profileAlert, err.message || "Không thể cập nhật thông tin cá nhân.", "error");
    } finally {
      if (btnSaveProfile) {
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = "Lưu thay đổi";
      }
    }
  });
}

/* ---------- VALIDATE & XỬ LÝ FORM ĐỔI MẬT KHẨU ---------- */
function updatePasswordStrength(password) {
  if (!strengthFill || !strengthText) return;
  if (!password) {
    strengthFill.style.width = "0%";
    strengthFill.style.background = "#e2e8f0";
    strengthText.textContent = "Độ mạnh mật khẩu: Chưa nhập";
    strengthText.style.color = "var(--color-muted)";
    return;
  }

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    strengthFill.style.width = "33%";
    strengthFill.style.background = "#dc2626";
    strengthText.textContent = "Độ mạnh mật khẩu: Yếu";
    strengthText.style.color = "#dc2626";
  } else if (score <= 3) {
    strengthFill.style.width = "66%";
    strengthFill.style.background = "#d97706";
    strengthText.textContent = "Độ mạnh mật khẩu: Trung bình";
    strengthText.style.color = "#d97706";
  } else {
    strengthFill.style.width = "100%";
    strengthFill.style.background = "#16a34a";
    strengthText.textContent = "Độ mạnh mật khẩu: Mạnh";
    strengthText.style.color = "#16a34a";
  }
}

document.querySelectorAll(".btn-toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.toggleFor;
    const input = document.getElementById(targetId);
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Ẩn";
    } else {
      input.type = "password";
      btn.textContent = "Hiện";
    }
  });
});

if (oldPasswordInput) {
  oldPasswordInput.addEventListener("input", () => clearFieldError(oldPasswordInput, oldPasswordError));
}

if (newPasswordInput) {
  newPasswordInput.addEventListener("input", () => {
    clearFieldError(newPasswordInput, newPasswordError);
    updatePasswordStrength(newPasswordInput.value);
  });
}

if (confirmPasswordInput) {
  confirmPasswordInput.addEventListener("input", () => clearFieldError(confirmPasswordInput, confirmPasswordError));
}

function validatePasswordForm() {
  let valid = true;
  const oldPassword = oldPasswordInput?.value || "";
  const newPassword = newPasswordInput?.value || "";
  const confirmPassword = confirmPasswordInput?.value || "";

  clearFieldError(oldPasswordInput, oldPasswordError);
  clearFieldError(newPasswordInput, newPasswordError);
  clearFieldError(confirmPasswordInput, confirmPasswordError);

  if (!oldPassword.trim()) {
    setFieldError(oldPasswordInput, oldPasswordError, "Mật khẩu hiện tại không được để trống.");
    valid = false;
  }

  if (!newPassword.trim()) {
    setFieldError(newPasswordInput, newPasswordError, "Mật khẩu mới không được để trống hoặc chỉ chứa khoảng trắng.");
    valid = false;
  } else if (newPassword.trim().length < 6) {
    setFieldError(newPasswordInput, newPasswordError, "Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.");
    valid = false;
  } else if (newPassword.length > 100) {
    setFieldError(newPasswordInput, newPasswordError, "Mật khẩu mới không được vượt quá 100 ký tự.");
    valid = false;
  } else if (oldPassword && newPassword === oldPassword) {
    setFieldError(newPasswordInput, newPasswordError, "Mật khẩu mới không được trùng với mật khẩu hiện tại.");
    valid = false;
  }

  if (!confirmPassword) {
    setFieldError(confirmPasswordInput, confirmPasswordError, "Vui lòng nhập lại xác nhận mật khẩu mới.");
    valid = false;
  } else if (confirmPassword !== newPassword) {
    setFieldError(confirmPasswordInput, confirmPasswordError, "Xác nhận mật khẩu mới không khớp.");
    valid = false;
  }

  return valid;
}

if (passwordForm) {
  passwordForm.addEventListener("reset", () => {
    clearFieldError(oldPasswordInput, oldPasswordError);
    clearFieldError(newPasswordInput, newPasswordError);
    clearFieldError(confirmPasswordInput, confirmPasswordError);
    hideAlert(passwordAlert);
    updatePasswordStrength("");
  });

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(passwordAlert);
    if (!validatePasswordForm()) {
      showAlert(passwordAlert, "Vui lòng kiểm tra lại thông tin mật khẩu.", "error");
      return;
    }

    const payload = {
      old_password: oldPasswordInput.value,
      new_password: newPasswordInput.value,
      confirm_password: confirmPasswordInput.value
    };

    if (btnChangePassword) {
      btnChangePassword.disabled = true;
      btnChangePassword.textContent = "Đang cập nhật...";
    }

    try {
      const hasToken = typeof auth !== "undefined" && auth.getToken ? Boolean(auth.getToken()) : false;

      if (hasToken && typeof api !== "undefined" && api.post) {
        try {
          await api.post("/users/change-password", payload);
        } catch (apiErr) {
          if (apiErr && apiErr.status && apiErr.status !== 0) {
            throw new Error(apiErr.data?.message || apiErr.message || "Đổi mật khẩu thất bại.");
          }
        }
      }

      passwordForm.reset();
      updatePasswordStrength("");
      showAlert(passwordAlert, "Đổi mật khẩu thành công!", "success");
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("hiện tại")) {
        setFieldError(oldPasswordInput, oldPasswordError, err.message);
      }
      showAlert(passwordAlert, err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.", "error");
    } finally {
      if (btnChangePassword) {
        btnChangePassword.disabled = false;
        btnChangePassword.textContent = "Cập nhật mật khẩu";
      }
    }
  });
}

loadUserProfile();
