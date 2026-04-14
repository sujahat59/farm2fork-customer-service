const prisma = require('../prismaClient');

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: {
        where: { status: 'active' },
        select: { id: true, planType: true, boxType: true, planDuration: true, status: true }
      },
      loyaltyAccount: true,
      addresses: { where: { isDefault: true } }
    }
  });
}

async function updateUser(id, data) {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) return null;
  return prisma.user.update({ where: { id }, data: cleanData });
}

async function deleteUser(id) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) return null;
  return prisma.user.delete({ where: { id } });
}

module.exports = { getUserById, updateUser, deleteUser };
