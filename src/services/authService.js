const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farm2fork-secret-key';

async function register({ name, email, phone, password, role = 'customer' }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name, email, phone, password: hashedPassword, role,
      loyaltyAccount: { create: { pointsBalance: 0, tier: 'bronze' } }
    },
    include: { loyaltyAccount: true }
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { addresses: { where: { isDefault: true } } }
  });

  if (!user) throw new Error('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid email or password');

  const defaultAddress = user.addresses[0] || null;

  const token = jwt.sign(
    {
      id:    user.id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      address: defaultAddress ? {
        street:     defaultAddress.street,
        city:       defaultAddress.city,
        province:   defaultAddress.province,
        postalCode: defaultAddress.postalCode,
      } : null,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    role: user.role,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
  };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

async function importDrivers(drivers) {
  const results = { success: 0, failed: 0, errors: [] };

  for (const driver of drivers) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: driver.email } });
      if (existing) {
        results.errors.push(`${driver.email} already exists`);
        results.failed++;
        continue;
      }
      const hashedPassword = await bcrypt.hash(driver.password || 'driver123', 10);
      await prisma.user.create({
        data: {
          name: driver.name, email: driver.email,
          phone: driver.phone || null,
          password: hashedPassword, role: 'driver',
        }
      });
      results.success++;
    } catch (err) {
      results.errors.push(`${driver.email}: ${err.message}`);
      results.failed++;
    }
  }
  return results;
}

module.exports = { register, login, verifyToken, importDrivers };
