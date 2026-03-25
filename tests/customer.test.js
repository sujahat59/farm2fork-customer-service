const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prismaClient');

// Clean up database before each test
beforeEach(async () => {
  await prisma.billingRecord.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.customer.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// ── Customer Tests ────────────────────────────────────────────

describe('POST /customers', () => {
  it('should create a customer and auto-create a loyalty account', async () => {
    const res = await request(app)
      .post('/customers')
      .send({ name: 'Jane Doe', email: 'jane@example.com', phone: '519-555-0100' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Jane Doe');
    expect(res.body.email).toBe('jane@example.com');
    expect(res.body.status).toBe('active');

    // Auto-created loyalty account
    expect(res.body.loyaltyAccount).toBeDefined();
    expect(res.body.loyaltyAccount.pointsBalance).toBe(0);
    expect(res.body.loyaltyAccount.tier).toBe('bronze');
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/customers')
      .send({ email: 'noname@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/customers')
      .send({ name: 'No Email' });

    expect(res.status).toBe(400);
  });
});

describe('GET /customers/:id', () => {
  it('should return a customer with active subscriptions', async () => {
    // Create a customer first
    const created = await request(app)
      .post('/customers')
      .send({ name: 'John Smith', email: 'john@example.com' });

    const res = await request(app).get(`/customers/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.name).toBe('John Smith');
    expect(res.body.subscriptions).toBeDefined();
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
  });

  it('should return 404 for non-existent customer', async () => {
    const res = await request(app).get('/customers/non-existent-id');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /customers/:id', () => {
  it('should update customer fields', async () => {
    const created = await request(app)
      .post('/customers')
      .send({ name: 'Old Name', email: 'old@example.com' });

    const res = await request(app)
      .patch(`/customers/${created.body.id}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.email).toBe('old@example.com'); // unchanged
  });

  it('should return 404 for non-existent customer', async () => {
    const res = await request(app)
      .patch('/customers/non-existent-id')
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });
});
