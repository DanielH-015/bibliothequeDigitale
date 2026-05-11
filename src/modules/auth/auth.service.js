import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For generating secure random tokens
import { dbConfig } from '../../config/database.js';
import { GLOBAL_CONFIG } from '../../config/env.js';
import { emailService } from '../../utils/email.service.js';

class AuthService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // --- LOGIN ---
  login = async (payload) => {
    const { email, password } = payload;
    if (!email || !password) throw new Error("Email and password are required.");

    const user = await this.prisma.user.findUnique({ where: { email: email } });
    if (!user) throw new Error("Invalid email or password.");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid email or password.");

    if (!user.isValid) throw new Error("Account is not activated yet. Please check your email.");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      GLOBAL_CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );
    user.password = undefined;
    return { token, user };
  }

  // --- REGISTER ---
  register = async (payload) => {
    const { firstName, lastName, email, password } = payload;
    if (!firstName || !lastName || !email || !password) {
      throw new Error("All fields are required.");
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Email is already in use.");

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a random 32-character hex token
    const activationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        isValid: false, // User must verify email
        activationToken,
      }
    });

    // Send the verification email asynchronously
    await emailService.sendVerificationEmail(email, activationToken, firstName);

    return { message: "Account created successfully. Please check your email to verify your account." };
  }

  // --- VERIFY EMAIL ---
  verifyEmail = async (token) => {
    const user = await this.prisma.user.findFirst({ where: { activationToken: token } });
    if (!user) throw new Error("Invalid or expired verification token.");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isValid: true, activationToken: null }
    });

    return { message: "Email verified successfully. You can now log in." };
  }

  // --- FORGOT PASSWORD ---
  forgotPassword = async (email) => {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Security practice: Always return the same message to prevent email enumeration
    if (!user) return { message: "If this email is registered, a reset link will be sent." };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // Expires in 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires }
    });

    await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
    return { message: "If this email is registered, a reset link will be sent." };
  }

  // --- RESET PASSWORD ---
  resetPassword = async (payload) => {
    const { token, newPassword } = payload;
    if (!token || !newPassword) throw new Error("Token and new password are required.");

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() } // Token must be strictly greater than current time
      }
    });

    if (!user) throw new Error("Invalid or expired reset token.");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null }
    });

    return { message: "Password has been reset successfully. You can now log in." };
  }

    // --- VERIFY EMAIL LINK (From Browser) ---
  verifyEmailLink = async (token, req) => {
    try {
      // 1. Find the user with this token
      const user = await this.prisma.user.findFirst({ 
        where: { activationToken: token } 
      });
      
      if (!user) {
        // Use the hidden Express response object (req.res) to send HTML
        req.res.status(400).send(`
          <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
            <h1 style="color: red;">Verification Failed</h1>
            <p>Invalid or expired verification token.</p>
          </div>
        `);
        return; // Stop execution
      }

      // 2. Update the user account to valid
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isValid: true, activationToken: null }
      });

      // 3. Force the browser to redirect and wake up the Flutter app
      req.res.redirect('digitallibrary://auth/verify-success');
      return; 
      
    } catch (error) {
      req.res.status(500).send("<h1>Internal Server Error</h1>");
      return;
    }
  }

}

export const authService = new AuthService();
