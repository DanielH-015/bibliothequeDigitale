import { dbConfig } from '../../config/database.js';

class BookController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Add a new book to the library
  createBook = async (req, res) => {
    try {
      const { title, author, isbn, availableCopies, category, location } = req.body;

      if (!title || !author || !isbn || !category) {
        return res.status(400).json({ message: "Title, author, isbn, and category are required." });
      }

      const newBook = await this.prisma.book.create({
        data: {
          title,
          author,
          isbn,
          availableCopies: availableCopies || 1,
          category,
          location
        }
      });

      res.status(201).json({ message: "Book added successfully.", book: newBook });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: "A book with this ISBN already exists." });
      }
      res.status(500).json({ message: "Error adding book." });
    }
  }

  // Full catalogue of books with their availability status (for the mobile application)
  getAllBooks = async (req, res) => {
    try {
      const books = await this.prisma.book.findMany();
      res.status(200).json(books);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching books." });
    }
  }

  // Get the details of a book with its current availability status (for the mobile application)
  getBookById = async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);

      const book = await this.prisma.book.findUnique({
        where: { id: bookId },
        include: {
          loans: { where: { status: 'ACTIVE' } },
          reservations: { where: { status: 'PENDING' } }
        }
      });

      if (!book) return res.status(404).json({ message: "Book not found." });

      res.status(200).json(book);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching book details." });
    }
  }

  // Update a book
  updateBook = async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const { title, author, isbn, availableCopies, category, location } = req.body;

      const updatedBook = await this.prisma.book.update({
        where: { id: bookId },
        data: { title, author, isbn, availableCopies, category, location }
      });

      res.status(200).json({ message: "Book updated successfully.", book: updatedBook });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating book." });
    }
  }

  // Delete a book
  deleteBook = async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);

      await this.prisma.book.delete({
        where: { id: bookId }
      });

      res.status(200).json({ message: "Book deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting book. Ensure it has no active loans." });
    }
  }
}

export const bookController = new BookController();
