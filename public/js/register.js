const API = 'https://farm2fork-customer-service.onrender.com';

initFarmer('farmer');

document.getElementById('name').addEventListener('input', function () {
  setFarmerState(this.value.length > 0 ? 'typing' : 'idle');
});

['email', 'phone', 'password'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input',  () => setFarmerState('typing'));
  el.addEventListener('blur',   () => setFarmerState('thinking'));
});

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name      = document.getElementById('name').value.trim();
  const email     = document.getElementById('email').value.trim();
  const phone     = document.getElementById('phone').value.trim();
  const password  = document.getElementById('password').value.trim();
  const errorEl   = document.getElementById('errorMsg');
  const successEl = document.getElementById('successMsg');
  const btn       = document.getElementById('registerBtn');

  errorEl.style.display   = 'none';
  successEl.style.display = 'none';
  btn.textContent = 'Creating account...';
  btn.disabled    = true;
  setFarmerState('thinking');

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setFarmerState('happy');
      successEl.textContent   = 'Welcome to Farm2Fork! Redirecting...';
      successEl.style.display = 'block';
      setTimeout(() => window.location.href = 'login.html', 1400);
    } else {
      setFarmerState('idle');
      errorEl.textContent   = data.error || 'Registration failed';
      errorEl.style.display = 'block';
    }
  } catch {
    setFarmerState('idle');
    errorEl.textContent   = 'Cannot connect to server';
    errorEl.style.display = 'block';
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled    = false;
  }
});
