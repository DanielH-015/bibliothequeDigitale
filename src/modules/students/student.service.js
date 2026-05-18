import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbConfig } from '../../config/database.js';

class StudentService {
  constructor() {
    this.prisma = dbConfig.prisma;
  }

  create = async (payload) => {
    const { 
      firstName, lastName, email, password,
      registrationNumber, birthDate, classroom, studyStream, parentEmail 
    } = payload;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        isValid: true,
        studentProfile: {
          create: {
            registrationNumber,
            birthDate: new Date(birthDate),
            classroom,
            studyStream,
            parentEmail,
            qrCodeId: uuidv4()
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    newStudent.password = undefined;
    return newStudent;
  }

  getAll = async () => {
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { studentProfile: true }
    });
    
    students.forEach(s => s.password = undefined);
    return students;
  }

  getById = async (id) => {
    const student = await this.prisma.user.findFirst({
      where: { id, role: 'STUDENT' },
      include: { 
        studentProfile: {
          include: { loans: true, reservations: true }
        } 
      }
    });

    if (!student) throw new Error("Student not found.");
    
    student.password = undefined;
    return student;
  }

  update = async (id, payload) => {
    const { firstName, lastName, email, registrationNumber, classroom, studyStream, parentEmail, profileImage } = payload;

    const dataToUpdate = {
      firstName,
      lastName,
      email,
      studentProfile: {
        upsert: {
          create: {
            registrationNumber: registrationNumber || `TEMP-${Date.now()}`,
            classroom: classroom || 'N/A',
            studyStream: studyStream || 'N/A',
            parentEmail: parentEmail || 'N/A',
            birthDate: new Date(), // Required by DB but not in the mobile form
            qrCodeId: uuidv4() 
          },
          update: { 
            registrationNumber, 
            classroom, 
            studyStream, 
            parentEmail 
          }
        }
      }
    };

    if (profileImage) {
      dataToUpdate.profileImage = profileImage;
    }

    const updatedStudent = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { studentProfile: true }
    });

    updatedStudent.password = undefined;
    return updatedStudent;
  }


  getByQrCode = async (qrCodeScanned) => {
    const studentProfile = await this.prisma.student.findUnique({
      where: { qrCodeId: qrCodeScanned },
      include: {
        user: { 
          select: { firstName: true, lastName: true, email: true, profileImage: true } 
        }
      }
    });

    if (!studentProfile) {
      throw new Error("Invalid or unrecognized QR Code.");
    }

    return studentProfile;
  }

  uploadPhoto = async (studentId, photoPath) => {
    await this.prisma.student.update({
      where: { userId: studentId },
      data: { studentPhoto: photoPath }
    });
  }

  delete = async (userId) => {
    const student = await this.prisma.student.findUnique({ 
      where: { userId },
      include: { 
        loans: { where: { status: 'ACTIVE' } } 
      } 
    });
    
    if (!student) {
      throw new Error("Student not found.");
    }

    if (student.loans && student.loans.length > 0) {
      throw new Error(`Cannot delete student. They still have ${student.loans.length} active loan(s) to return.`);
    }

    await this.prisma.$transaction([
      this.prisma.student.delete({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } })
    ]);
  }
}

export const studentService = new StudentService();
