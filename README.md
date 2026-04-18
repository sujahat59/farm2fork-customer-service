# Customer & Subscriptions Service
### Farm2Fork Platform 

---

## Overview

The Customer & Subscriptions service is the **authentication hub** for the entire Farm2Fork platform. We own customer accounts, subscription lifecycle, billing, loyalty rewards, and delivery addresses. Every team that needs to identify a customer calls our auth endpoints.

---

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
npm start
```

Service runs on: `http://localhost:3000`

```bash
npm test
```

---

## API Documentation

Interactive Swagger documentation is available at:

```
http://localhost:3000/docs
```

All endpoints are fully documented with request bodies, parameters, and response formats. No Postman required — test directly from the browser.

---

## Authentication

We generate and verify all JWT tokens for the platform. No other team needs to build their own auth system.

### Token Flow

1. Customer registers via `POST /auth/register`
2. Customer logs in via `POST /auth/login` — receives a JWT token
3. Token is valid for **24 hours**
4. Token payload contains: `id`, `name`, `email`, `phone`, `role`, and default `address`
5. All protected requests pass the token as: `Authorization: Bearer <token>`

### Token Payload

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "519-555-0100",
  "role": "customer",
  "address": {
    "street": "123 Main St",
    "city": "Waterloo",
    "province": "ON",
    "postalCode": "N2L 3G1"
  }
}
```

### For Other Teams

Other teams do **not** call our login endpoint. The customer logs in through our frontend, receives a token, and carries it to other services. To verify a token:

```
GET /auth/verify
Authorization: Bearer <token>
```

Response:

```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "519-555-0100",
    "role": "customer",
    "address": { ... }
  }
}
```

---

## Project Structure

```
src/
├── app.js                       # Express app + Swagger setup
├── server.js                    # Entry point
├── prismaClient.js              # Database connection
├── routes/
│   ├── authRoutes.js            # /auth
│   ├── customerRoutes.js        # /customers
│   ├── subscriptionRoutes.js    # /subscriptions
│   ├── billingRoutes.js         # /billing
│   └── addressRoutes.js         # /addresses
├── controllers/
│   ├── authController.js
│   ├── customerController.js
│   ├── subscriptionController.js
│   ├── billingController.js
│   ├── addressController.js
│   └── loyaltyController.js
└── services/
    ├── authService.js           # JWT generation, driver import
    ├── customerService.js       # Customer CRUD
    ├── subscriptionService.js   # Subscription lifecycle + pricing
    ├── billingService.js        # Billing records + manifest
    ├── addressService.js        # Address management + validation
    ├── loyaltyService.js        # Points, tiers, history
    └── integrationService.js    # Outbound calls to other teams
