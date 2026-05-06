import { PrismaClient } from '@prisma/client';

class DatabaseConfig {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('Database connected successfully.');
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1); // We stop every things if the connexion goes wrong
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('Database disconnected.');
  }
}

// We instanciate the class to be able to use it in the whole application
export const dbConfig = new DatabaseConfig();
