import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { uploadService } from '../services/upload.service';
import { checkDatabaseConnection } from '../utils/db-check';
import {
    RegisterInput,
    LoginInput,
    VerifyEmailInput,
    ForgotPasswordInput,
    ResetPasswordInput,
} from '../validators/auth.validator';

export class AuthController {
    async checkDb(req: Request, res: Response) {
        try {
            const result = await checkDatabaseConnection();
            const userCount = await prisma.user.count();
            
            if (result.connected) {
                return sendSuccess(res, `Connected! Users in DB: ${userCount}`, { ...result, userCount });
            } else {
                return sendError(res, `${result.message}: ${result.error}`, 500);
            }
        } catch (error: any) {
            return sendError(res, `DB Error: ${error.message}`, 500);
        }
    }

    async register(req: Request, res: Response, _next: NextFunction) {
        try {
            console.log('Register controller called');
            const data: RegisterInput = req.body;

            // Extract uploaded files from multer
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const result = await authService.register(data, files);

            // Inline response to debug sendSuccess issue
            return res.status(201).json({
                success: true,
                message: result.message,
                data: { userId: result.userId }
            });
        } catch (error: any) {
            console.error('ERROR:', error.message);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyEmail(req: Request, res: Response, _next: NextFunction) {
        try {
            const data: VerifyEmailInput = req.body;
            const result = await authService.verifyEmail(data);
            return sendSuccess(res, result.message);
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }

    async login(req: Request, res: Response, _next: NextFunction) {
        try {
            const data: LoginInput = req.body;
            const result = await authService.login(data);

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return sendSuccess(res, 'Login successful', {
                accessToken: result.accessToken,
                user: result.user,
            });
        } catch (error: any) {
            return sendError(res, error.message, 401);
        }
    }

    async refreshToken(req: Request, res: Response, _next: NextFunction) {
        try {
            // Get refresh token from cookie or body
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return sendError(res, 'Refresh token not provided', 401);
            }

            const result = await authService.refreshToken({ refreshToken });

            // Update refresh token cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return sendSuccess(res, 'Token refreshed successfully', {
                accessToken: result.accessToken,
            });
        } catch (error: any) {
            return sendError(res, error.message, 401);
        }
    }

    async logout(req: AuthRequest, res: Response, _next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (refreshToken) {
                await authService.logout(userId, refreshToken);
            }

            // Clear cookie
            res.clearCookie('refreshToken');

            return sendSuccess(res, 'Logged out successfully');
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }

    async forgotPassword(req: Request, res: Response, _next: NextFunction) {
        try {
            const data: ForgotPasswordInput = req.body;
            const result = await authService.forgotPassword(data);
            return sendSuccess(res, result.message);
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }

    async resetPassword(req: Request, res: Response, _next: NextFunction) {
        try {
            const data: ResetPasswordInput = req.body;
            const result = await authService.resetPassword(data);
            return sendSuccess(res, result.message);
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }

    async getProfile(req: AuthRequest, res: Response, _next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const user = await authService.getProfile(userId);
            return sendSuccess(res, 'Profile retrieved successfully', user);
        } catch (error: any) {
            return sendError(res, error.message, 404);
        }
    }

    async updateProfile(req: AuthRequest, res: Response, _next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const { name, phone, email } = req.body;

            let avatar = undefined;
            if (req.file) {
                avatar = await uploadService.uploadFile(req.file, 'avatars');
            }

            const user = await authService.updateProfile(userId, { name, phone, avatar, email });
            return sendSuccess(res, 'تم تحديث الملف الشخصي بنجاح', user);
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }

    async changePassword(req: AuthRequest, res: Response, _next: NextFunction) {
        try {
            const userId = req.user!.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return sendError(res, 'يجب تزويد كلمة المرور الحالية والجديدة', 400);
            }

            const result = await authService.changePassword(userId, { currentPassword, newPassword });
            
            // Clear refresh token cookie on password change
            res.clearCookie('refreshToken');
            
            return sendSuccess(res, result.message);
        } catch (error: any) {
            return sendError(res, error.message, 400);
        }
    }
}

export default new AuthController();
