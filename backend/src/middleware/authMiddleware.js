import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError', 'CastError'].includes(error.name)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    return next(error);
  }
};

export default authMiddleware;