prisma/
└── schema.prisma                # Database schema — 6 entities
public/
├── login.html
├── register.html
├── customer.html
├── subscription.html
├── billing.html
├── loyalty.html
├── account.html
├── driver.html
├── css/
└── js/
tests/
├── customer.test.js
├── subscription.test.js
└── billing-address-loyalty.test.js
```

---

## Domain — Entities We Own

| Entity | Description |
|--------|-------------|
| User | Customer or driver account — name, email, phone, password, role |
| Subscription | Farm Box plan — box type, duration, billing date, status |
| BillingRecord | Payment record per billing cycle — amount, status, invoice ref |
| DeliveryAddress | Saved addresses per user — with default address support |
| LoyaltyAccount | Points balance and tier — bronze / silver / gold |
| LoyaltyHistory | Full history of points earned with reasons |

### Subscription Box Types

| Box | Weekly | Monthly | Yearly |
|-----|--------|---------|--------|
| Fruit Box | $29.99 | $109.99 | $1,199.99 |
| Veggie Box | $27.99 | $99.99 | $1,099.99 |
| Meat Box | $49.99 | $179.99 | $1,999.99 |

Box contents are seasonal and randomized — customers select a box type, not specific items.

### Built-in Business Rules

- Registering a user automatically creates a LoyaltyAccount at Bronze tier (0 points)
- Creating a subscription automatically generates the first BillingRecord (pending)
- Marking a billing record as paid automatically awards loyalty points (1 pt per $1 spent)
- Loyalty tier upgrades automatically: Bronze 0–499 pts → Silver 500–999 pts → Gold 1000+ pts
- Cancelling a subscription marks all pending billing records as failed

---

## API Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register a new user — creates account and loyalty account |
| POST | /auth/login | Login — returns JWT token with full user info |
| GET | /auth/verify | Verify a JWT token — used by all other teams |
| POST | /auth/import-drivers | Import driver accounts from a CSV file |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | /customers/:id | Get user profile with active subscriptions |
| PATCH | /customers/:id | Update user profile |
| DELETE | /customers/:id | Delete account |

### Subscriptions

| Method | Path | Description |
|--------|------|-------------|
| POST | /customers/:id/subscriptions | Create a subscription — auto-creates first billing record |
| GET | /customers/:id/subscription-history | Full subscription history |
| GET | /subscriptions/:id | Get subscription with address — used by Delivery Execution |
| PATCH | /subscriptions/:id/status | Update status: active / paused / cancelled |
| POST | /subscriptions/:id/renew | Trigger renewal — creates new billing record |

### Billing

| Method | Path | Description |
|--------|------|-------------|
| GET | /customers/:id/billing | Billing history — filterable by status |
| GET | /customers/:id/billing/total | Total amount spent and payment count |
| PATCH | /billing/:id/status | Update billing status — triggers loyalty points on paid |
| POST | /billing/manifest | Receive and process billing confirmation from Order Orchestration |

### Billing Manifest — Request Body

`POST /billing/manifest` accepts the following:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | ✅ | The order ID from Order Orchestration |
| amount | number | ✅ | Payment amount |
| customerId | string | one of | Required for one-time purchases |
| subscriptionId | string | one of | Required for subscription payments |

### Addresses

| Method | Path | Description |
|--------|------|-------------|
| POST | /customers/:id/addresses | Add a delivery address |
| GET | /customers/:id/addresses | List all addresses |
| PATCH | /customers/:id/addresses/default | Set a default address |
| PATCH | /addresses/:id | Update address fields |
| DELETE | /addresses/:id | Delete an address |

### Loyalty

| Method | Path | Description |
|--------|------|-------------|
| GET | /customers/:id/loyalty | Get points balance, tier, and recent history |
| GET | /customers/:id/loyalty/history | Full points history |

---

## Cross-Team Integration

### What other teams call from us

| Team | Endpoint | Purpose |
|------|----------|---------|
| Order Orchestration | GET /auth/verify | Validate customer token |
| Order Orchestration | GET /customers/:id | Get customer profile |
| Order Orchestration | POST /billing/manifest | Send payment confirmation for us to record |
| Delivery Execution | GET /auth/verify | Validate customer or driver token |
| Delivery Execution | GET /subscriptions/:id | Get subscription and delivery address for routing |

### What we call from other teams

| Team | Endpoint | Purpose | Status |
|------|----------|---------|--------|
| Order Orchestration | GET /has | Check box availability before confirming subscription | ⏳ Waiting on OO URL |
| Order Orchestration | POST /orders | Trigger physical order on subscription renewal | ⏳ Waiting on OO URL |
| Delivery Execution | GET /api/v1/orders/:id/status | Get delivery status to show customer | ⏳ Waiting on DE URL |

### Driver Login Flow

Drivers log in through our login page. After successful authentication, we detect the `driver` role and redirect to the Delivery Execution dashboard with the token in the URL:

```
http://<delivery-team-url>/dashboard?token=<JWT_TOKEN>
```

> ⏳ Waiting on Delivery Execution team to confirm their redirect URL.

### Driver Import

Delivery Execution sends us a CSV file with driver accounts. We import them via:

```
POST /auth/import-drivers
Content-Type: multipart/form-data
Field: file (CSV)
```

Required CSV columns: `name`, `email`, `password`, `phone` (optional)

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET=your-secret-key-here
DELIVERY_REDIRECT_URL=http://localhost:4000/driver/dashboard
DELIVERY_EXECUTION_URL=http://localhost:3003
ORDER_ORCHESTRATION_URL=http://localhost:3002
```

---

## Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Login | /login.html | JWT login with animated farmer character |
| Register | /register.html | New account registration |
| Dashboard | /customer.html | Account overview with key stats |
| Subscription | /subscription.html | Browse and manage Farm Box plans |
| Billing | /billing.html | Payment history and invoice records |
| Loyalty | /loyalty.html | Points balance, tier progress, rewards |
| Account | /account.html | Profile settings and delivery addresses |
| Driver Portal | /driver.html | Driver redirect handler |

---

## Deployment

The service is deployed and live on the test server:

```
Base URL: http://159.203.16.186:3000
Swagger:  http://159.203.16.186:3000/docs
```

CI/CD is configured via GitHub webhook — every push to `main` automatically deploys to the test server.

---

## Test Results

```
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
```