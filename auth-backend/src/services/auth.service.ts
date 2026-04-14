import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import {
    generateAccessToken,
    generateRefreshToken,
    generateRandomToken,
    generateOTP,
    hashToken,
    verifyRefreshToken,
} from '../utils/jwt';
import { config } from '../config';
import { mailerService } from './mailer.service';
import { uploadService } from './upload.service';
import {
    RegisterInput,
    LoginInput,
    VerifyEmailInput,
    RefreshTokenInput,
    ForgotPasswordInput,
    ResetPasswordInput,
} from '../validators/auth.validator';

export class AuthService {
    // Register new user
    async register(data: RegisterInput, files?: { cv?: Express.Multer.File[]; certificates?: Express.Multer.File[]; licenseDocument?: Express.Multer.File[] }) {
        const { name, email, password, phone } = data;
        const role = (data.role as string)?.toUpperCase() || 'STUDENT';

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Determine user status based on role
        // Students are ACTIVE immediately, trainers and institute admins need approval
        const userStatus = (role === 'TRAINER' || role === 'INSTITUTE_ADMIN')
            ? 'PENDING_VERIFICATION'
            : 'ACTIVE';

        // Create user with transaction to include profile if needed
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone,
                role: role || 'STUDENT',
                status: userStatus,
                emailVerified: true, // Auto-verify for now, can enable email verification later
            },
        });

        // Create role-specific profiles with uploaded files
        if (role === 'TRAINER' && files) {
            const cvUrl = files.cv?.[0] ? await uploadService.uploadFile(files.cv[0], 'trainers/cvs') : undefined;
            const certificatesUrls = files.certificates 
                ? await Promise.all(files.certificates.map(file => uploadService.uploadFile(file, 'trainers/certificates'))) 
                : [];

            await prisma.trainerProfile.create({
                data: {
                    userId: user.id,
                    cvUrl,
                    certificatesUrls,
                    specialties: [],
                    verificationStatus: 'PENDING',
                },
            });
        } else if (role === 'INSTITUTE_ADMIN' && files) {
            const licenseDocumentUrl = files.licenseDocument?.[0] ? await uploadService.uploadFile(files.licenseDocument[0], 'institutes/licenses') : undefined;

            await prisma.institute.create({
                data: {
                    userId: user.id,
                    name: name, // Use user name as institute name initially
                    licenseDocumentUrl,
                    verificationStatus: 'PENDING',
                },
            });
        }

        // Generate email verification token (if email verification is enabled)
        const verificationToken = generateRandomToken();
        const tokenHash = hashToken(verificationToken);

        await prisma.token.create({
            data: {
                userId: user.id,
                tokenHash,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // In production, send email with verificationToken
        console.log('📧 Email Verification Token:', verificationToken);

        // Return different messages based on role
        const message = (role === 'TRAINER' || role === 'INSTITUTE_ADMIN')
            ? 'تم التسجيل بنجاح. حسابك قيد المراجعة من قبل مدير المنصة.'
            : 'تم التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني.';

        return {
            message,
            userId: user.id,
        };
    }

    // Verify email
    async verifyEmail(data: VerifyEmailInput) {
        const { token } = data;
        const tokenHash = hashToken(token);

        // Find token
        const tokenRecord = await prisma.token.findFirst({
            where: {
                tokenHash,
                type: 'EMAIL_VERIFICATION',
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        if (!tokenRecord) {
            throw new Error('Invalid or expired verification token');
        }

        // Update user
        await prisma.user.update({
            where: { id: tokenRecord.userId },
            data: {
                emailVerified: true,
                status: 'ACTIVE',
            },
        });

        // Delete token
        await prisma.token.delete({
            where: { id: tokenRecord.id },
        });

        return { message: 'Email verified successfully' };
    }

    // Login
    async login(data: LoginInput) {
        const { email, password } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            const remainingTime = Math.ceil(
                (user.lockUntil.getTime() - Date.now()) / 60000
            );
            throw new Error(
                `Account locked. Try again in ${remainingTime} minutes.`
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            // Increment failed attempts
            const failedAttempts = user.failedLoginAttempts + 1;
            const lockUntil =
                failedAttempts >= config.security.maxLoginAttempts
                    ? new Date(Date.now() + config.security.lockTimeMinutes * 60000)
                    : null;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: failedAttempts,
                    lockUntil,
                },
            });

            if (lockUntil) {
                throw new Error(
                    `Too many failed attempts. Account locked for ${config.security.lockTimeMinutes} minutes.`
                );
            }

            throw new Error('Invalid credentials');
        }

        // Check if email is verified
        // TEMPORARILY DISABLED FOR DEVELOPMENT
        // TODO: Re-enable email verification in production
        /*
        if (!user.emailVerified) {
            throw new Error('Please verify your email before logging in');
        }
        */

        // Check user status and verification for trainers/institutes
        if (user.status === 'PENDING_VERIFICATION') {
            throw new Error('حسابك قيد المراجعة من قبل مدير المنصة. يرجى الانتظار للموافقة.');
        }

        if (user.status === 'SUSPENDED') {
            throw new Error('تم تعليق حسابك. يرجى التواصل مع الدعم الفني.');
        }

        // Check trainer profile verification status
        if (user.role === 'TRAINER') {
            const trainerProfile = await prisma.trainerProfile.findUnique({
                where: { userId: user.id },
            });

            if (trainerProfile?.verificationStatus === 'PENDING') {
                throw new Error('ملفك الشخصي كمدرب قيد المراجعة. يرجى الانتظار لموافقة الإدارة.');
            }

            if (trainerProfile?.verificationStatus === 'REJECTED') {
                throw new Error(`تم رفض ملفك الشخصي كمدرب. السبب: ${trainerProfile.rejectionReason || 'غير محدد'}`);
            }
        }

        // Check institute verification status
        if (user.role === 'INSTITUTE_ADMIN') {
            const institute = await prisma.institute.findUnique({
                where: { userId: user.id },
            });

            if (institute?.verificationStatus === 'PENDING') {
                throw new Error('الجهة التدريبية قيد المراجعة. يرجى الانتظار لموافقة الإدارة.');
            }

            if (institute?.verificationStatus === 'REJECTED') {
                throw new Error(`تم رفض الجهة التدريبية. السبب: ${institute.rejectionReason || 'غير محدد'}`);
            }
        }

        // Reset failed attempts
        if (user.failedLoginAttempts > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockUntil: null,
                },
            });
        }

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Store refresh token hash
        const refreshTokenHash = hashToken(refreshToken);
        await prisma.token.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHash,
                type: 'REFRESH',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
            },
        };
    }

    // Refresh token
    async refreshToken(data: RefreshTokenInput) {
        const { refreshToken } = data;

        // Verify token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }

        const tokenHash = hashToken(refreshToken);

        // Check if token exists in DB
        const tokenRecord = await prisma.token.findFirst({
            where: {
                userId: decoded.userId,
                tokenHash,
                type: 'REFRESH',
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!tokenRecord) {
            throw new Error('Invalid or expired refresh token');
        }

        // Delete old refresh token
        await prisma.token.delete({
            where: { id: tokenRecord.id },
        });

        // Generate new tokens
        const tokenPayload = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Store new refresh token
        const newTokenHash = hashToken(newRefreshToken);
        await prisma.token.create({
            data: {
                userId: decoded.userId,
                tokenHash: newTokenHash,
                type: 'REFRESH',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    // Logout
    async logout(userId: string, refreshToken: string) {
        const tokenHash = hashToken(refreshToken);

        // Delete from DB
        await prisma.token.deleteMany({
            where: {
                userId,
                tokenHash,
                type: 'REFRESH',
            },
        });

        return { message: 'Logged out successfully' };
    }

    // Forgot password
    async forgotPassword(data: ForgotPasswordInput) {
        const { email } = data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a reset link will be sent.' };
        }

        // Generate reset token
        const resetToken = generateOTP(6);
        const tokenHash = hashToken(resetToken);

        // Delete any existing reset tokens
        await prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: 'PASSWORD_RESET',
            },
        });

        // Create new reset token
        await prisma.token.create({
            data: {
                userId: user.id,
                tokenHash,
                type: 'PASSWORD_RESET',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            },
        });

        // In production, send email with resetToken
        console.log('🔑 Password Reset Token:', resetToken);
        await mailerService.sendPasswordResetCode(user.email, user.name, resetToken);

        return { message: 'If the email exists, a reset code will be sent.' };
    }

    // Reset password
    async resetPassword(data: ResetPasswordInput) {
        const { token, newPassword } = data;
        const tokenHash = hashToken(token);

        // Find token
        const tokenRecord = await prisma.token.findFirst({
            where: {
                tokenHash,
                type: 'PASSWORD_RESET',
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!tokenRecord) {
            throw new Error('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: tokenRecord.userId },
            data: {
                password: hashedPassword,
                failedLoginAttempts: 0,
                lockUntil: null,
            },
        });

        // Delete reset token
        await prisma.token.delete({
            where: { id: tokenRecord.id },
        });

        // Invalidate all refresh tokens
        await prisma.token.deleteMany({
            where: {
                userId: tokenRecord.userId,
                type: 'REFRESH',
            },
        });

        return { message: 'Password reset successfully' };
    }

    // Get user profile
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                avatar: true,
                phone: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string; email?: string }) {
        // If email is provided, check uniqueness
        if (data.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id: userId }
                }
            });
            if (existingUser) {
                throw new Error('البريد الإلكتروني موجود بالفعل');
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                phone: data.phone,
                avatar: data.avatar,
                email: data.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                avatar: true,
                phone: true,
            },
        });

        if (!user) {
            throw new Error('لم يتم العثور على المستخدم');
        }

        // If user is an institute admin and email changed, update the institute record for consistency
        if (user.role === 'INSTITUTE_ADMIN' && data.email) {
            await prisma.institute.updateMany({
                where: { userId: userId },
                data: { email: data.email }
            });
        }

        return user;
    }

    async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
        const { currentPassword, newPassword } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new Error('كلمة المرور الحالية غير صحيحة');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                failedLoginAttempts: 0,
                lockUntil: null,
            },
        });

        // Invalidate all refresh tokens
        await prisma.token.deleteMany({
            where: {
                userId,
                type: 'REFRESH',
            },
        });

        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }
}

export default new AuthService();
