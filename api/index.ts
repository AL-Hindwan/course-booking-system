import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Log environment status (sanitize sensitive data)
        console.log('--- SERVERLESS FUNCTION START ---');
        console.log('Node Version:', process.version);
        console.log('DB Configured:', !!process.env.DATABASE_URL);
        console.log('JWT Configured:', !!process.env.JWT_ACCESS_SECRET);
        
        // Dynamically import the app to catch initialization errors
        // @ts-ignore
        const { default: app } = await import('../auth-backend/src/server');
        
        // Pass the request to Express
        return app(req, res);s
    } catch (error: any) {
        console.error('--- FATAL INITIALIZATION ERROR ---');
        console.error(error.message);
        console.error(error.stack);
        
        // Return JSON error instead of 500 page
        return res.status(500).json({
            success: false,
            error: 'FATAL_INIT_ERROR',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            diagnosis: 'This error happened during the server boot process. Check the logs for details.',
            environment: {
                hasDbUrl: !!process.env.DATABASE_URL,
                hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
                nodeVersion: process.version
            }
        });
    }
}
