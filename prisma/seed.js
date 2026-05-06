import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Verification if the default admin user already exists to avoid duplicates
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'daniel@gmail.com' },
  });

  if (!existingAdmin) {
    // Cryptage of the default password for the admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Creation of a default admin user if it doesn't exist
    await prisma.user.create({
      data: {
        firstName: 'Daniel',
        lastName: 'Admin',
        email: 'daniel@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        isValid: true,
      },
    });

    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
