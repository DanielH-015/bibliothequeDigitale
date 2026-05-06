import { dbConfig } from '../../config/database.js';

class LoanController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Register a new loan (when a student borrows a book)
  createLoan = async (req, res) => {
    try {
      const { studentId, bookId, dueDate } = req.body;

      // 1. Verify the stock
      const book = await this.prisma.book.findUnique({ where: { id: bookId } });
      if (!book || book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book is out of stock." });
      }

      // 2. Transaction: Create the loan AND reduce the stock by 1 simultaneously
      const [newLoan, updatedBook] = await this.prisma.$transaction([
        this.prisma.loan.create({
          data: { studentId, bookId, dueDate: new Date(dueDate), status: 'ACTIVE' }
        }),
        this.prisma.book.update({
          where: { id: bookId },
          data: { availableCopies: book.availableCopies - 1 }
        })
      ]);

      res.status(201).json({ message: "Loan registered successfully.", loan: newLoan });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error registering loan." });
    }
  }

  // Return a book (when a student returns a book)
  returnLoan = async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);

      const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
      if (!loan || loan.status === 'RETURNED') {
        return res.status(400).json({ message: "Loan already returned or not found." });
      }

      // Transaction: Change the status to RETURNED AND increase the stock by 1
      const [updatedLoan, updatedBook] = await this.prisma.$transaction([
        this.prisma.loan.update({
          where: { id: loanId },
          data: { status: 'RETURNED', returnDate: new Date() }
        }),
        this.prisma.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 } }
        })
      ]);

      res.status(200).json({ message: "Book returned successfully.", loan: updatedLoan });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error returning book." });
    }
  }

  // List all loans (for the admin dashboard)
  getAllLoans = async (req, res) => {
    try {
      const loans = await this.prisma.loan.findMany({
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          book: { select: { title: true, isbn: true } }
        }
      });
      res.status(200).json(loans);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching loans." });
    }
  }

    // Cancel a loan (when a student make an error)
  cancelLoan = async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);

      const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
      if (!loan) return res.status(404).json({ message: "Loan not found." });
      
      // Only pending loans can be cancelled, if the loan is already returned, it cannot be cancelled 
      if (loan.status === 'RETURNED') return res.status(400).json({ message: "Cannot cancel a returned loan." });

      // Transaction: Delete the loan AND increase the stock by 1
      await this.prisma.$transaction([
        this.prisma.loan.delete({ where: { id: loanId } }),
        this.prisma.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 } }
        })
      ]);

      res.status(200).json({ message: "Loan cancelled successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error cancelling loan." });
    }
  }

    // List all loans of a student (for the mobile application)
  getLoansByStudent = async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const loans = await this.prisma.loan.findMany({
        where: { studentId: studentId },
        include: {
          book: { select: { title: true, author: true, coverImage: true } }
        },
        orderBy: { loanDate: 'desc' } // The early loans will be at the end of the list, the most recent loans will be at the top
      });

      res.status(200).json(loans);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching student loans." });
    }
  }


}

export const loanController = new LoanController();
