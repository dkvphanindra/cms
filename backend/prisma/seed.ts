import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'ADMIN';
  const adminPassword = 'Admin@123';

  const existingAdmin = await prisma.user.findFirst({
    where: { 
      username: {
        equals: adminUsername,
        mode: 'insensitive'
      }
    },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: Role.ADMIN,
        mustChangePass: false,
      },
    });

    console.log('✅ Admin created');
    console.log('Username: ADMIN');
    console.log('Password: Admin@123');
  } else {
    // Ensure the existing admin username is uppercase to match login logic
    if (existingAdmin.username !== adminUsername) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { username: adminUsername }
      });
      console.log('ℹ️ Admin username updated to uppercase');
    }
    console.log('ℹ️ Admin already exists');
  }

  const defaultDocumentTypes = [
    { name: '10th Marks Memo', isMandatory: true },
    { name: 'Intermediate Marks Memo', isMandatory: true },
    { name: 'College ID Card', isMandatory: true },
    { name: 'Semester 1 Grade Sheet', isMandatory: true },
    { name: 'Semester 2 Grade Sheet', isMandatory: true },
    { name: 'Resume', isMandatory: true },
  ];

  for (const docType of defaultDocumentTypes) {
    await prisma.documentType.upsert({
      where: { name: docType.name },
      update: {},
      create: docType,
    });
  }

  console.log('✅ Default document types seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });