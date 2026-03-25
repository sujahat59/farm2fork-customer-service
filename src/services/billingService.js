const prisma = require('../prismaClient');

async function getBillingHistory(customerId, status) {
  const where = { customerId };
  if (status) where.status = status;

  return prisma.billingRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

// Mark a billing record as paid or failed
async function updateBillingStatus(id, status) {
  const exists = await prisma.billingRecord.findUnique({ where: { id } });
  if (!exists) return null;

  const data = { status };
  if (status === 'paid') {
    data.paidAt = new Date();
    data.invoiceRef = 'INV-' + Date.now();
  }

  return prisma.billingRecord.update({ where: { id }, data });
}

module.exports = { getBillingHistory, updateBillingStatus };
