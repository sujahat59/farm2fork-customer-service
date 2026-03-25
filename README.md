# Customer & Subscriptions Service
### Farm2Fork Platform — Delivery Team

---

## Setup
```bash
npm install
npx prisma migrate dev --name init
npm start
```

## API Documentation (Swagger)

Interactive API documentation is available when the server is running:
```
http://localhost:3000/docs
```

All endpoints are documented with request bodies, parameters, and response formats.
You can test any endpoint directly from the browser — no Postman needed.

Run tests:
```bash
npm test
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
│   └── billingRoutes.js            # /billing
├── controllers/
│   ├── customerController.js
│   ├── subscriptionController.js
│   ├── billingController.js
│   ├── addressController.js
│   └── loyaltyController.js
└── services/
    ├── customerService.js          # Business logic
    ├── subscriptionService.js      # Renewal flow
    ├── billingService.js           # Billing lifecycle
    ├── addressService.js           # Delivery addresses
    ├── loyaltyService.js           # Points & tiers
    └── integrationService.js       # Outbound calls to other teams
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
| Customer | Core identity — name, email, phone, status |
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

### Endpoints we expose (other teams call us)

| Method | Path | Description | Used By |
|--------|------|-------------|---------|
| POST | /customers | Register a new customer | Internal |
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

### Register a customer
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers" -Method POST -ContentType "application/json" -Body '{"name": "Jane Doe", "email": "jane@example.com", "phone": "519-555-0100"}'
```

### Add a delivery address
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers//addresses" -Method POST -ContentType "application/json" -Body '{"street": "123 Main St", "city": "Waterloo", "province": "ON", "postalCode": "N2L 3G1"}'
```

### Create a subscription
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers//subscriptions" -Method POST -ContentType "application/json" -Body '{"planType": "standard", "deliveryFrequency": "weekly", "addressId": ""}'
```

### Pause a subscription
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/subscriptions//status" -Method PATCH -ContentType "application/json" -Body '{"status": "paused"}'
```

### Trigger subscription renewal
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/subscriptions//renew" -Method POST
```

### Mark billing as paid
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/billing//status" -Method PATCH -ContentType "application/json" -Body '{"status": "paid"}'
```

### Get billing history (only paid)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers//billing?status=paid" -Method GET
```

### Get loyalty account
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/customers//loyalty" -Method GET
```

---

## Integration Notes

Our service runs on `http://localhost:3000` by default.

The port can be changed by setting the `PORT` environment variable in `.env`.

We are ready to coordinate base URLs and request/response formats with:
- Order Orchestration team
- Delivery Execution team  
- Product & Inventory team

Please reach out so we can align on contracts!

---

## Test Results
```
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
```