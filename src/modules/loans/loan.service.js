import { dbConfig } from '../../config/database.js';

class LoanService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  create = async (payload) => {
    const { studentId, bookId, dueDate } = payload;

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableCopies <= 0) {
      throw new Error("Book is out of stock.");
    }

    const [newLoan] = await this.prisma.$transaction([
      this.prisma.loan.create({
        data: { studentId, bookId, dueDate: new Date(dueDate), status: 'ACTIVE' }
      }),
      this.prisma.book.update({
        where: { id: bookId },
        data: { availableCopies: book.availableCopies - 1 }
      })
    ]);

    return newLoan;
  }

  returnLoan = async (id) => {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan || loan.status === 'RETURNED') {
      throw new Error("Loan already returned or not found.");
    }

    const [updatedLoan] = await this.prisma.$transaction([
      this.prisma.loan.update({
        where: { id },
        data: { status: 'RETURNED', returnDate: new Date() }
      }),
      this.prisma.book.update({
        where: { id: loan.bookId },
        data: { availableCopies: { increment: 1 } }
      })
    ]);

    return updatedLoan;
  }

  getAll = async () => {
    return await this.prisma.loan.findMany({
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        book: { select: { title: true, isbn: true } }
      }
    });
  }

  cancel = async (id) => {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new Error("Loan not found.");
    
    if (loan.status === 'RETURNED') throw new Error("Cannot cancel a returned loan.");

    await this.prisma.$transaction([
      this.prisma.loan.delete({ where: { id } }),
      this.prisma.book.update({
        where: { id: loan.bookId },
        data: { availableCopies: { increment: 1 } }
      })
    ]);
  }

  getByStudentId = async (studentId) => {
    return await this.prisma.loan.findMany({
      where: { studentId: studentId },
      include: {
        book: { select: { title: true, author: true, coverImage: true } }
      },
      orderBy: { loanDate: 'desc' }
    });
  }

  notifyOverdue = async (id) => {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        book: true,
        student: {
          include: {
            user: true
          }
        }
      }
    });

    if (!loan) throw new Error("Loan not found.");
    if (loan.status === 'RETURNED') throw new Error("Document is already returned.");

    // Fallback: Use parentEmail if available, otherwise student's user email
    const emailTarget = loan.student.parentEmail || loan.student.user.email;
    const studentName = `${loan.student.user.firstName} ${loan.student.user.lastName}`;

    // Import emailService dynamically or assure it's imported at the top
    const { emailService } = await import('../../utils/email.service.js');
    await emailService.sendOverdueNotificationEmail(emailTarget, studentName, loan.book.title, loan.dueDate);

    return { success: true, message: "Notification sent successfully." };
  }
}

export const loanService = new LoanService();
