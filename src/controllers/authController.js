const authService = require('../services/authService');
const csv = require('csvtojson');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const user = await authService.register({ name, email, phone, password });
    res.status(201).json({ message: 'Registration successful', user });
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

    // Role based redirect info
    const redirectUrl = result.role === 'driver'
      ? process.env.DELIVERY_REDIRECT_URL || 'http://localhost:4000/driver/dashboard'
      : null;

    res.json({
      message: 'Login successful',
      token: result.token,
      role: result.role,
      user: result.user,
      redirectUrl,
    });
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
  if (!token) return res.status(400).json({ error: 'No token provided' });

  const result = authService.verifyToken(token);
  if (!result.valid) return res.status(401).json({ valid: false, error: result.error });

  res.json({ valid: true, user: result.user });
}

async function importDriversCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const csvString = req.file.buffer.toString('utf8');
    const drivers = await csv().fromString(csvString);

    if (!drivers.length) return res.status(400).json({ error: 'CSV file is empty' });

    const result = await authService.importDrivers(drivers);
    res.json({ message: 'Driver import complete', ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, verify, importDriversCSV, upload };
