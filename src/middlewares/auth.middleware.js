import jwt from 'jsonwebtoken';
import { GLOBAL_CONFIG } from '../config/env.js';

class AuthMiddleware {
  
  // Methode for verifying the JWT token sent in the Authorization header of the request
  verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(403).json({ message: "No token provided." });
    }

    // The expected format is "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: "Invalid token format." });
    }

    try {
      const decoded = jwt.verify(token, GLOBAL_CONFIG.JWT_SECRET);
      // We attach the decoded user information to the request object for use in the next middlewares or route handlers
      req.user = decoded;
      next(); // Authorise the user to continue if the token is valid
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized. Token expired or invalid." });
    }
  }

  // Methode for verifying if the user has the ADMIN role
  requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'ADMIN') {
      next(); // Authorize the user to continue if they have the ADMIN role
    } else {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
  }
}

// We instanciate the class to be able to use the middleware in our routes later
export const authMiddleware = new AuthMiddleware();
