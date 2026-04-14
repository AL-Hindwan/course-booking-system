import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import path from 'path';

class UploadService {
    private supabase;

    constructor() {
        this.supabase = createClient(config.supabase.url, config.supabase.key);
    }

    /**
     * Upload a file to Supabase Storage
     * @param file The file object from Multer
     * @param folder Optional folder name (e.g. 'avatars', 'courses')
     */
    async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
        try {
            if (!config.supabase.url || !config.supabase.key) {
                console.warn('⚠️ Supabase credentials not found. Returning local path placeholder.');
                return `/uploads/${file.filename}`; // Fallback for local dev if keys missing
            }

            const fileExt = path.extname(file.originalname);
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
            
            const { data, error } = await this.supabase.storage
                .from(config.supabase.bucket)
                .upload(fileName, file.buffer || require('fs').readFileSync(file.path), {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = this.supabase.storage
                .from(config.supabase.bucket)
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('❌ Supabase Upload Error:', error);
            throw new Error('Failed to upload file to storage');
        }
    }

    /**
     * Delete a file from Supabase Storage
     * @param fileUrl The full public URL of the file
     */
    async deleteFile(fileUrl: string): Promise<void> {
        try {
            if (!fileUrl || !fileUrl.includes(config.supabase.url)) return;

            // Extract path from URL
            const pathSegments = fileUrl.split(`${config.supabase.bucket}/`);
            if (pathSegments.length < 2) return;
            
            const filePath = pathSegments[1];

            const { error } = await this.supabase.storage
                .from(config.supabase.bucket)
                .remove([filePath]);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('❌ Supabase Delete Error:', error);
            // Don't throw error for delete to avoid breaking main flows
        }
    }
}

export const uploadService = new UploadService();
