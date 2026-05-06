import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

class UserRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Global protection of all routes in this router with the verifyToken middleware to ensure that only authenticated users can access these routes
    this.router.use(authMiddleware.verifyToken);
    this.router.use(authMiddleware.requireAdmin);

    // Protected routes
    this.router.get('/', userController.getAllUsers);
    this.router.post('/', userController.createUser);
    this.router.get('/:id', userController.getUserById);
    this.router.put('/:id', userController.updateUser);
    this.router.delete('/:id', userController.deleteUser);
  }
}

export const userRoutes = new UserRoutes().router;
