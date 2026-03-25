const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prismaClient');

// Helper to create a customer quickly
async function createCustomer(email = 'test@example.com') {
  const res = await request(app)
    .post('/customers')
    .send({ name: 'Test User', email });
  return res.body;
}

beforeEach(async () => {
  await prisma.billingRecord.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.customer.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Subscription Tests ────────────────────────────────────────

describe('POST /customers/:id/subscriptions', () => {
  it('should create a subscription and auto-create first billing record', async () => {
    const customer = await createCustomer();

    const res = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    expect(res.status).toBe(201);
    expect(res.body.planType).toBe('standard');
    expect(res.body.status).toBe('active');
    expect(res.body.deliveryFrequency).toBe('weekly');

    // Auto-created billing record
    expect(res.body.billingRecords).toBeDefined();
    expect(res.body.billingRecords.length).toBe(1);
    expect(res.body.billingRecords[0].amount).toBe(49.99);
    expect(res.body.billingRecords[0].status).toBe('pending');
  });

  it('should return 400 if planType is missing', async () => {
    const customer = await createCustomer();

    const res = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ deliveryFrequency: 'weekly' });

    expect(res.status).toBe(400);
  });

  it('should link subscription to a delivery address', async () => {
    const customer = await createCustomer();

    // Create address first
    const addressRes = await request(app)
      .post(`/customers/${customer.id}/addresses`)
      .send({ street: '123 Main St', city: 'Waterloo', province: 'ON', postalCode: 'N2L 3G1' });

    const res = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'basic', deliveryFrequency: 'weekly', addressId: addressRes.body.id });

    expect(res.status).toBe(201);
    expect(res.body.addressId).toBe(addressRes.body.id);
  });
});

describe('GET /subscriptions/:id', () => {
  it('should return subscription with customer and address — used by Delivery Execution', async () => {
    const customer = await createCustomer();

    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'premium', deliveryFrequency: 'weekly' });

    const res = await request(app).get(`/subscriptions/${subRes.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.customer).toBeDefined();
    expect(res.body.customer.id).toBe(customer.id);
  });

  it('should return 404 for non-existent subscription', async () => {
    const res = await request(app).get('/subscriptions/non-existent-id');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /subscriptions/:id/status', () => {
  it('should pause a subscription', async () => {
    const customer = await createCustomer();
    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    const res = await request(app)
      .patch(`/subscriptions/${subRes.body.id}/status`)
      .send({ status: 'paused' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paused');
  });

  it('should cancel a subscription', async () => {
    const customer = await createCustomer();
    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    const res = await request(app)
      .patch(`/subscriptions/${subRes.body.id}/status`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('should reject invalid status', async () => {
    const customer = await createCustomer();
    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    const res = await request(app)
      .patch(`/subscriptions/${subRes.body.id}/status`)
      .send({ status: 'deleted' }); // invalid

    expect(res.status).toBe(400);
  });
});
