import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@platform.com' }
    });

    if (!user) {
        console.log('User NOT found in database');
    } else {
        console.log('User found:', user.email);
        console.log('Role:', user.role);
        console.log('Status:', user.status);
        
        const isMatch = await bcrypt.compare('Test@123456', user.password);
        console.log('Password match test (Test@123456):', isMatch);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
