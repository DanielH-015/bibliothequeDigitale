import jwt from 'jsonwebtoken';

export const verify = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // add user data to request object
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  // We assume that the verify middleware has already been called and that req.user exists
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  next();
};

export const requireLibrarianOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
    return res.status(403).json({ message: 'Access denied. Librarian or Admin privileges required.' });
  }

  next();
};
