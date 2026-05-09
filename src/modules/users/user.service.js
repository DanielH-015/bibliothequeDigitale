import bcrypt from 'bcryptjs';
import { dbConfig } from '../../config/database.js';

class UserService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  getAll = async () => {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isValid: true,
        createdAt: true
      }
    });
  }

  create = async (payload) => {
    const { firstName, lastName, email, password, role } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      throw new Error("Email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        role: role || 'STUDENT',
        isValid: true
      },
      select: { id: true, firstName: true, email: true, role: true }
    });

    return newUser;
  }

  update = async (id, payload) => {
    const { firstName, lastName, email, role, isValid } = payload;

    return await this.prisma.user.update({
      where: { id },
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role,
        isValid: isValid
      },
      select: { id: true, firstName: true, email: true, role: true, isValid: true }
    });
  }

  delete = async (id) => {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  getById = async (id) => {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isValid: true,
        profileImage: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  }
}

export const userService = new UserService();
