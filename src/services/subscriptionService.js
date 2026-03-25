const prisma = require('../prismaClient');
const integrationService = require('./integrationService');

function getNextBillingDate(frequency) {
  const date = new Date();
  date.setDate(date.getDate() + (frequency === 'biweekly' ? 14 : 7));
  return date;
}

const PLAN_PRICES = { basic: 29.99, standard: 49.99, premium: 79.99 };

async function createSubscription({ customerId, planType, deliveryFrequency, addressId }) {
  const nextBillingDate = getNextBillingDate(deliveryFrequency);
  const amount = PLAN_PRICES[planType] || 29.99;

  const subscription = await prisma.subscription.create({
    data: {
      customerId,
      planType,
      deliveryFrequency,
      nextBillingDate,
      addressId: addressId || null,
      billingRecords: {
        create: { customerId, amount, status: 'pending' }
      }
    },
    include: { billingRecords: true, address: true }
  });

  return subscription;
}

// Used by Delivery Execution — returns subscription + address + customer
async function getSubscriptionById(id) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      address: true,
      customer: {
        select: { id: true, name: true, email: true, phone: true }
      }
    }
  });
}

async function updateSubscriptionStatus(id, status) {
  const exists = await prisma.subscription.findUnique({ where: { id } });
  if (!exists) return null;

  return prisma.subscription.update({ where: { id }, data: { status } });
}

// Renew a subscription — creates new billing record + triggers order
async function renewSubscription(id) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { address: true }
  });

  if (!subscription) return null;
  if (subscription.status !== 'active') {
    throw new Error('Cannot renew a subscription that is not active');
  }

  const amount = PLAN_PRICES[subscription.planType] || 29.99;
  const nextBillingDate = getNextBillingDate(subscription.deliveryFrequency);

  // Create new billing record for this cycle
  const billing = await prisma.billingRecord.create({
    data: {
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      amount,
      status: 'pending',
    }
  });

  // Update next billing date
  await prisma.subscription.update({
    where: { id },
    data: { nextBillingDate }
  });

  // Trigger order with Order Orchestration
  const order = await integrationService.createOrder({
    customerId: subscription.customerId,
    subscriptionId: subscription.id,
    deliveryAddressId: subscription.addressId,
  });

  return { subscription, billing, order };
}

module.exports = { createSubscription, getSubscriptionById, updateSubscriptionStatus, renewSubscription };
