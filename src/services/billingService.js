const prisma = require('../prismaClient');
const loyaltyService = require('./loyaltyService');

async function getBillingHistory(userId, status) {
  const where = { userId };
  if (status) where.status = status;
  return prisma.billingRecord.findMany({
    where, orderBy: { createdAt: 'desc' }
  });
}

async function updateBillingStatus(id, status) {
  const exists = await prisma.billingRecord.findUnique({ where: { id } });
  if (!exists) return null;

  const data = { status };
  if (status === 'paid') {
    data.paidAt = new Date();
    data.invoiceRef = 'INV-' + Date.now();
  }

  const billing = await prisma.billingRecord.update({ where: { id }, data });

  if (status === 'paid') {
    const points = Math.floor(billing.amount);
    await loyaltyService.addPoints(billing.userId, points, `Payment of $${billing.amount} for subscription`);
  }

  return billing;
}

// Receive billing manifest from Order Orchestration
// Handles both subscription billing and one-time purchase billing
async function processBillingManifest({ customerId, subscriptionId, orderId, amount }) {
  try {
    // Resolve userId
    let userId = customerId;

    if (!userId && subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });
      if (!subscription) return { success: false, reason: 'Subscription not found' };
      if (subscription.status !== 'active') return { success: false, reason: 'Subscription not active' };
      userId = subscription.userId;
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, reason: 'Customer not found' };

    let billing;

    if (subscriptionId) {
      // Subscription billing — find existing pending record and mark paid
      const pending = await prisma.billingRecord.findFirst({
        where: { subscriptionId, status: 'pending' },
        orderBy: { createdAt: 'desc' }
      });

      if (pending) {
        billing = await updateBillingStatus(pending.id, 'paid');
      } else {
        // No pending record — create and mark paid directly
        billing = await prisma.billingRecord.create({
          data: {
            userId,
            subscriptionId,
            amount: amount || 0,
            status: 'paid',
            paidAt: new Date(),
            invoiceRef: 'INV-' + Date.now(),
          }
        });
        const points = Math.floor(amount || 0);
        if (points > 0) {
          await loyaltyService.addPoints(userId, points, `Payment of $${amount} for subscription`);
        }
      }
    } else {
      // One-time purchase billing — create a new billing record
      billing = await prisma.billingRecord.create({
        data: {
          userId,
          subscriptionId: null,
          amount: amount || 0,
          status: 'paid',
          paidAt: new Date(),
          invoiceRef: 'INV-' + Date.now(),
        }
      });
      const points = Math.floor(amount || 0);
      if (points > 0) {
        await loyaltyService.addPoints(userId, points, `Payment of $${amount} for order ${orderId}`);
      }
    }

    return { success: true, billingId: billing.id, orderId, invoiceRef: billing.invoiceRef };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

async function getTotalSpent(userId) {
  const result = await prisma.billingRecord.aggregate({
    where: { userId, status: 'paid' },
    _sum: { amount: true },
    _count: true
  });
  return {
    totalSpent: result._sum.amount || 0,
    totalPayments: result._count
  };
}

module.exports = { getBillingHistory, updateBillingStatus, processBillingManifest, getTotalSpent };