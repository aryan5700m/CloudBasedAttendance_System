import jwt from 'jsonwebtoken';

/**
 * Verifies JWT and attaches decoded payload to req.user.
 * Accepts an optional `role` param ('student' | 'teacher') for role-based access.
 */
const authenticate = (role) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (role && decoded.role !== role) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export default authenticate;
