import { Router } from 'express';
import { reservationController } from './reservation.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

class ReservationRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.use(authMiddleware.verifyToken);

    // A student can create a reservation for a book copy that is currently available
    this.router.post('/', reservationController.createReservation);
    
    // A student (or admin) can view their reservation history
    this.router.get('/student/:studentId', reservationController.getReservationsByStudent);

    // A student (or admin) can cancel a pending reservation
    this.router.delete('/:id', reservationController.cancelReservation);

    // Restricted routes for Admin and Librarian to manage reservations
    this.router.get('/', authMiddleware.requireAdmin, reservationController.getAllReservations);
    this.router.put('/:id/validate', authMiddleware.requireAdmin, reservationController.validateReservation);
  }

}

export const reservationRoutes = new ReservationRoutes().router;
