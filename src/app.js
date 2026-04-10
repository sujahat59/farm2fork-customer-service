const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

app.use(express.json());

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
      { name: 'Auth', description: 'Authentication and JWT token management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Subscriptions', description: 'Subscription lifecycle' },
      { name: 'Addresses', description: 'Delivery address management' },
      { name: 'Billing', description: 'Billing records and status' },
      { name: 'Loyalty', description: 'Loyalty points and tiers' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
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
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new customer',
          description: 'Creates a customer account with hashed password and auto-creates a LoyaltyAccount',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name:     { type: 'string', example: 'Jane Doe' },
                    email:    { type: 'string', example: 'jane@example.com' },
                    password: { type: 'string', example: 'password123' },
                    phone:    { type: 'string', example: '519-555-0100' },
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Registered successfully' },
            400: { description: 'Missing required fields' },
            409: { description: 'Email already registered' },
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get JWT token',
          description: 'Returns a JWT token valid for 24 hours. Other teams use this token to authenticate requests.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email:    { type: 'string', example: 'jane@example.com' },
                    password: { type: 'string', example: 'password123' },
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login successful — returns JWT token and customer info' },
            400: { description: 'Missing email or password' },
            401: { description: 'Invalid credentials' },
          }
        }
      },
      '/auth/verify': {
        get: {
          tags: ['Auth'],
          summary: 'Verify a JWT token',
          description: 'Other teams (Order Orchestration, Delivery Execution) call this to verify a token is valid and get customer info',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Token is valid — returns decoded customer info' },
            400: { description: 'No token provided' },
            401: { description: 'Token is invalid or expired' },
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

app.use('/customers',     require('./routes/customerRoutes'));
app.use('/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/billing',       require('./routes/billingRoutes'));
app.use('/auth',          require('./routes/authRoutes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-subscriptions' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;