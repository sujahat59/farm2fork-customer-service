const prisma = require('../prismaClient');
const integrationService = require('./integrationService');

// Pricing matrix — boxType + planDuration
const PRICES = {
  fruit: { weekly: 29.99, monthly: 109.99, yearly: 1199.99 },
  veggie: { weekly: 27.99, monthly: 99.99,  yearly: 1099.99 },
  meat:  { weekly: 49.99, monthly: 179.99, yearly: 1999.99 },
};

function getPrice(boxType, planDuration) {
  return PRICES[boxType]?.[planDuration] || 29.99;
}

function getNextBillingDate(planDuration) {
  const date = new Date();
  if (planDuration === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (planDuration === 'yearly') date.setFullYear(date.getFullYear() + 1);
  else date.setDate(date.getDate() + 7); // weekly default
  return date;
}

async function createSubscription({ userId, planType, boxType = 'fruit', planDuration = 'weekly', addressId }) {
  const nextBillingDate = getNextBillingDate(planDuration);
  const amount = getPrice(boxType, planDuration);

  const subscription = await prisma.subscription.create({
    data: {
      userId, planType, boxType, planDuration,
      nextBillingDate, addressId: addressId || null,
      billingRecords: {
        create: { userId, amount, status: 'pending' }
      }
    },
    include: { billingRecords: true, address: true }
  });

  return subscription;
}

async function getSubscriptionById(id) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      address: true,
      user: { select: { id: true, name: true, email: true, phone: true } }
    }
  });
}

async function getSubscriptionHistory(userId) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { billingRecords: true }
  });
}

async function updateSubscriptionStatus(id, status) {
  const exists = await prisma.subscription.findUnique({ where: { id } });
  if (!exists) return null;

  // If cancelling — mark any pending billing as cancelled
  if (status === 'cancelled') {
    await prisma.billingRecord.updateMany({
      where: { subscriptionId: id, status: 'pending' },
      data: { status: 'failed' }
    });
  }

  return prisma.subscription.update({ where: { id }, data: { status } });
}

async function renewSubscription(id) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { address: true }
  });

  if (!subscription) return null;
  if (subscription.status !== 'active') {
    throw new Error('Cannot renew a subscription that is not active');
  }

  const amount = getPrice(subscription.boxType, subscription.planDuration);
  const nextBillingDate = getNextBillingDate(subscription.planDuration);

  const billing = await prisma.billingRecord.create({
    data: {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount, status: 'pending',
    }
  });

  await prisma.subscription.update({
    where: { id },
    data: { nextBillingDate }
  });

  // Call Order Orchestration — replace URL when they confirm
  const order = await integrationService.createOrder({
    userId: subscription.userId,
    subscriptionId: subscription.id,
    deliveryAddressId: subscription.addressId,
  });

  return { subscription, billing, order };
}

module.exports = { createSubscription, getSubscriptionById, getSubscriptionHistory, updateSubscriptionStatus, renewSubscription };
