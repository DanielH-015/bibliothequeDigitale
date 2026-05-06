import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbConfig } from '../../config/database.js';
import { GLOBAL_CONFIG } from '../../config/env.js';

class AuthController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Connexion method for users
  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      // User lookup in the database by email
      const user = await this.prisma.user.findUnique({
        where: { email: email }
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Verification that the account is not deactivated
      if (!user.isValid) {
        return res.status(403).json({ message: "Account is not activated yet." });
      }

      // Generation of the access token (JWT)
      const token = jwt.sign(
        { id: user.id, role: user.role },
        GLOBAL_CONFIG.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // We remove the password from the user object before sending it in the response for security reasons
      user.password = undefined;

      res.status(200).json({
        message: "Login successful.",
        token: token,
        user: user
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error during login process." });
    }
  }
}

// We instanciate the class to be able to use the controller in our routes later
export const authController = new AuthController();
