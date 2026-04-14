
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLastAnnouncements() {
    console.log("--- Debugging Last 5 Announcements & Notifications ---");
    try {
        const lastAnnouncements = await prisma.announcement.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { name: true, role: true } },
                recipient: { select: { name: true, email: true } }
            }
        });

        if (lastAnnouncements.length === 0) {
            console.log("No announcements found in the database.");
        } else {
            for (const a of lastAnnouncements) {
                console.log(`[Announcement] ID: ${a.id} | Title: ${a.title}`);
                console.log(` - Sender: ${a.sender?.name} (${a.sender?.role})`);
                console.log(` - Recipient: ${a.recipient?.name ?? 'BROADCAST'} (${a.targetAudience})`);
                
                // Check if a corresponding notification exists
                const notifications = await prisma.notification.findMany({
                    where: { relatedEntityId: a.id }
                });
                console.log(` - Linked Notifications count: ${notifications.length}`);
                for (const n of notifications) {
                    const targetUser = await prisma.user.findUnique({ where: { id: n.userId }, select: { name: true } });
                    console.log(`   * Notification to: ${targetUser?.name} (Read: ${n.isRead})`);
                }
                console.log("--------------------------------------------------");
            }
        }

    } catch (err) {
        console.error("Debug script failed:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugLastAnnouncements();
