const prisma = require('../prismaClient');

const VALID_PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];

function validatePostalCode(code) {
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(code);
}

function validateProvince(province) {
  return VALID_PROVINCES.includes(province.toUpperCase());
}

async function createAddress({ userId, street, city, province, postalCode, isDefault }) {
  if (!validatePostalCode(postalCode)) {
    throw new Error('Invalid postal code format. Example: N2L 3G1');
  }
  if (!validateProvince(province)) {
    throw new Error(`Invalid province. Must be one of: ${VALID_PROVINCES.join(', ')}`);
  }

  if (isDefault) {
    await prisma.deliveryAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  const existing = await prisma.deliveryAddress.count({ where: { userId } });
  const shouldBeDefault = isDefault || existing === 0;

  return prisma.deliveryAddress.create({
    data: {
      userId, street, city,
      province: province.toUpperCase(),
      postalCode: postalCode.toUpperCase(),
      isDefault: shouldBeDefault
    }
  });
}

async function getAddresses(userId) {
  return prisma.deliveryAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
  });
}

async function updateAddress(id, data) {
  if (data.postalCode && !validatePostalCode(data.postalCode)) {
    throw new Error('Invalid postal code format. Example: N2L 3G1');
  }
  if (data.province && !validateProvince(data.province)) {
    throw new Error(`Invalid province. Must be one of: ${VALID_PROVINCES.join(', ')}`);
  }

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  if (cleanData.province) cleanData.province = cleanData.province.toUpperCase();
  if (cleanData.postalCode) cleanData.postalCode = cleanData.postalCode.toUpperCase();

  try {
    return await prisma.deliveryAddress.update({ where: { id }, data: cleanData });
  } catch {
    return null;
  }
}

async function deleteAddress(id) {
  try {
    return await prisma.deliveryAddress.delete({ where: { id } });
  } catch {
    return null;
  }
}

async function setDefault(userId, addressId) {
  await prisma.deliveryAddress.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false }
  });
  return prisma.deliveryAddress.update({
    where: { id: addressId },
    data: { isDefault: true }
  });
}

module.exports = { createAddress, getAddresses, updateAddress, deleteAddress, setDefault };
