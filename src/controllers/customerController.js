const customerService = require('../services/customerService');

// POST /customers
async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const customer = await customerService.createCustomer({ name, email, phone, address });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

// GET /customers/:id
async function getCustomer(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
}

// PATCH /customers/:id
async function updateCustomer(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await customerService.updateCustomer(req.params.id, { name, email, phone, address });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
}

module.exports = { createCustomer, getCustomer, updateCustomer };
