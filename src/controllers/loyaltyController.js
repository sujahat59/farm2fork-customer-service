const loyaltyService = require('../services/loyaltyService');

// GET /customers/:id/loyalty
async function getLoyalty(req, res, next) {
  try {
    const loyalty = await loyaltyService.getLoyaltyAccount(req.params.id);

    if (!loyalty) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    res.json(loyalty);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLoyalty };
