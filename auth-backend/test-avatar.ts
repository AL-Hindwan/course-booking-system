import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    select: { name: true, avatar: true },
    where: { role: 'TRAINER' }
  });
  console.log(users);
  await prisma.$disconnect();
}
run();
