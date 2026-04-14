import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const rooms = await prisma.room.findMany({
        include: {
            institute: {
                include: {
                    bankAccounts: true
                }
            }
        }
    });

    fs.writeFileSync('test-banks.json', JSON.stringify(rooms, null, 2), 'utf8');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
