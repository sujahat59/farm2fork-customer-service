const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer & Subscriptions API',
      version: '2.0.0',
      description: 'Farm2Fork Platform — Customer & Subscriptions Delivery Team',
    },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [
      { name: 'Auth', description: 'Authentication and JWT token management' },
      { name: 'Users', description: 'User management' },
      { name: 'Subscriptions', description: 'Subscription lifecycle' },
      { name: 'Addresses', description: 'Delivery address management' },
      { name: 'Billing', description: 'Billing records and status' },
      { name: 'Loyalty', description: 'Loyalty points and tiers' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {}
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Register a new user',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','email','password'], properties: { name: { type: 'string', example: 'Jane Doe' }, email: { type: 'string', example: 'jane@example.com' }, password: { type: 'string', example: 'password123' }, phone: { type: 'string', example: '519-555-0100' } } } } } },
          responses: { 201: { description: 'Registered successfully' }, 409: { description: 'Email already registered' } }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Login and get JWT token',
          description: 'Returns token with id, name, email, phone, role and default address. If driver, redirectUrl is included.',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string', example: 'jane@example.com' }, password: { type: 'string', example: 'password123' } } } } } },
          responses: { 200: { description: 'Login successful — returns JWT token, role, and redirectUrl if driver' }, 401: { description: 'Invalid credentials' } }
        }
      },
      '/auth/verify': {
        get: {
          tags: ['Auth'], summary: 'Verify a JWT token',
          description: 'Other teams call this to verify a token and get user info',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Token valid — returns user info' }, 401: { description: 'Invalid or expired' } }
        }
      },
      '/auth/import-drivers': {
        post: {
          tags: ['Auth'], summary: 'Import drivers from CSV file',
          description: 'Upload a CSV with columns: name, email, password, phone',
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Import complete — returns success/failed counts' } }
        }
      },
      '/customers/{id}': {
        get: { tags: ['Users'], summary: 'Get user by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User object' }, 404: { description: 'Not found' } } },
        patch: { tags: ['Users'], summary: 'Update user profile', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } },
        delete: { tags: ['Users'], summary: 'Delete account', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } } }
      },
      '/customers/{id}/subscriptions': {
        post: {
          tags: ['Subscriptions'], summary: 'Create a subscription',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['planType'], properties: { planType: { type: 'string', example: 'standard' }, boxType: { type: 'string', enum: ['fruit','veggie','meat'], example: 'fruit' }, planDuration: { type: 'string', enum: ['weekly','monthly','yearly'], example: 'weekly' }, addressId: { type: 'string' } } } } } },
          responses: { 201: { description: 'Subscription created with first BillingRecord' } }
        }
      },
      '/customers/{id}/subscription-history': {
        get: { tags: ['Subscriptions'], summary: 'Get all subscriptions history', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'List of all subscriptions' } } }
      },
      '/subscriptions/{id}': {
        get: { tags: ['Subscriptions'], summary: 'Get subscription by ID — used by Delivery Execution', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Subscription with user and address' }, 404: { description: 'Not found' } } }
      },
      '/subscriptions/{id}/status': {
        patch: { tags: ['Subscriptions'], summary: 'Update subscription status', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['active','paused','cancelled'] } } } } } }, responses: { 200: { description: 'Status updated' } } }
      },
      '/subscriptions/{id}/renew': {
        post: { tags: ['Subscriptions'], summary: 'Trigger renewal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Renewed — new billing record created' } } }
      },
      '/customers/{id}/addresses': {
        post: { tags: ['Addresses'], summary: 'Add address', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['street','city','province','postalCode'], properties: { street: { type: 'string', example: '123 Main St' }, city: { type: 'string', example: 'Waterloo' }, province: { type: 'string', example: 'ON' }, postalCode: { type: 'string', example: 'N2L 3G1' }, isDefault: { type: 'boolean' } } } } } }, responses: { 201: { description: 'Address created' }, 400: { description: 'Invalid postal code or province' } } },
        get: { tags: ['Addresses'], summary: 'Get all addresses', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'List of addresses' } } }
      },
      '/customers/{id}/addresses/default': {
        patch: { tags: ['Addresses'], summary: 'Set default address', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { addressId: { type: 'string' } } } } } }, responses: { 200: { description: 'Default updated' } } }
      },
      '/addresses/{id}': {
        patch: { tags: ['Addresses'], summary: 'Update address fields', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { street: { type: 'string' }, city: { type: 'string' }, province: { type: 'string' }, postalCode: { type: 'string' } } } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } },
        delete: { tags: ['Addresses'], summary: 'Delete address', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' }, 404: { description: 'Not found' } } }
      },
      '/customers/{id}/billing': {
        get: { tags: ['Billing'], summary: 'Get billing history', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending','paid','failed'] } }], responses: { 200: { description: 'List of billing records' } } }
      },
      '/customers/{id}/billing/total': {
        get: { tags: ['Billing'], summary: 'Get total amount spent', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Total spent and payment count' } } }
      },
      '/billing/{id}/status': {
        patch: { tags: ['Billing'], summary: 'Update billing status — triggers loyalty points if paid', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['pending','paid','failed'] } } } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } }
      },
      '/billing/manifest': {
        post: { tags: ['Billing'], summary: 'Receive billing manifest from Order Orchestration', description: 'OO sends order details, we confirm payment passed or failed', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['subscriptionId','orderId'], properties: { subscriptionId: { type: 'string' }, orderId: { type: 'string' }, amount: { type: 'number' } } } } } }, responses: { 200: { description: 'Returns success: true/false' } } }
      },
      '/customers/{id}/loyalty': {
        get: { tags: ['Loyalty'], summary: 'Get loyalty account with recent history', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Loyalty account with points, tier, and history' }, 404: { description: 'Not found' } } }
      },
      '/customers/{id}/loyalty/history': {
        get: { tags: ['Loyalty'], summary: 'Get full points history', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'All points history entries' } } }
      },
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/customers',     require('./routes/customerRoutes'));
app.use('/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/billing',       require('./routes/billingRoutes'));
app.use('/addresses',     require('./routes/addressRoutes'));
app.use('/auth',          require('./routes/authRoutes'));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-subscriptions', version: '2.0.0' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
