const http = require('http');

// Base URLs for other team services
// These will be updated once other teams confirm their ports
const SERVICES = {
  productInventory:   process.env.PRODUCT_INVENTORY_URL   || 'http://localhost:3001',
  orderOrchestration: process.env.ORDER_ORCHESTRATION_URL || 'http://localhost:3002',
  deliveryExecution:  process.env.DELIVERY_EXECUTION_URL  || 'http://localhost:3003',
};

// Generic HTTP GET helper
async function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

// Generic HTTP POST helper
async function post(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const [base, path] = url.split(/(?=\/[^/])/);
    const urlObj = new URL(url);
    const req = http.request({ hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Calls to Product & Inventory ─────────────────────────────
// Fetch what's available in the Farm Box this week
async function getAvailableProducts() {
  try {
    return await get(`${SERVICES.productInventory}/products/available`);
  } catch (err) {
    console.error('[Integration] Product & Inventory unreachable:', err.message);
    return { error: 'Product & Inventory service unavailable', products: [] };
  }
}

// ── Calls to Order Orchestration ─────────────────────────────
// Trigger a new order when a subscription renews
async function createOrder({ customerId, subscriptionId, deliveryAddressId }) {
  try {
    return await post(`${SERVICES.orderOrchestration}/orders`, {
      customerId,
      subscriptionId,
      deliveryAddressId,
    });
  } catch (err) {
    console.error('[Integration] Order Orchestration unreachable:', err.message);
    return { error: 'Order Orchestration service unavailable' };
  }
}

// ── Calls to Delivery Execution ──────────────────────────────
// Get delivery status for a given order
async function getDeliveryStatus(orderId) {
  try {
    return await get(`${SERVICES.deliveryExecution}/deliveries/${orderId}/status`);
  } catch (err) {
    console.error('[Integration] Delivery Execution unreachable:', err.message);
    return { error: 'Delivery Execution service unavailable', status: 'unknown' };
  }
}

module.exports = { getAvailableProducts, createOrder, getDeliveryStatus };
