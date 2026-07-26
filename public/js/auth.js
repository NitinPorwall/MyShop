// Shared logic for login.html and register.html.

const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.querySelector('#login-error');
    errorEl.style.display = 'none';
    try {
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.user);
      window.location.href = data.user.role === 'seller' ? '/seller-dashboard.html' : '/';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });
}

const registerForm = document.querySelector('#register-form');
if (registerForm) {
  let selectedRole = 'customer';
  document.querySelectorAll('.role-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-toggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.querySelector('#register-error');
    errorEl.style.display = 'none';
    try {
      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role: selectedRole }),
      });
      setSession(data.token, data.user);
      window.location.href = data.user.role === 'seller' ? '/seller-dashboard.html' : '/';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });
}
