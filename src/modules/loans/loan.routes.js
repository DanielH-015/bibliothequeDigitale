import { Router } from 'express';
import { loanController } from './loan.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

class LoanRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Only authenticated users can access these routes (Admin, Librarian, Student)
    this.router.use(authMiddleware.verifyToken);

    // Routes for Admin and Librarian to manage loans
    this.router.get('/', authMiddleware.requireAdmin, loanController.getAllLoans);
    this.router.post('/', authMiddleware.requireAdmin, loanController.createLoan);
    this.router.put('/:id/return', authMiddleware.requireAdmin, loanController.returnLoan);
    this.router.delete('/:id', authMiddleware.requireAdmin, loanController.cancelLoan);

    // Route: A student (or an admin) can view a student's loan history
    this.router.get('/student/:studentId', loanController.getLoansByStudent);
  }

}

export const loanRoutes = new LoanRoutes().router;
