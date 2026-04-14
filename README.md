# Customer & Subscriptions Service
### Farm2Fork Platform 

---

## Setup
```bash
npm install
npx prisma migrate dev --name init
npm start
```

Service runs on: `http://localhost:3000`

Run tests:
```bash
npm test
```

---

## API Documentation (Swagger)

Interactive API documentation is available when the server is running:
```
http://localhost:3000/docs
```

All endpoints are documented with request bodies, parameters, and response formats.
You can test any endpoint directly from the browser — no Postman needed.

---

## Authentication

Our service uses JWT (JSON Web Tokens) for authentication.

### How it works
1. Register via `POST /auth/register`
2. Login via `POST /auth/login` — you get a token back
3. Token is valid for 24 hours
4. Pass the token in the `Authorization` header as `Bearer <token>`

### For other teams
To verify a token call `GET /auth/verify` with the token in the header.
You will receive the customer's `id`, `name`, and `email` back.

```json
{
  "valid": true,
  "customer": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

## Project Structure
```
src/
├── app.js                      # Express app setup
├── server.js                   # Entry point
├── prismaClient.js             # DB connection
├── routes/
│   ├── customerRoutes.js           # /customers
│   ├── subscriptionRoutes.js       # /subscriptions
│   ├── billingRoutes.js            # /billing
│   └── authRoutes.js               # /auth
├── controllers/
│   ├── customerController.js
│   ├── subscriptionController.js
│   ├── billingController.js
│   ├── addressController.js
│   ├── loyaltyController.js
│   └── authController.js
└── services/
    ├── customerService.js          # Business logic
    ├── subscriptionService.js      # Renewal flow
    ├── billingService.js           # Billing lifecycle
    ├── addressService.js           # Delivery addresses
    ├── loyaltyService.js           # Points & tiers
    ├── integrationService.js       # Outbound calls to other teams
    └── authService.js              # JWT auth logic
prisma/
└── schema.prisma               # Database schema (5 entities)
tests/
├── customer.test.js
├── subscription.test.js
└── billing-address-loyalty.test.js
```

---

## Domain — Entities We Own

| Entity | Description |
|--------|-------------|
| Customer | Core identity — name, email, phone, password, status |
| Subscription | Farm Box plan — type, frequency, billing date |
| BillingRecord | Payment record per billing cycle |
| DeliveryAddress | Saved addresses per customer |
| LoyaltyAccount | Points balance and tier (bronze/silver/gold) |

**Built-in business rules:**
- Creating a customer automatically creates a LoyaltyAccount
- Creating a subscription automatically creates the first BillingRecord
- Renewing a subscription creates a new BillingRecord and triggers Order Orchestration

---

## API Endpoints

### Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register with name, email, password |
| POST | /auth/login | Login and receive JWT token |
| GET | /auth/verify | Verify a JWT token — for other teams |

### Endpoints we expose (other teams call us)

| Method | Path | Description | Used By |
|--------|------|-------------|---------|
| GET | /customers/:id | Get customer by ID | Order Orchestration |
| PATCH | /customers/:id | Update customer profile | Internal |
| POST | /customers/:id/subscriptions | Create a subscription | Internal |
| GET | /customers/:id/addresses | Get all delivery addresses | Internal |
| POST | /customers/:id/addresses | Add a delivery address | Internal |
| PATCH | /customers/:id/addresses/default | Set default address | Internal |
| GET | /subscriptions/:id | Get subscription + address | Delivery Execution |
| PATCH | /subscriptions/:id/status | Pause / resume / cancel | Internal |
| POST | /subscriptions/:id/renew | Trigger renewal cycle | Internal |
| GET | /customers/:id/billing | Get billing history | Internal |
| PATCH | /billing/:id/status | Mark billing as paid/failed | Internal |
| GET | /customers/:id/loyalty | Get loyalty points and tier | Internal |

### Endpoints we call (we depend on other teams)

| Team | Method | Path | Why |
|------|--------|------|-----|
| Product & Inventory | GET | /products/available | Show box contents on signup |
| Order Orchestration | POST | /orders | Trigger order on subscription renewal |
| Delivery Execution | GET | /deliveries/:id/status | Customer delivery tracking |

---

## Example Requests (PowerShell)

### Register
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body '{"name": "Jane Doe", "email": "jane@example.com", "password": "password123", "phone": "519-555-0100"}'
```

### Login
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"email": "jane@example.com", "password": "password123"}'
```

### Verify token (other teams use this)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/auth/verify" -Method GET -Headers @{Authorization="Bearer YOUR_TOKEN_HERE"}
```

### Add a delivery address
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers/<customerId>/addresses" -Method POST -ContentType "application/json" -Body '{"street": "123 Main St", "city": "Waterloo", "province": "ON", "postalCode": "N2L 3G1"}'
```

### Create a subscription
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers/<customerId>/subscriptions" -Method POST -ContentType "application/json" -Body '{"planType": "standard", "deliveryFrequency": "weekly", "addressId": "<addressId>"}'
```

### Pause a subscription
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/subscriptions/<subscriptionId>/status" -Method PATCH -ContentType "application/json" -Body '{"status": "paused"}'
```

### Trigger subscription renewal
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/subscriptions/<subscriptionId>/renew" -Method POST
```

### Mark billing as paid
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/billing/<billingId>/status" -Method PATCH -ContentType "application/json" -Body '{"status": "paid"}'
```

### Get billing history (only paid)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers/<customerId>/billing?status=paid" -Method GET
```

### Get loyalty account
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers/<customerId>/loyalty" -Method GET
```

---

## Integration Notes

Our service runs on `http://localhost:3000` by default.

The port can be changed by setting the `PORT` environment variable in `.env`.

We are ready to coordinate base URLs and request/response formats with:
- Order Orchestration team
- Delivery Execution team

Please reach out so we can align on contracts!

---

## Test Results
```
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
```
