const prisma = require('../prismaClient');

// Get billing history for a customer, optionally filtered by status
async function getBillingHistory(customerId, status) {
  const where = { customerId };

  if (status) {
    where.status = status; // filter by paid | failed | pending
  }

  const records = await prisma.billingRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return records;
}

module.exports = { getBillingHistory };
