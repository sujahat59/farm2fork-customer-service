const addressService = require('../services/addressService');

// POST /customers/:id/addresses
async function createAddress(req, res, next) {
  try {
    const { street, city, province, postalCode, isDefault } = req.body;

    if (!street || !city || !province || !postalCode) {
      return res.status(400).json({ error: 'street, city, province and postalCode are required' });
    }

    const address = await addressService.createAddress({
      customerId: req.params.id,
      street,
      city,
      province,
      postalCode,
      isDefault: isDefault || false,
    });

    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
}

// GET /customers/:id/addresses
async function getAddresses(req, res, next) {
  try {
    const addresses = await addressService.getAddresses(req.params.id);
    res.json(addresses);
  } catch (err) {
    next(err);
  }
}

// PATCH /addresses/:id
async function updateAddress(req, res, next) {
  try {
    const { street, city, province, postalCode, isDefault } = req.body;
    const address = await addressService.updateAddress(req.params.id, {
      street, city, province, postalCode, isDefault
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(address);
  } catch (err) {
    next(err);
  }
}

// PATCH /customers/:id/addresses/default
async function setDefaultAddress(req, res, next) {
  try {
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ error: 'addressId is required' });
    }

    const address = await addressService.setDefault(req.params.id, addressId);
    res.json(address);
  } catch (err) {
    next(err);
  }
}

module.exports = { createAddress, getAddresses, updateAddress, setDefaultAddress };
