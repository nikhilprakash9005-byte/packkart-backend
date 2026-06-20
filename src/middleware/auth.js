const jwt = require('jsonwebtoken');
require('dotenv').config();
exports.authenticateUser = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};
exports.authenticateStaff = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.role) return res.status(403).json({ success: false, message: 'Not authorized' });
    req.staff = decoded; next();
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }
};
exports.requireRole = function() {
  const roles = Array.from(arguments);
  return function(req, res, next) {
    if (!roles.includes(req.staff && req.staff.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    next();
  };
};