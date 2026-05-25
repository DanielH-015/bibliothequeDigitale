import { dbConfig } from '../../config/database.js';

class BookService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  create = async (payload) => {
    let { title, author, isbn, availableCopies, category, location, coverImage } = payload;
    
    // Convert availableCopies to number if it comes from FormData
    if (availableCopies !== undefined) {
      availableCopies = parseInt(availableCopies, 10);
    }
    
    try {
      const newBook = await this.prisma.book.create({
        data: {
          title,
          author,
          isbn,
          availableCopies: availableCopies || 1,
          category,
          location,
          coverImage
        }
      });
      return newBook;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error("A book with this ISBN already exists.");
      }
      throw error;
    }
  }

  getAll = async () => {
    return await this.prisma.book.findMany();
  }

  getById = async (id) => {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        loans: { where: { status: 'ACTIVE' } },
        reservations: { where: { status: 'PENDING' } }
      }
    });

    if (!book) {
      throw new Error("Book not found.");
    }
    return book;
  }

  update = async (id, payload) => {
    let { title, author, isbn, availableCopies, category, location, coverImage } = payload;
    
    if (availableCopies !== undefined) {
      availableCopies = parseInt(availableCopies, 10);
    }
    
    return await this.prisma.book.update({
      where: { id },
      data: { title, author, isbn, availableCopies, category, location, coverImage }
    });
  }

  delete = async (id) => {
    try {
      await this.prisma.book.delete({
        where: { id }
      });
    } catch (error) {
      throw new Error("Error deleting book. Ensure it has no active loans.");
    }
  }
}

export const bookService = new BookService();
