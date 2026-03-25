const billingService = require('../services/billingService');

// GET /customers/:id/billing?status=paid|failed|pending
async function getBillingHistory(req, res, next) {
  try {
    const { status } = req.query;
    const records = await billingService.getBillingHistory(req.params.id, status);
    res.json(records);
  } catch (err) {
    next(err);
  }
}

module.exports = { getBillingHistory };
