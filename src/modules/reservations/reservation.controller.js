import { dbConfig } from '../../config/database.js';

class ReservationController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Create a new reservation (when a student reserves a book)
  createReservation = async (req, res) => {
    try {
      const { bookId } = req.body;
      const userId = req.user.id; // We get the user ID from the authentication token (middleware)

      // Verification : is the user a student? Is the book available in stock?
      const student = await this.prisma.student.findUnique({ where: { userId: userId } });
      if (!student) {
        return res.status(403).json({ message: "Only registered students can reserve books." });
      }

      const book = await this.prisma.book.findUnique({ where: { id: bookId } });
      if (!book || book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book is out of stock." });
      }

      // The reservation expires in 3 days (automatic calculation)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      const [newReservation, updatedBook] = await this.prisma.$transaction([
        this.prisma.reservation.create({
          data: { studentId: student.id, bookId, expiresAt, status: 'PENDING' }
        }),
        this.prisma.book.update({
          where: { id: bookId },
          data: { availableCopies: book.availableCopies - 1 } // On retire 1 copie reservee
        })
      ]);

      res.status(201).json({ message: "Book reserved successfully.", reservation: newReservation });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating reservation." });
    }
  }

  // List all reservations (for the admin dashboard)
  getAllReservations = async (req, res) => {
    try {
      const reservations = await this.prisma.reservation.findMany({
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          book: { select: { title: true, isbn: true } }
        }
      });
      res.status(200).json(reservations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching reservations." });
    }
  }

    // Cancel a reservation (when a student cancels a reservation before it expires)
  cancelReservation = async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);

      const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
      if (!reservation) return res.status(404).json({ message: "Reservation not found." });
      if (reservation.status !== 'PENDING') return res.status(400).json({ message: "Only pending reservations can be cancelled." });

      // Transaction: Delete the reservation AND increase the stock by 1
      await this.prisma.$transaction([
        this.prisma.reservation.delete({ where: { id: reservationId } }),
        this.prisma.book.update({
          where: { id: reservation.bookId },
          data: { availableCopies: { increment: 1 } }
        })
      ]);

      res.status(200).json({ message: "Reservation cancelled successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error cancelling reservation." });
    }
  }

    // Validation of a loan by a librarian 
  validateReservation = async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      
      // The default date is 14 days from now, but the librarian can specify a custom due date in the request body
      const { dueDate } = req.body; 

      const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
      if (!reservation) return res.status(404).json({ message: "Reservation not found." });
      
      if (reservation.status !== 'PENDING') {
        return res.status(400).json({ message: "Only pending reservations can be validated." });
      }

      // Calculate the due date for the loan
      const loanDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const [updatedReservation, newLoan] = await this.prisma.$transaction([
        this.prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'VALIDATED' }
        }),
        this.prisma.loan.create({
          data: {
            studentId: reservation.studentId,
            bookId: reservation.bookId,
            dueDate: loanDueDate,
            status: 'ACTIVE'
          }
        })
      ]);

      res.status(200).json({ 
        message: "Reservation validated and converted to active loan.", 
        loan: newLoan 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error validating reservation." });
    }
  }

  // Get the list of reservations for a specific student (for the mobile application)
  getReservationsByStudent = async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);

      const reservations = await this.prisma.reservation.findMany({
        where: { studentId: studentId },
        include: {
          book: { select: { title: true, author: true, coverImage: true } }
        },
        orderBy: { reservationDate: 'desc' }
      });

      res.status(200).json(reservations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching student reservations." });
    }
  }


}

export const reservationController = new ReservationController();
