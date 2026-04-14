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

  // Trigger loyalty points when billing is paid
  if (status === 'paid') {
    const points = Math.floor(billing.amount);
    await loyaltyService.addPoints(billing.userId, points, `Payment of $${billing.amount} for subscription`);
  }

  return billing;
}

// Receive billing manifest from Order Orchestration
// They send us order details, we confirm if billing passed or failed
async function processBillingManifest({ subscriptionId, orderId, amount }) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) return { success: false, reason: 'Subscription not found' };
    if (subscription.status !== 'active') return { success: false, reason: 'Subscription not active' };

    // Find the latest pending billing record for this subscription
    const billing = await prisma.billingRecord.findFirst({
      where: { subscriptionId, status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    if (!billing) return { success: false, reason: 'No pending billing record found' };

    // Mark as paid
    await updateBillingStatus(billing.id, 'paid');

    return { success: true, billingId: billing.id, orderId };
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
