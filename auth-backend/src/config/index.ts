import dotenv from 'dotenv';

dotenv.config();

// Log warning if required environment variables are missing (instead of crashing)
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('⚠️ WARNING: JWT secrets are missing! Authentication will fail.');
}

interface Config {
    port: string | number;
    nodeEnv: string;
    database: {
        url: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    security: {
        bcryptRounds: number;
        maxLoginAttempts: number;
        lockTimeMinutes: number;
    };
    cors: {
        origin: string;
    };
    supabase: {
        url: string;
        key: string;
        bucket: string;
    };
}

export const config: Config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    database: {
        url: process.env.DATABASE_URL || '',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockTimeMinutes: parseInt(process.env.LOCK_TIME_MINUTES || '15'),
    },

    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    },

    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
        bucket: process.env.SUPABASE_BUCKET || 'course-platform',
    },
};
