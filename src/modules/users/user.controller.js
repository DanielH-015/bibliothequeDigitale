import bcrypt from 'bcryptjs';
import { dbConfig } from '../../config/database.js';

class UserController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Obtaining the list of all users (only for admin)
  getAllUsers = async (req, res) => {
    try {
      const users = await this.prisma.user.findMany({
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
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching users." });
    }
  }

  // Create a librarian or an admin
  createUser = async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: email }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists." });
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

      res.status(201).json({ message: "User created successfully.", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating user." });
    }
  }

    // Update the information of a user (only for admin)
  updateUser = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, email, role, isValid } = req.body;

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role,
          isValid: isValid
        },
        // On renvoie les nouvelles donnees sans le mot de passe
        select: { id: true, firstName: true, email: true, role: true, isValid: true }
      });

      res.status(200).json({ message: "User updated successfully.", user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating user." });
    }
  }


  // Delete a account by id (only for admin)
  deleteUser = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      await this.prisma.user.delete({
        where: { id: userId }
      });

      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting user." });
    }
  }

    // Get the details of a user by id (for the mobile application)
  getUserById = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching user profile." });
    }
  }

}

export const userController = new UserController();
