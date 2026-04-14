import prisma from '../config/database';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Utility to check database connectivity
 * Returns connection status and any error message
 */
export async function checkDatabaseConnection() {
    let storageStatus = { connected: false, message: 'Not checked' };

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
            message: 'Database connection successful'
        };
    } catch (error: any) {
        console.error('Database connection check failed:', error.message);
        return {
            connected: false,
            error: error.message,
            storage: storageStatus,
            message: 'Failed to connect to the database'
        };
    }
}
