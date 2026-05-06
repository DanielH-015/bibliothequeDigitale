import { Router } from 'express';
import { authController } from './auth.controller.js';

class AuthRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // POST route : http://localhost:5000/api/auth/login
    this.router.post('/login', authController.login);
  }
}

// instanciation of the class to be able to use the routes in our main app
export const authRoutes = new AuthRoutes().router;
