import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbConfig } from '../../config/database.js';
import { GLOBAL_CONFIG } from '../../config/env.js';

class AuthService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  login = async (payload) => {
    const { email, password } = payload;

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isValid) {
      throw new Error("Account is not activated yet.");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      GLOBAL_CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );

    user.password = undefined;

    return { token, user };
  }
}

export const authService = new AuthService();
