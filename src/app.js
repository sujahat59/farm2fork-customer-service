const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

app.use(express.json());

// ── Swagger setup ────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer & Subscriptions API',
      version: '1.0.0',
      description: 'Farm2Fork Platform — Customer & Subscriptions Delivery Team',
    },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [
      { name: 'Customers', description: 'Customer management' },
      { name: 'Subscriptions', description: 'Subscription lifecycle' },
      { name: 'Addresses', description: 'Delivery address management' },
      { name: 'Billing', description: 'Billing records and status' },
      { name: 'Loyalty', description: 'Loyalty points and tiers' },
    ],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: 'uuid-here' },
            name:      { type: 'string', example: 'Jane Doe' },
            email:     { type: 'string', example: 'jane@example.com' },
            phone:     { type: 'string', example: '519-555-0100' },
            status:    { type: 'string', example: 'active' },
            createdAt: { type: 'string', example: '2026-03-25T00:00:00.000Z' },
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id:                { type: 'string' },
            customerId:        { type: 'string' },
            addressId:         { type: 'string' },
            planType:          { type: 'string', example: 'standard' },
            status:            { type: 'string', example: 'active' },
            deliveryFrequency: { type: 'string', example: 'weekly' },
            nextBillingDate:   { type: 'string' },
          }
        },
        BillingRecord: {
          type: 'object',
          properties: {
            id:             { type: 'string' },
            customerId:     { type: 'string' },
            subscriptionId: { type: 'string' },
            amount:         { type: 'number', example: 49.99 },
            status:         { type: 'string', example: 'pending' },
            paidAt:         { type: 'string' },
            invoiceRef:     { type: 'string' },
          }
        },
        DeliveryAddress: {
          type: 'object',
          properties: {
            id:         { type: 'string' },
            customerId: { type: 'string' },
            street:     { type: 'string', example: '123 Main St' },
            city:       { type: 'string', example: 'Waterloo' },
            province:   { type: 'string', example: 'ON' },
            postalCode: { type: 'string', example: 'N2L 3G1' },
            isDefault:  { type: 'boolean', example: true },
          }
        },
        LoyaltyAccount: {
          type: 'object',
          properties: {
            id:            { type: 'string' },
            customerId:    { type: 'string' },
            pointsBalance: { type: 'integer', example: 0 },
            tier:          { type: 'string', example: 'bronze' },
            lastUpdated:   { type: 'string' },
          }
        },
      }
    },
    paths: {
      '/customers': {
        post: {
          tags: ['Customers'],
          summary: 'Register a new customer',
          description: 'Creates a customer and automatically creates a LoyaltyAccount',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name:  { type: 'string', example: 'Jane Doe' },
                    email: { type: 'string', example: 'jane@example.com' },
                    phone: { type: 'string', example: '519-555-0100' },
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Customer created with LoyaltyAccount' },
            400: { description: 'Missing required fields' },
          }
        }
      },
      '/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by ID',
          description: 'Used by Order Orchestration to validate a customer before placing an order',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Customer object with active subscriptions' },
            404: { description: 'Customer not found' },
          }
        },
        patch: {
          tags: ['Customers'],
          summary: 'Update customer profile',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name:  { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Updated customer' },
            404: { description: 'Customer not found' },
          }
        }
      },
      '/customers/{id}/subscriptions': {
        post: {
          tags: ['Subscriptions'],
          summary: 'Create a subscription',
          description: 'Automatically creates the first BillingRecord on creation',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['planType'],
                  properties: {
                    planType:          { type: 'string', example: 'standard', enum: ['basic', 'standard', 'premium'] },
                    deliveryFrequency: { type: 'string', example: 'weekly', enum: ['weekly', 'biweekly'] },
                    addressId:         { type: 'string', example: 'uuid-here' },
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Subscription created with first BillingRecord' },
            400: { description: 'Missing planType' },
          }
        }
      },
      '/subscriptions/{id}': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Get subscription by ID',
          description: 'Used by Delivery Execution to get delivery address for routing',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Subscription with customer and delivery address' },
            404: { description: 'Subscription not found' },
          }
        }
      },
      '/subscriptions/{id}/status': {
        patch: {
          tags: ['Subscriptions'],
          summary: 'Update subscription status',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['active', 'paused', 'cancelled'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Status updated' },
            400: { description: 'Invalid status' },
            404: { description: 'Subscription not found' },
          }
        }
      },
      '/subscriptions/{id}/renew': {
        post: {
          tags: ['Subscriptions'],
          summary: 'Trigger subscription renewal',
          description: 'Creates a new BillingRecord and triggers Order Orchestration',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Renewal triggered — new billing record created and order sent' },
            404: { description: 'Subscription not found' },
          }
        }
      },
      '/customers/{id}/addresses': {
        post: {
          tags: ['Addresses'],
          summary: 'Add a delivery address',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['street', 'city', 'province', 'postalCode'],
                  properties: {
                    street:     { type: 'string', example: '123 Main St' },
                    city:       { type: 'string', example: 'Waterloo' },
                    province:   { type: 'string', example: 'ON' },
                    postalCode: { type: 'string', example: 'N2L 3G1' },
                    isDefault:  { type: 'boolean', example: true },
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Address created' },
            400: { description: 'Missing required fields' },
          }
        },
        get: {
          tags: ['Addresses'],
          summary: 'Get all addresses for a customer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'List of addresses' } }
        }
      },
      '/customers/{id}/addresses/default': {
        patch: {
          tags: ['Addresses'],
          summary: 'Set default delivery address',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { addressId: { type: 'string' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Default address updated' } }
        }
      },
      '/customers/{id}/billing': {
        get: {
          tags: ['Billing'],
          summary: 'Get billing history',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'paid', 'failed'] } }
          ],
          responses: { 200: { description: 'List of billing records' } }
        }
      },
      '/billing/{id}/status': {
        patch: {
          tags: ['Billing'],
          summary: 'Update billing record status',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', enum: ['pending', 'paid', 'failed'] } }
                }
              }
            }
          },
          responses: {
            200: { description: 'Billing status updated' },
            404: { description: 'Billing record not found' },
          }
        }
      },
      '/customers/{id}/loyalty': {
        get: {
          tags: ['Loyalty'],
          summary: 'Get loyalty account',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Loyalty account with points and tier' },
            404: { description: 'Not found' },
          }
        }
      },
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────
app.use('/customers',     require('./routes/customerRoutes'));
app.use('/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/billing',       require('./routes/billingRoutes'));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-subscriptions' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;