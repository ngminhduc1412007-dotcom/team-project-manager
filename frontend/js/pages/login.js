// ==========================================================
// TRANG XÁC THỰC (LOGIN.JS)
// Gộp Đăng nhập & Đăng ký: mặc định Đăng nhập, chưa có tài khoản thì chuyển sang Đăng ký
// ==========================================================

// 1. Các phần tử chuyển đổi giữa 2 màn hình
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const linkShowRegister = document.getElementById("link-show-register");
const linkShowLogin = document.getElementById("link-show-login");

// Form Đăng nhập
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginEmailError = document.getElementById("login-email-error");
const loginPasswordError = document.getElementById("login-password-error");
const btnLogin = document.getElementById("btn-login");
const btnQuickFill = document.getElementById("btn-quick-fill");

  // Form Đăng ký
  const regForm = document.getElementById("register-form");
  const regFullnameInput = document.getElementById("reg-fullname");
  const regEmailInput = document.getElementById("reg-email");
  const regPasswordInput = document.getElementById("reg-password");
  const regConfirmInput = document.getElementById("reg-confirm");
  const regFullnameError = document.getElementById("reg-fullname-error");
  const regEmailError = document.getElementById("reg-email-error");
  const regPasswordError = document.getElementById("reg-password-error");
  const regConfirmError = document.getElementById("reg-confirm-error");
  const btnRegister = document.getElementById("btn-register");

  // ---------- 2. CHỨC NĂNG CHUYỂN ĐỔI GIAO DIỆN ----------
  function switchToRegister() {
    loginSection.style.display = "none";
    registerSection.style.display = "block";
    document.title = "Đăng ký | " + CONFIG.APP_NAME;
    window.location.hash = "register";
    regFullnameInput.focus();
  }

  function switchToLogin() {
    registerSection.style.display = "none";
    loginSection.style.display = "block";
    document.title = "Đăng nhập | " + CONFIG.APP_NAME;
    history.replaceState(null, null, " ");
    loginEmailInput.focus();
  }

  linkShowRegister.addEventListener("click", switchToRegister);
  linkShowLogin.addEventListener("click", switchToLogin);

  // Tự động mở form Đăng ký nếu URL có chứa #register
  if (window.location.hash === "#register") {
    switchToRegister();
  }

    // ---------- 3. XÓA BÁO LỖI KHI GÕ PHÍM ----------
    [loginEmailInput, loginPasswordInput, regFullnameInput, regEmailInput, regPasswordInput, regConfirmInput].forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.remove("is-invalid");
        const err = input.parentElement.querySelector(".form-error");
        if (err) err.classList.remove("is-visible");
      });
    });

    // ---------- 4. VALIDATE & XỬ LÝ ĐĂNG NHẬP ----------
    function validateLogin() {
      let isValid = true;
      const email = loginEmailInput.value.trim();
      const password = loginPasswordInput.value;

        if (!email) {
          loginEmailInput.classList.add("is-invalid");
          loginEmailError.textContent = "Vui lòng nhập địa chỉ email";
          loginEmailError.classList.add("is-visible");
          isValid = false;
        } else if (!email.includes("@") || !email.includes(".")) {
          loginEmailInput.classList.add("is-invalid");
          loginEmailError.textContent = "Email không đúng định dạng (VD: ten@ptit.edu.vn)";
          loginEmailError.classList.add("is-visible");
          isValid = false;
        } else {
          loginEmailInput.classList.remove("is-invalid");
          loginEmailError.classList.remove("is-visible");
        }

        if (!password) {
          loginPasswordInput.classList.add("is-invalid");
          loginPasswordError.textContent = "Vui lòng nhập mật khẩu";
          loginPasswordError.classList.add("is-visible");
          isValid = false;
        } else if (password.length < 8) {
          loginPasswordInput.classList.add("is-invalid");
          loginPasswordError.textContent = "Mật khẩu phải có tối thiểu 8 ký tự";
          loginPasswordError.classList.add("is-visible");
          isValid = false;
        } else {
          loginPasswordInput.classList.remove("is-invalid");
          loginPasswordError.classList.remove("is-visible");
        }

        return isValid;
      }

loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validateLogin()) return;

        btnLogin.disabled = true;
        btnLogin.textContent = "Đang đăng nhập...";

        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        try {
          try {
            const res = await api.post("/auth/login", { email, password });
            auth.setToken(res.token || "token_demo");
            auth.setUser(res.user || { email, full_name: email.split("@")[0] });
          } catch {
            // Backend chưa chạy thì lưu session demo
            auth.setToken("token_demo");
            auth.setUser({ email, full_name: email.split("@")[0] });
          }

          showToast("Đăng nhập thành công!", "success");
          setTimeout(() => {
            window.location.href = "projects.html";
          }, 1000);
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          btnLogin.disabled = false;
          btnLogin.textContent = "Đăng nhập";
        }
      });

      // Điền nhanh tài khoản mẫu
      if (btnQuickFill) {
        btnQuickFill.addEventListener("click", () => {
          loginEmailInput.value = "truongnhom@ptit.edu.vn";
          loginPasswordInput.value = "12345678";
          loginEmailInput.classList.remove("is-invalid");
          loginEmailError.classList.remove("is-visible");
          loginPasswordInput.classList.remove("is-invalid");
          loginPasswordError.classList.remove("is-visible");
        });
      }

      // ---------- 5. VALIDATE & XỬ LÝ ĐĂNG KÝ ----------
      function validateRegister() {
        let isValid = true;
        const fullname = regFullnameInput.value.trim();
        const email = regEmailInput.value.trim();
        const password = regPasswordInput.value;
        const confirm = regConfirmInput.value;

        // 1. Họ tên
        if (!fullname) {
          regFullnameInput.classList.add("is-invalid");
          regFullnameError.textContent = "Vui lòng nhập họ và tên";
          regFullnameError.classList.add("is-visible");
          isValid = false;
        } else {
          regFullnameInput.classList.remove("is-invalid");
          regFullnameError.classList.remove("is-visible");
        }

        // 2. Email
        if (!email || !email.includes("@") || !email.includes(".")) {
          regEmailInput.classList.add("is-invalid");
          regEmailError.textContent = "Email không đúng định dạng (VD: ten@ptit.edu.vn)";
          regEmailError.classList.add("is-visible");
          isValid = false;
        } else {
          regEmailInput.classList.remove("is-invalid");
          regEmailError.classList.remove("is-visible");
        }

        // 3. Mật khẩu
        if (!password || password.length < 8) {
          regPasswordInput.classList.add("is-invalid");
          regPasswordError.textContent = "Mật khẩu phải có tối thiểu 8 ký tự";
          regPasswordError.classList.add("is-visible");
          isValid = false;
        } else {
          regPasswordInput.classList.remove("is-invalid");
          regPasswordError.classList.remove("is-visible");
        }

        // 4. Xác nhận mật khẩu khớp
        if (!confirm) {
          regConfirmInput.classList.add("is-invalid");
          regConfirmError.textContent = "Vui lòng xác nhận lại mật khẩu";
          regConfirmError.classList.add("is-visible");
          isValid = false;
        } else if (confirm !== password) {
          regConfirmInput.classList.add("is-invalid");
          regConfirmError.textContent = "Mật khẩu nhập lại không khớp";
          regConfirmError.classList.add("is-visible");
          isValid = false;
        } else {
          regConfirmInput.classList.remove("is-invalid");
          regConfirmError.classList.remove("is-visible");
        }

        return isValid;
      }

      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validateRegister()) return;

        btnRegister.disabled = true;
        btnRegister.textContent = "Đang tạo tài khoản...";

        const data = {
          full_name: regFullnameInput.value.trim(),
          email: regEmailInput.value.trim(),
          password: regPasswordInput.value,
        };

        try {
          try {
            await api.post("/auth/register", data);
          } catch {
            // Backend chưa chạy thì mô phỏng thành công
          }

          showToast("Đăng ký thành công! Hãy đăng nhập.", "success");

          // Điền sẵn email vừa đăng ký vào form đăng nhập và chuyển sang form đăng nhập
          loginEmailInput.value = data.email;
          loginPasswordInput.value = "";
          loginEmailInput.classList.remove("is-invalid");
          loginEmailError.classList.remove("is-visible");

          setTimeout(() => {
            switchToLogin();
            loginPasswordInput.focus();
          }, 1000);
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          btnRegister.disabled = false;
          btnRegister.textContent = "Đăng ký tài khoản";
        }
      });
