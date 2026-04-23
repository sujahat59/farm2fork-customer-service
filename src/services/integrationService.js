const https = require('https');
const http = require('http');

const SERVICES = {
  productInventory:   process.env.PRODUCT_INVENTORY_URL   || 'http://localhost:3001',
  orderOrchestration: process.env.ORDER_ORCHESTRATION_URL || 'https://forgotten-thats-fill-chairman.trycloudflare.com',
  deliveryExecution:  process.env.DELIVERY_EXECUTION_URL  || 'http://localhost:3003',
};

async function get(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function post(url, body) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = lib.request(options, (res) => {
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

async function getAvailableProducts() {
  try {
    return await get(`${SERVICES.productInventory}/products/available`);
  } catch (err) {
    console.error('[Integration] Product & Inventory unreachable:', err.message);
    return { error: 'Product & Inventory service unavailable', products: [] };
  }
}

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

async function getDeliveryStatus(orderId) {
  try {
    return await get(`${SERVICES.deliveryExecution}/api/delivery-status/${orderId}`);
  } catch (err) {
    console.error('[Integration] Delivery Execution unreachable:', err.message);
    return { error: 'Delivery Execution service unavailable', status: 'unknown' };
  }
}

module.exports = { getAvailableProducts, createOrder, getDeliveryStatus };