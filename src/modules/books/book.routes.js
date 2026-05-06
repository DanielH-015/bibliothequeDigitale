import { Router } from 'express';
import { bookController } from './book.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

class BookRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Routes of consultation accessible to all authenticated users (Admin, Librarian, Student)
    this.router.get('/', authMiddleware.verifyToken, bookController.getAllBooks);
    this.router.get('/:id', authMiddleware.verifyToken, bookController.getBookById);

    // Routes of modification accessible only to Admin
    this.router.post('/', authMiddleware.verifyToken, authMiddleware.requireAdmin, bookController.createBook);
    this.router.put('/:id', authMiddleware.verifyToken, authMiddleware.requireAdmin, bookController.updateBook);
    this.router.delete('/:id', authMiddleware.verifyToken, authMiddleware.requireAdmin, bookController.deleteBook);
  }
}

export const bookRoutes = new BookRoutes().router;
