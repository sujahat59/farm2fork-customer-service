const prisma = require('../prismaClient');

// Calculate next billing date based on delivery frequency
function getNextBillingDate(frequency) {
  const date = new Date();
  if (frequency === 'biweekly') {
    date.setDate(date.getDate() + 14);
  } else {
    // default: weekly
    date.setDate(date.getDate() + 7);
  }
  return date;
}

// Create subscription + auto-create first billing record
async function createSubscription({ customerId, planType, deliveryFrequency, addressId }) {
  const nextBillingDate = getNextBillingDate(deliveryFrequency);

  // Plan prices — in a real system this would come from a config or DB
  const planPrices = { basic: 29.99, standard: 49.99, premium: 79.99 };
  const amount = planPrices[planType] || 29.99;

  const subscription = await prisma.subscription.create({
    data: {
      customerId,
      planType,
      deliveryFrequency,
      nextBillingDate,
      // Auto-create first billing record
      billingRecords: {
        create: {
          customerId,
          amount,
          status: 'pending',
        }
      }
    },
    include: {
      billingRecords: true,
    }
  });

  return subscription;
}

// Get subscription by ID — includes customer + delivery address
// Delivery Execution team calls this to get the drop-off address
async function getSubscriptionById(id) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          addresses: {
            where: { isDefault: true }
          }
        }
      }
    }
  });

  return subscription;
}

// Update subscription status: active | paused | cancelled
async function updateSubscriptionStatus(id, status) {
  const subscription = await prisma.subscription.update({
    where: { id },
    data: { status },
  });

  return subscription;
}

module.exports = { createSubscription, getSubscriptionById, updateSubscriptionStatus };
