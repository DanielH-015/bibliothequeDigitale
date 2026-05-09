import express from 'express';
import cors from 'cors';
import { notFound, globalErrorHandler } from './middlewares/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { studentRoutes } from './modules/students/student.routes.js';
import { bookRoutes } from './modules/books/book.routes.js';
import { loanRoutes } from './modules/loans/loan.routes.js';
import { reservationRoutes } from './modules/reservations/reservation.routes.js';

class App {
  constructor() {
    this.expressApp = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    this.expressApp.use(cors());
    this.expressApp.use(express.json());
  }

  initializeRoutes() {
    this.expressApp.get('/', (req, res) => {
      res.json({ message: 'Welcome to the Library Management API' });
    });

    this.expressApp.use('/api/auth', authRoutes);
    this.expressApp.use('/api/users', userRoutes);
    this.expressApp.use('/api/students', studentRoutes);
    this.expressApp.use('/api/books', bookRoutes);
    this.expressApp.use('/api/loans', loanRoutes);
    this.expressApp.use('/api/reservations', reservationRoutes);
    this.expressApp.use('/uploads', express.static('uploads'));
  }

  initializeErrorHandling() {
    this.expressApp.use(notFound);
    this.expressApp.use(globalErrorHandler);
  }
}

export const app = new App().expressApp;
