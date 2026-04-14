const subscriptionService = require('../services/subscriptionService');

async function createSubscription(req, res, next) {
  try {
    const { planType, boxType, planDuration, addressId } = req.body;
    if (!planType) return res.status(400).json({ error: 'planType is required' });

    const validBoxTypes = ['fruit', 'veggie', 'meat'];
    const validDurations = ['weekly', 'monthly', 'yearly'];

    if (boxType && !validBoxTypes.includes(boxType)) {
      return res.status(400).json({ error: `boxType must be one of: ${validBoxTypes.join(', ')}` });
    }
    if (planDuration && !validDurations.includes(planDuration)) {
      return res.status(400).json({ error: `planDuration must be one of: ${validDurations.join(', ')}` });
    }

    const subscription = await subscriptionService.createSubscription({
      userId: req.params.id,
      planType,
      boxType: boxType || 'fruit',
      planDuration: planDuration || 'weekly',
      addressId,
    });
    res.status(201).json(subscription);
  } catch (err) { next(err); }
}

async function getSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (err) { next(err); }
}

async function getSubscriptionHistory(req, res, next) {
  try {
    const history = await subscriptionService.getSubscriptionHistory(req.params.id);
    res.json(history);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['active', 'paused', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const subscription = await subscriptionService.updateSubscriptionStatus(req.params.id, status);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (err) { next(err); }
}

async function renewSubscription(req, res, next) {
  try {
    const result = await subscriptionService.renewSubscription(req.params.id);
    if (!result) return res.status(404).json({ error: 'Subscription not found' });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { createSubscription, getSubscription, getSubscriptionHistory, updateStatus, renewSubscription };
