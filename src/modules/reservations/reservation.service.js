import { dbConfig } from '../../config/database.js';

class ReservationService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  create = async (userId, payload) => {
    const { bookId } = payload;

    const student = await this.prisma.student.findUnique({ where: { userId: userId } });
    if (!student) {
      throw new Error("Only registered students can reserve books.");
    }

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableCopies <= 0) {
      throw new Error("Book is out of stock.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const [newReservation] = await this.prisma.$transaction([
      this.prisma.reservation.create({
        data: { studentId: student.id, bookId, expiresAt, status: 'PENDING' }
      }),
      this.prisma.book.update({
        where: { id: bookId },
        data: { availableCopies: book.availableCopies - 1 }
      })
    ]);

    return newReservation;
  }

  getAll = async () => {
    return await this.prisma.reservation.findMany({
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        book: { select: { title: true, isbn: true } }
      }
    });
  }

  cancel = async (id) => {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new Error("Reservation not found.");
    if (reservation.status !== 'PENDING') throw new Error("Only pending reservations can be cancelled.");

    await this.prisma.$transaction([
      this.prisma.reservation.delete({ where: { id } }),
      this.prisma.book.update({
        where: { id: reservation.bookId },
        data: { availableCopies: { increment: 1 } }
      })
    ]);
  }

  validate = async (id, payload) => {
    const { dueDate } = payload; 

    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new Error("Reservation not found.");
    
    if (reservation.status !== 'PENDING') {
      throw new Error("Only pending reservations can be validated.");
    }

    const loanDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const [, newLoan] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
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

    return newLoan;
  }

  getByStudentId = async (studentId) => {
    return await this.prisma.reservation.findMany({
      where: { studentId: studentId },
      include: {
        book: { select: { title: true, author: true, coverImage: true } }
      },
      orderBy: { reservationDate: 'desc' }
    });
  }
}

export const reservationService = new ReservationService();
