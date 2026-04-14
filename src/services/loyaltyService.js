const prisma = require('../prismaClient');

function getTier(points) {
  if (points >= 1000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}

async function getLoyaltyAccount(userId) {
  return prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });
}

async function addPoints(userId, points, reason) {
  const loyalty = await prisma.loyaltyAccount.update({
    where: { userId },
    data: {
      pointsBalance: { increment: points },
      lastUpdated: new Date(),
      history: {
        create: { points, reason }
      }
    }
  });

  const newTier = getTier(loyalty.pointsBalance);
  if (newTier !== loyalty.tier) {
    await prisma.loyaltyAccount.update({
      where: { userId },
      data: { tier: newTier }
    });
  }

  return prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });
}

async function getPointsHistory(userId) {
  const loyalty = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { history: { orderBy: { createdAt: 'desc' } } }
  });
  if (!loyalty) return null;
  return loyalty.history;
}

module.exports = { getLoyaltyAccount, addPoints, getPointsHistory };
