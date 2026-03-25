const prisma = require('../prismaClient');

// Create a new customer + auto-create their loyalty account
async function createCustomer({ name, email, phone, address }) {
  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      address,
      // Auto-create loyalty account on registration
      loyaltyAccount: {
        create: {
          pointsBalance: 0,
          tier: 'bronze',
        }
      }
    },
    include: {
      loyaltyAccount: true,
    }
  });

  return customer;
}

// Fetch customer by ID — includes their active subscription IDs
// Used by Order Orchestration to validate a customer before placing an order
async function getCustomerById(id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      subscriptions: {
        where: { status: 'active' },
        select: { id: true, planType: true, status: true }
      },
      loyaltyAccount: true,
    }
  });

  return customer;
}

// Partial update — only update fields that are provided
async function updateCustomer(id, data) {
  // Remove undefined fields so we don't overwrite with null
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  const customer = await prisma.customer.update({
    where: { id },
    data: cleanData,
  });

  return customer;
}

module.exports = { createCustomer, getCustomerById, updateCustomer };
