const prisma = require('../prismaClient');

// Create a new delivery address for a customer
async function createAddress({ customerId, street, city, province, postalCode, isDefault }) {
  // If this is the first address or isDefault is true, make it default
  // and unset any previous default
  if (isDefault) {
    await prisma.deliveryAddress.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If no addresses exist yet, auto-set as default
  const existing = await prisma.deliveryAddress.count({ where: { customerId } });
  const shouldBeDefault = isDefault || existing === 0;

  const address = await prisma.deliveryAddress.create({
    data: { customerId, street, city, province, postalCode, isDefault: shouldBeDefault }
  });

  return address;
}

// Get all addresses for a customer
async function getAddresses(customerId) {
  return prisma.deliveryAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
  });
}

// Update an address
async function updateAddress(id, data) {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  try {
    return await prisma.deliveryAddress.update({
      where: { id },
      data: cleanData,
    });
  } catch {
    return null;
  }
}

// Set a specific address as the default for a customer
async function setDefault(customerId, addressId) {
  // Unset all current defaults
  await prisma.deliveryAddress.updateMany({
    where: { customerId, isDefault: true },
    data: { isDefault: false },
  });

  // Set the new default
  return prisma.deliveryAddress.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
}

module.exports = { createAddress, getAddresses, updateAddress, setDefault };
