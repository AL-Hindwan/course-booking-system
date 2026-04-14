import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import instituteRoutes from './routes/institute.routes';
import trainerRoutes from './routes/trainer.routes';
import studentRoutes from './routes/student.routes';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import prisma from './config/database';
import { startSessionScheduler } from './utils/sessionScheduler';
import { startSessionReminderJob } from './jobs/session-reminder.job';
import { startAnnouncementScheduler } from './utils/announcementScheduler';

const app: Application = express();

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
    config.cors.origin,
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(
    cors({
        origin: (origin, callback) => {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            const isAllowed = allowedOrigins.includes(origin) || 
                             origin.endsWith('.vercel.app') ||
                             origin.startsWith('http://localhost:');
                             
            if (isAllowed) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// General rate limiting
app.use(generalLimiter);

// Serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

import notificationRoutes from './routes/notification.routes';
import publicRoutes from './routes/public.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);


// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    await prisma.$disconnect();

    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = config.port;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📱 Environment: ${config.nodeEnv}`);
        startSessionScheduler();
        startSessionReminderJob();
        startAnnouncementScheduler();
    });
}

export default app;
