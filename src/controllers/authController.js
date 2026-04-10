const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const customer = await authService.register({ name, email, phone, password });
    res.status(201).json({ message: 'Registration successful', customer });
  } catch (err) {
    if (err.message === 'Email already registered') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const result = await authService.login({ email, password });
    res.json({ message: 'Login successful', token: result.token, customer: result.customer });
  } catch (err) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

function verify(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  const result = authService.verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ valid: false, error: result.error });
  }
  res.json({ valid: true, customer: result.customer });
}

module.exports = { register, login, verify };