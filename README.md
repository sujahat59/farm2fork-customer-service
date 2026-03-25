# Customer & Subscriptions Service
### Farm2Fork Platform — Delivery Team

---

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm start
```

Service runs on: `http://localhost:3000`

---

## Project Structure

```
src/
├── app.js                  # Express app setup
├── server.js               # Entry point
├── prismaClient.js         # DB connection
├── routes/
│   ├── customerRoutes.js       # /customers
│   └── subscriptionRoutes.js   # /subscriptions
├── controllers/
│   ├── customerController.js
│   ├── subscriptionController.js
│   ├── billingController.js
│   └── loyaltyController.js
└── services/
    ├── customerService.js      # Business logic
    ├── subscriptionService.js
    ├── billingService.js
    └── loyaltyService.js
prisma/
└── schema.prisma           # Database schema
```

---

## API Endpoints

### Endpoints we expose (other teams call us)

| Method | Path | Description |
|--------|------|-------------|
| POST | /customers | Register a new customer |
| GET | /customers/:id | Get customer by ID |
| PATCH | /customers/:id | Update customer profile |
| POST | /customers/:id/subscriptions | Create a subscription |
| GET | /subscriptions/:id | Get subscription + delivery address |
| PATCH | /subscriptions/:id/status | Pause / resume / cancel |
| GET | /customers/:id/billing | Get billing history |
| GET | /customers/:id/loyalty | Get loyalty points and tier |

### Endpoints we call (we depend on)

| Team | Endpoint | Why |
|------|----------|-----|
| Product & Inventory | GET /products/available | Show box contents on signup |
| Order Orchestration | POST /orders | Trigger order on renewal |
| Delivery Execution | GET /deliveries/:id/status | Customer delivery tracking |

---

## Example Requests

### Register a customer
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "phone": "519-555-0100"}'
```

### Create a subscription
```bash
curl -X POST http://localhost:3000/customers/<customerId>/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"planType": "standard", "deliveryFrequency": "weekly"}'
```

### Pause a subscription
```bash
curl -X PATCH http://localhost:3000/subscriptions/<subscriptionId>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'
```

### Get billing history (only paid)
```bash
curl http://localhost:3000/customers/<customerId>/billing?status=paid
```
