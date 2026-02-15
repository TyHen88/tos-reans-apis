import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateInstructorPassword() {
  try {
    const hashedPassword = await bcrypt.hash('instructor123', 10);
    
    const user = await prisma.user.update({
      where: { email: 'instructor@example.com' },
      data: {
        passwordHash: hashedPassword,
      },
    });

    console.log('✅ Successfully updated instructor password!');
    console.log('Email: instructor@example.com');
    console.log('Password: instructor123');
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateInstructorPassword();
