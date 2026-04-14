import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      sender: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true } },
    }
  });

  console.log("Recent Announcements:", JSON.stringify(allAnnouncements, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
