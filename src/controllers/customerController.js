const customerService = require('../services/customerService');

async function getUser(req, res, next) {
  try {
    const user = await customerService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const { name, email, phone } = req.body;
    const user = await customerService.updateUser(req.params.id, { name, email, phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const user = await customerService.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { getUser, updateUser, deleteUser };
