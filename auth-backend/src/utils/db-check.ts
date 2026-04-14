import prisma from '../config/database';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Utility to check database connectivity
 * Returns connection status and any error message
 */
export async function checkDatabaseConnection() {
    console.log('--- STARTING DIAGNOSTIC CHECK ---');
    
    let jwtStatus = { configured: false, message: 'Checking...' };
    let storageStatus = { connected: false, message: 'Not checked' };
    let dbStatus = { connected: false, message: 'Not checked' };
    let envCheck = { 
        DATABASE_URL: !!process.env.DATABASE_URL,
        DIRECT_URL: !!process.env.DIRECT_URL,
        JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
        SUPABASE_URL: !!process.env.SUPABASE_URL
    };

    // 1. Check JWT
    try {
        if (process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET) {
            jwtStatus = { configured: true, message: 'JWT Secrets are present' };
        } else {
            jwtStatus = { configured: false, message: 'JWT Secrets are MISSING' };
        }
    } catch (e: any) {
        jwtStatus = { configured: false, message: `JWT Check failed: ${e.message}` };
    }

    // 2. Check Storage
    try {
        console.log('Checking Supabase Storage...');
        if (config.supabase.url && config.supabase.key) {
            const supabase = createClient(config.supabase.url, config.supabase.key);
            const { error } = await supabase.storage.getBucket(config.supabase.bucket);
            if (error) throw error;
            storageStatus = { connected: true, message: 'Storage bucket is accessible' };
        } else {
            storageStatus = { connected: false, message: 'Supabase credentials missing' };
        }
    } catch (error: any) {
        storageStatus = { connected: false, message: `Storage Error: ${error.message}` };
    }

    // 3. Check DB
    let userCount = 0;
    try {
        console.log('Checking Database connection...');
        if (!process.env.DATABASE_URL) {
            dbStatus = { connected: false, message: 'DATABASE_URL is missing' };
        } else {
            userCount = await prisma.user.count();
            dbStatus = { connected: true, message: 'Database connection successful' };
        }
    } catch (error: any) {
        console.error('Database connection check failed:', error.message);
        dbStatus = { connected: false, message: `DB Error: ${error.message}` };
    }

    console.log('--- DIAGNOSTIC CHECK COMPLETE ---');
    return {
        success: dbStatus.connected && storageStatus.connected && jwtStatus.configured,
        db: dbStatus,
        userCount,
        storage: storageStatus,
        jwt: jwtStatus,
        env: envCheck,
        nodeVersion: process.version,
        time: new Date().toISOString()
    };
}
