import prisma from '../config/database';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Utility to check database connectivity
 * Returns connection status and any error message
 */
export async function checkDatabaseConnection() {
    let storageStatus = { connected: false, message: 'Not checked' };
    let jwtStatus = { configured: false, message: 'Checking...' };

    // Check JWT Secrets
    if (process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET) {
        jwtStatus = { configured: true, message: 'JWT Secrets are configured' };
    } else {
        jwtStatus = { configured: false, message: 'JWT Secrets are MISSING' };
    }
    
    // Check Supabase Storage
    try {
        if (config.supabase.url && config.supabase.key) {
            const supabase = createClient(config.supabase.url, config.supabase.key);
            const { data, error } = await supabase.storage.getBucket(config.supabase.bucket);
            if (error) throw error;
            storageStatus = { connected: true, message: `Storage bucket '${config.supabase.bucket}' is accessible` };
        } else {
            storageStatus = { connected: false, message: 'Supabase credentials missing in config' };
        }
    } catch (error: any) {
        storageStatus = { connected: false, message: `Storage Error: ${error.message}` };
    }

    try {
        // Try to perform a simple query (getting user count)
        const userCount = await prisma.user.count();
        return {
            connected: true,
            userCount,
            storage: storageStatus,
            jwt: jwtStatus,
            message: 'Database connection successful'
        };
    } catch (error: any) {
        console.error('Database connection check failed:', error.message);
        return {
            connected: false,
            error: error.message,
            storage: storageStatus,
            jwt: jwtStatus,
            message: 'Failed to connect to the database'
        };
    }
}
