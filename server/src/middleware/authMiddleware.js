import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Protect: Verify JWT and attach user to req ───────────────────────────────
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password').populate('branch', 'name code city');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — user not found' });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the clinic owner.' });
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired' });
  }
};

// ─── Authorize: Role-based access control ────────────────────────────────────
// Usage: authorize('owner', 'admin')
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not permitted to access this resource`,
      });
    }
    next();
  };

// ─── Branch Isolation: Ensure admin/therapist only access their branch ────────
// Owner bypasses. For other roles, branchId in params/body must match req.user.branch
export const branchIsolation = (req, res, next) => {
  if (req.user.role === 'owner') return next(); // owner sees all

  const branchId = req.params.branchId || req.body.branch || req.query.branch;

  if (branchId && req.user.branch?._id?.toString() !== branchId.toString()) {
    return res.status(403).json({
      message: 'Access denied — you can only access data within your assigned branch',
    });
  }
  next();
};
