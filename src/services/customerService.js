const prisma = require('../prismaClient');

async function createCustomer({ name, email, phone }) {
  const customer = await prisma.customer.create({
    data: {
      name, email, phone,
      loyaltyAccount: {
        create: { pointsBalance: 0, tier: 'bronze' }
      }
    },
    include: { loyaltyAccount: true }
  });
  return customer;
}

async function getCustomerById(id) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      subscriptions: {
        where: { status: 'active' },
        select: { id: true, planType: true, status: true }
      },
      loyaltyAccount: true,
      addresses: { where: { isDefault: true } }
    }
  });
}

async function updateCustomer(id, data) {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  // Check exists first to return clean 404 instead of Prisma throwing
  const exists = await prisma.customer.findUnique({ where: { id } });
  if (!exists) return null;

  return prisma.customer.update({ where: { id }, data: cleanData });
}

module.exports = { createCustomer, getCustomerById, updateCustomer };
