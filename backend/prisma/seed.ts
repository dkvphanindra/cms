import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';
  const adminPassword = 'Admin@123';

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
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
    console.log('Username: admin');
    console.log('Password: Admin@123');
  } else {
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