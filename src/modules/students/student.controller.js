import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbConfig } from '../../config/database.js';

class StudentController {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  // Create a student (User + Student Profile + QR Code)
  createStudent = async (req, res) => {
    try {
      const { 
        firstName, lastName, email, password, // Infos Utilisateur
        registrationNumber, birthDate, classroom, studyStream, parentEmail // Infos Scolaires
      } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      // Prisma can create a student with his profile with a transaction
      const newStudent = await this.prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          role: 'STUDENT',
          isValid: true,
          
          studentProfile: {
            create: {
              registrationNumber: registrationNumber,
              birthDate: new Date(birthDate),
              classroom: classroom,
              studyStream: studyStream,
              parentEmail: parentEmail,
              qrCodeId: uuidv4() // Generation of a unique QR Code ID for the student using UUID v4
            }
          }
        },
        include: {
          studentProfile: true
        }
      });

      newStudent.password = undefined;

      res.status(201).json({ message: "Student created successfully.", student: newStudent });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: "Email or registration number already in use." });
      }
      res.status(500).json({ message: "Error creating student." });
    }
  }

  // Get the list of all students
  getAllStudents = async (req, res) => {
    try {
      const students = await this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: { studentProfile: true }
      });
      
      students.forEach(s => s.password = undefined);
      res.status(200).json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching students." });
    }
  }

  // Get the profile of a student (for the mobile application)
  getStudentById = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const student = await this.prisma.user.findFirst({
        where: { id: userId, role: 'STUDENT' },
        include: { 
          studentProfile: {
            include: { loans: true, reservations: true } // On inclut ses emprunts
          } 
        }
      });

      if (!student) return res.status(404).json({ message: "Student not found." });
      
      student.password = undefined;
      res.status(200).json(student);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching student details." });
    }
  }

  // Allow a student to update their profile (Class, Stream, etc.)
  updateStudent = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, email, registrationNumber, classroom, studyStream, parentEmail } = req.body;

      const updatedStudent = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
          studentProfile: {
            update: { 
              registrationNumber: registrationNumber, 
              classroom: classroom, 
              studyStream: studyStream, 
              parentEmail: parentEmail 
            }
          }
        },
        include: { studentProfile: true }
      });

      updatedStudent.password = undefined;
      res.status(200).json({ message: "Student updated successfully.", student: updatedStudent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating student." });
    }
  }

  // For the librarian: Scan the QR Code and get the student's profile
  getStudentByQrCode = async (req, res) => {
    try {
      const qrCodeScanned = req.params.qrCode;

      const studentProfile = await this.prisma.student.findUnique({
        where: { qrCodeId: qrCodeScanned },
        include: {
          user: { 
            select: { firstName: true, lastName: true, email: true, profileImage: true } 
          }
        }
      });

      if (!studentProfile) {
        return res.status(404).json({ message: "Invalid or unrecognized QR Code." });
      }

      res.status(200).json(studentProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error during QR Code scan." });
    }
  }

    // Upload a profile photo for the student (for the mobile application)
  uploadPhoto = async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);

      // If multer have received the file, it will be in req.file, otherwise it's an error
      if (!req.file) {
        return res.status(400).json({ message: "No image provided." });
      }

      // The path we will save in the database (ex: 'uploads/1623849...jpg')
      const photoPath = req.file.path.replace(/\\/g, '/'); // Replace Windows backslashes

      // Update the student's profile with the new photo path
      await this.prisma.student.update({
        where: { userId: studentId }, // We use userId because the student table is linked to the user table
        data: { studentPhoto: photoPath }
      });

      res.status(200).json({ message: "Photo uploaded successfully.", photoUrl: photoPath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading photo." });
    }
  }

    // Delete a student account (only for admin, and only if the student has no active loans or reservations)
  deleteStudent = async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // First, we check if the student has any active loans or reservations.
      const student = await this.prisma.student.findUnique({ 
        where: { userId: userId },
        include: { 
          loans: { where: { status: 'ACTIVE' } } 
        } 
      });
      
      if (!student) {
        return res.status(404).json({ message: "Student not found." });
      }

      // Verification : does the student have active loans? If yes, we cannot delete the account
      if (student.loans && student.loans.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete student. They still have ${student.loans.length} active loan(s) to return.` 
        });
      }

      // If the student has no active loans, we can proceed to delete the student profile and the user account in a transaction
      await this.prisma.$transaction([
        this.prisma.student.delete({ where: { userId: userId } }),
        this.prisma.user.delete({ where: { id: userId } })
      ]);

      res.status(200).json({ message: "Student and user account deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting student. Ensure they have no attached history." });
    }
  }

}

export const studentController = new StudentController();
