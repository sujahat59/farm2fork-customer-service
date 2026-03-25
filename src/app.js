const express = require('express');
const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/customers',      require('./routes/customerRoutes'));
app.use('/subscriptions',  require('./routes/subscriptionRoutes'));

// ── Health check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-subscriptions' });
});

// ── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
