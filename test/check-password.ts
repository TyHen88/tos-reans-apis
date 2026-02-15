import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPasswordHash() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'testuser1771129486@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
      },
    });

    if (user) {
      console.log('✅ User found in database:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('PasswordHash exists:', !!user.passwordHash);
      console.log('PasswordHash length:', user.passwordHash?.length || 0);
      console.log('PasswordHash preview:', user.passwordHash?.substring(0, 20) + '...');
    } else {
      console.log('❌ User not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordHash();
