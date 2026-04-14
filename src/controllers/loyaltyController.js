const loyaltyService = require('../services/loyaltyService');

async function getLoyalty(req, res, next) {
  try {
    const loyalty = await loyaltyService.getLoyaltyAccount(req.params.id);
    if (!loyalty) return res.status(404).json({ error: 'Loyalty account not found' });
    res.json(loyalty);
  } catch (err) { next(err); }
}

async function getPointsHistory(req, res, next) {
  try {
    const history = await loyaltyService.getPointsHistory(req.params.id);
    if (!history) return res.status(404).json({ error: 'Loyalty account not found' });
    res.json(history);
  } catch (err) { next(err); }
}

module.exports = { getLoyalty, getPointsHistory };
