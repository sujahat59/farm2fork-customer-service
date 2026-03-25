const billingService = require('../services/billingService');

async function getBillingHistory(req, res, next) {
  try {
    const { status } = req.query;
    const records = await billingService.getBillingHistory(req.params.id, status);
    res.json(records);
  } catch (err) { next(err); }
}

// PATCH /billing/:id/status
async function updateBillingStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'failed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const record = await billingService.updateBillingStatus(req.params.id, status);
    if (!record) return res.status(404).json({ error: 'Billing record not found' });
    res.json(record);
  } catch (err) { next(err); }
}

module.exports = { getBillingHistory, updateBillingStatus };
