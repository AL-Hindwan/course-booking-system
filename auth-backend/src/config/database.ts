import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
    prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
} catch (error: any) {
    console.error('CRITICAL: Failed to initialize Prisma Client:', error.message);
    // Fallback or rethrow based on environment
    prisma = new PrismaClient(); 
}

export default prisma;
