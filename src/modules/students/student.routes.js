import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { uploadMiddleware } from '../../middlewares/upload.middleware.js';


class StudentRoutes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Global protection of all routes in this router with the verifyToken middleware
    this.router.use(authMiddleware.verifyToken);

    // Admin can see all students and create new ones
    this.router.get('/', authMiddleware.requireAdmin, studentController.getAllStudents);
    this.router.post('/', authMiddleware.requireAdmin, studentController.createStudent);

    // The librarian scans the QR code
    this.router.get('/scan/:qrCode', studentController.getStudentByQrCode);

    // The student can view and update their own profile
    this.router.get('/:id', studentController.getStudentById);
    this.router.put('/:id', studentController.updateStudent);

    // The student can upload a profile picture(the field name in the form should be 'photo')
    this.router.post('/:id/photo', uploadMiddleware.upload.single('photo'), studentController.uploadPhoto);
    
    // Admin can delete a student account (only if the student has no active loans or reservations)
    this.router.delete('/:id', authMiddleware.requireAdmin, studentController.deleteStudent);

    
  }
}

export const studentRoutes = new StudentRoutes().router;
