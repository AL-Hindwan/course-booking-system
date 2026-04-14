import prisma from '../config/database';

/**
 * Utility to check database connectivity
 * Returns connection status and any error message
 */
export async function checkDatabaseConnection() {
    try {
        // Try to perform a simple query (getting user count)
        const userCount = await prisma.user.count();
        return {
            connected: true,
            userCount,
            message: 'Database connection successful'
        };
    } catch (error: any) {
        console.error('Database connection check failed:', error.message);
        return {
            connected: false,
            error: error.message,
            message: 'Failed to connect to the database'
        };
    }
}
