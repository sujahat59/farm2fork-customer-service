const prisma = require('../prismaClient');

// Get loyalty account for a customer
async function getLoyaltyAccount(customerId) {
  const loyalty = await prisma.loyaltyAccount.findUnique({
    where: { customerId },
  });

  return loyalty;
}

// Add points to a customer's loyalty account
// Called internally when an order is fulfilled
async function addPoints(customerId, points) {
  const loyalty = await prisma.loyaltyAccount.update({
    where: { customerId },
    data: {
      pointsBalance: { increment: points },
      lastUpdated: new Date(),
    }
  });

  // Upgrade tier based on total points
  const tier = loyalty.pointsBalance >= 1000 ? 'gold'
             : loyalty.pointsBalance >= 500  ? 'silver'
             : 'bronze';

  return prisma.loyaltyAccount.update({
    where: { customerId },
    data: { tier }
  });
}

module.exports = { getLoyaltyAccount, addPoints };
