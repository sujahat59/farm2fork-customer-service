const addressService = require('../services/addressService');

async function createAddress(req, res, next) {
  try {
    const { street, city, province, postalCode, isDefault } = req.body;
    if (!street || !city || !province || !postalCode) {
      return res.status(400).json({ error: 'street, city, province and postalCode are required' });
    }
    const address = await addressService.createAddress({
      userId: req.params.id, street, city, province, postalCode, isDefault: isDefault || false
    });
    res.status(201).json(address);
  } catch (err) {
    if (err.message.includes('Invalid')) return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function getAddresses(req, res, next) {
  try {
    const addresses = await addressService.getAddresses(req.params.id);
    res.json(addresses);
  } catch (err) { next(err); }
}

async function updateAddress(req, res, next) {
  try {
    const { street, city, province, postalCode } = req.body;
    const address = await addressService.updateAddress(req.params.id, { street, city, province, postalCode });
    if (!address) return res.status(404).json({ error: 'Address not found' });
    res.json(address);
  } catch (err) {
    if (err.message.includes('Invalid')) return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const address = await addressService.deleteAddress(req.params.id);
    if (!address) return res.status(404).json({ error: 'Address not found' });
    res.json({ message: 'Address deleted successfully' });
  } catch (err) { next(err); }
}

async function setDefaultAddress(req, res, next) {
  try {
    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ error: 'addressId is required' });
    const address = await addressService.setDefault(req.params.id, addressId);
    res.json(address);
  } catch (err) { next(err); }
}

module.exports = { createAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress };
