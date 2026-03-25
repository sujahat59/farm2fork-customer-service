const subscriptionService = require('../services/subscriptionService');

// POST /customers/:id/subscriptions
async function createSubscription(req, res, next) {
  try {
    const { planType, deliveryFrequency, addressId } = req.body;

    if (!planType) {
      return res.status(400).json({ error: 'planType is required' });
    }

    const subscription = await subscriptionService.createSubscription({
      customerId: req.params.id,
      planType,
      deliveryFrequency: deliveryFrequency || 'weekly',
      addressId,
    });

    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
}

// GET /subscriptions/:id
async function getSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (err) {
    next(err);
  }
}

// PATCH /subscriptions/:id/status
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['active', 'paused', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }

    const subscription = await subscriptionService.updateSubscriptionStatus(req.params.id, status);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (err) {
    next(err);
  }
}

module.exports = { createSubscription, getSubscription, updateStatus };
