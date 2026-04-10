const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farm2fork-secret-key';

async function register({ name, email, phone, password }) {
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: {
      name, email, phone, password: hashedPassword,
      loyaltyAccount: { create: { pointsBalance: 0, tier: 'bronze' } }
    },
    include: { loyaltyAccount: true }
  });

  const { password: _, ...customerWithoutPassword } = customer;
  return customerWithoutPassword;
}

async function login({ email, password }) {
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) throw new Error('Invalid email or password');

  const isValid = await bcrypt.compare(password, customer.password);
  if (!isValid) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { id: customer.id, email: customer.email, name: customer.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, status: customer.status }
  };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, customer: decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = { register, login, verifyToken };