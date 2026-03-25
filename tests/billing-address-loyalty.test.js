const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prismaClient');

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

// ── Address Tests ─────────────────────────────────────────────

describe('POST /customers/:id/addresses', () => {
  it('should create an address and auto-set as default if first', async () => {
    const customer = await createCustomer();

    const res = await request(app)
      .post(`/customers/${customer.id}/addresses`)
      .send({ street: '123 Main St', city: 'Waterloo', province: 'ON', postalCode: 'N2L 3G1' });

    expect(res.status).toBe(201);
    expect(res.body.street).toBe('123 Main St');
    expect(res.body.isDefault).toBe(true);
  });

  it('should return 400 if required fields are missing', async () => {
    const customer = await createCustomer();

    const res = await request(app)
      .post(`/customers/${customer.id}/addresses`)
      .send({ street: '123 Main St' }); // missing city, province, postalCode

    expect(res.status).toBe(400);
  });
});

describe('GET /customers/:id/addresses', () => {
  it('should return all addresses for a customer', async () => {
    const customer = await createCustomer();

    await request(app)
      .post(`/customers/${customer.id}/addresses`)
      .send({ street: '123 Main St', city: 'Waterloo', province: 'ON', postalCode: 'N2L 3G1' });

    await request(app)
      .post(`/customers/${customer.id}/addresses`)
      .send({ street: '456 King St', city: 'Kitchener', province: 'ON', postalCode: 'N2G 2M4' });

    const res = await request(app).get(`/customers/${customer.id}/addresses`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    // Default address should come first
    expect(res.body[0].isDefault).toBe(true);
  });
});

// ── Billing Tests ─────────────────────────────────────────────

describe('GET /customers/:id/billing', () => {
  it('should return billing history', async () => {
    const customer = await createCustomer();

    await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    const res = await request(app).get(`/customers/${customer.id}/billing`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].amount).toBe(49.99);
    expect(res.body[0].status).toBe('pending');
  });

  it('should filter billing by status', async () => {
    const customer = await createCustomer();

    await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    // Filter for paid — should be empty since we just created a pending one
    const res = await request(app).get(`/customers/${customer.id}/billing?status=paid`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });
});

describe('PATCH /billing/:id/status', () => {
  it('should mark a billing record as paid and set paidAt', async () => {
    const customer = await createCustomer();

    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'standard', deliveryFrequency: 'weekly' });

    const billingId = subRes.body.billingRecords[0].id;

    const res = await request(app)
      .patch(`/billing/${billingId}/status`)
      .send({ status: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.paidAt).toBeDefined();
    expect(res.body.invoiceRef).toBeDefined();
  });

  it('should mark a billing record as failed', async () => {
    const customer = await createCustomer();

    const subRes = await request(app)
      .post(`/customers/${customer.id}/subscriptions`)
      .send({ planType: 'basic', deliveryFrequency: 'weekly' });

    const billingId = subRes.body.billingRecords[0].id;

    const res = await request(app)
      .patch(`/billing/${billingId}/status`)
      .send({ status: 'failed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('failed');
  });
});

// ── Loyalty Tests ─────────────────────────────────────────────

describe('GET /customers/:id/loyalty', () => {
  it('should return loyalty account with bronze tier by default', async () => {
    const customer = await createCustomer();

    const res = await request(app).get(`/customers/${customer.id}/loyalty`);

    expect(res.status).toBe(200);
    expect(res.body.pointsBalance).toBe(0);
    expect(res.body.tier).toBe('bronze');
  });

  it('should return 404 for non-existent customer loyalty', async () => {
    const res = await request(app).get('/customers/non-existent-id/loyalty');
    expect(res.status).toBe(404);
  });
});

// ── Health Check ──────────────────────────────────────────────

describe('GET /health', () => {
  it('should return service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('customer-subscriptions');
  });
});
