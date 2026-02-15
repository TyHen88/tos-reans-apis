import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        firebaseUid: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Get last 10 users
    });

    console.log(`\n📊 Found ${allUsers.length} users (showing last 10):\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   PasswordHash: ${user.passwordHash ? '✅ EXISTS (' + user.passwordHash.substring(0, 15) + '...)' : '❌ NULL'}`);
      console.log(`   FirebaseUID: ${user.firebaseUid || '❌ NULL'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Count users without passwordHash
    const usersWithoutPassword = allUsers.filter(u => !u.passwordHash);
    console.log(`\n⚠️  Users without passwordHash: ${usersWithoutPassword.length}`);
    if (usersWithoutPassword.length > 0) {
      console.log('These users likely use Firebase authentication:');
      usersWithoutPassword.forEach(u => console.log(`   - ${u.email} (Firebase UID: ${u.firebaseUid})`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
