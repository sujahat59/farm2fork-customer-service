const API = 'http://localhost:3000';

initFarmer('farmer');

// React to email typing
document.getElementById('email').addEventListener('input', function () {
  if (this.value.length > 0) {
    setFarmerState('typing');
  } else {
    setFarmerState('idle');
  }
});

document.getElementById('email').addEventListener('blur', function () {
  setFarmerState(this.value.length > 0 ? 'thinking' : 'idle');
});

document.getElementById('password').addEventListener('input', function () {
  setFarmerState(this.value.length > 0 ? 'thinking' : 'idle');
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl  = document.getElementById('errorMsg');
  const btn      = document.getElementById('loginBtn');

  errorEl.style.display = 'none';
  btn.textContent = 'Logging in...';
  btn.disabled    = true;
  setFarmerState('thinking');

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setFarmerState('happy');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        if (data.role === 'driver') {
          const redirect = data.redirectUrl || 'driver.html';
          window.location.href = `${redirect}?token=${data.token}`;
        } else {
          window.location.href = 'customer.html';
        }
      }, 700);
    } else {
      setFarmerState('idle');
      errorEl.textContent   = data.error || 'Invalid email or password';
      errorEl.style.display = 'block';
    }
  } catch {
    setFarmerState('idle');
    errorEl.textContent   = 'Cannot connect to server. Is it running?';
    errorEl.style.display = 'block';
  } finally {
    btn.textContent = 'Login';
    btn.disabled    = false;
  }
});
