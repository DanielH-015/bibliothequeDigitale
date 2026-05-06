import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error.middleware.js';
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
    // Simple route to test if the server is running
    this.expressApp.get('/', (req, res) => {
      res.json({ message: 'Welcome to the Library Management API' });
    });

    // Authentication routes
    this.expressApp.use('/api/auth', authRoutes);

    // Users modules enregistered
    this.expressApp.use('/api/users', userRoutes);

    // Students modules enregistered
    this.expressApp.use('/api/students', studentRoutes);

    // Books modules enregistered
    this.expressApp.use('/api/books', bookRoutes);

    // Loans modules enregistered
    this.expressApp.use('/api/loans', loanRoutes);

    // Reservations modules enregistered
    this.expressApp.use('/api/reservations', reservationRoutes);

    // Upload route for uploading student profile pictures
    this.expressApp.use('/uploads', express.static('uploads'));

  }

  initializeErrorHandling() {
    // The notFound middleware should be registered after all routes to catch any requests that don't match existing routes
    this.expressApp.use(errorMiddleware.notFound);
    // The globalErrorHandler should be registered last to catch any errors that occur in the routes or other middlewares
    this.expressApp.use(errorMiddleware.globalErrorHandler);
  }
}

export const app = new App().expressApp;
