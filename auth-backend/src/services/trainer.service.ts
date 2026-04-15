import { EnrollmentStatus, AnnouncementAudience } from '@prisma/client';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import notificationService from './notification.service';
import { mailerService } from './mailer.service';
import { whatsAppService } from './whatsapp.service';

class TrainerService {
    /**
     * Get dashboard stats + upcoming sessions + pending room bookings for a trainer
     */
    async getDashboard(userId: string) {
        const now = new Date();

        // All courses belonging to this trainer (including all statuses as requested)
        const courses = await prisma.course.findMany({
            where: { trainerId: userId },
            select: { id: true, title: true, status: true, maxStudents: true, startDate: true, endDate: true },
        });

        const courseIds = courses.map(c => c.id);

        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;

        // Total earnings from enrollments (Approved payments only)
        const totalEarningsResult = await prisma.payment.aggregate({
            where: {
                status: 'APPROVED',
                enrollment: {
                    course: { trainerId: userId }
                }
            },
            _sum: { amount: true }
        });
        const totalEarnings = Number(totalEarningsResult._sum.amount || 0);

        // Total enrolled students across all trainer courses (All cases)
        const totalStudents = await prisma.enrollment.count({
            where: {
                courseId: { in: courseIds },
                deletedAt: null, // Still exclude permanently deleted ones
            },
        });

        // Total sessions
        const totalSessions = await prisma.session.count({
            where: { courseId: { in: courseIds } },
        });

        // Upcoming sessions (scheduled, in the future)
        const upcomingSessionsRaw = await prisma.session.findMany({
            where: {
                courseId: { in: courseIds },
                status: 'SCHEDULED',
                startTime: { gte: now },
            },
            orderBy: { startTime: 'asc' },
            take: 5,
            include: {
                course: { select: { title: true, enrollments: { where: { status: { in: ['ACTIVE', 'PRELIMINARY', 'PENDING_PAYMENT', 'COMPLETED'] } }, select: { id: true } } } },
                room: { select: { name: true } },
            },
        });

        const upcomingSessions = upcomingSessionsRaw.map(s => ({
            id: s.id,
            title: s.topic || 'جلسة تدريبية',
            courseTitle: s.course.title,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type.toLowerCase(),
            room: s.room?.name ?? null,
            meetingLink: s.meetingLink ?? null,
            enrolledStudents: s.course.enrollments.length,
        }));

        // Pending room bookings requested by this trainer
        const pendingBookingsRaw = await prisma.roomBooking.findMany({
            where: {
                requestedById: userId,
                status: { in: ['PENDING_APPROVAL', 'PENDING_PAYMENT'] },
            },
            orderBy: { startDate: 'asc' },
            include: {
                room: { select: { name: true } },
                course: { select: { title: true } },
                sessions: { take: 1, orderBy: { startTime: 'asc' }, select: { topic: true } },
            },
        });

        const pendingRoomBookings = pendingBookingsRaw.map(b => ({
            id: b.id,
            courseTitle: b.course?.title ?? '—',
            sessionTitle: b.sessions[0]?.topic ?? b.purpose ?? 'حجز قاعة',
            requestedDate: b.startDate,
            duration: (() => {
                const start = new Date(b.defaultStartTime);
                const end = new Date(b.defaultEndTime);
                return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
            })(),
            requestedRoom: b.room.name,
            status: b.status.toLowerCase(),
        }));

        return {
            stats: {
                totalCourses,
                activeCourses,
                totalStudents,
                totalSessions,
                totalEarnings,
                upcomingSessions: upcomingSessions.length,
                pendingRoomBookings: pendingRoomBookings.length,
            },
            upcomingSessions,
            pendingRoomBookings,
        };
    }

    /**
     * Get publicly browsable active courses (for explore page)
     */
    async getExploreCourses() {
        const courses = await prisma.course.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            include: {
                trainer: { select: { name: true, avatar: true } },
                institute: { 
                    select: { 
                        name: true, 
                        logo: true,
                        user: { select: { avatar: true } }
                    } 
                },
                category: { select: { name: true } },
                enrollments: {
                    where: { status: { in: ['ACTIVE', 'PRELIMINARY', 'PENDING_PAYMENT'] } },
                    select: { id: true },
                },
                sessions: { select: { id: true, type: true } },
            },
        });

        // Gather all staffTrainerIds to fetch in a single query
        const allStaffIds = [...new Set(courses.flatMap(c => (c as any).staffTrainerIds as string[] || []))];
        const staffMap = new Map<string, { name: string }>();
        if (allStaffIds.length > 0) {
            const staffList = await prisma.instituteStaff.findMany({
                where: { id: { in: allStaffIds } },
                select: { id: true, name: true }
            });
            staffList.forEach(s => staffMap.set(s.id, s));
        }

        const categories = await prisma.courseCategory.findMany({
            orderBy: { name: 'asc' },
        });

        return {
            courses: courses.map(c => {
                const staffTrainerIds = (c as any).staffTrainerIds as string[] || [];
                const staffTrainers = staffTrainerIds.map(id => ({ name: staffMap.get(id)?.name ?? '—' }));

                return {
                    id: c.id,
                    title: c.title,
                    description: c.description ?? '',
                    shortDescription: c.shortDescription ?? '',
                    category: c.category?.name ?? 'عام',
                    image: c.image ?? null,
                    studentsCount: c.enrollments.length,
                    sessionsCount: c.sessions.length,
                    duration: `${c.duration} ساعة`,
                    trainer: {
                        name: c.trainer?.name ?? staffTrainers[0]?.name ?? c.institute?.name ?? '—',
                        avatar: c.trainer?.avatar ?? c.institute?.logo ?? c.institute?.user?.avatar ?? null,
                    },
                    staffTrainers, // قائمة جميع المدربين
                    price: Number(c.price),
                    deliveryType: c.sessions[0]?.type === 'ONLINE' ? 'online'
                        : c.sessions[0]?.type === 'IN_PERSON' ? 'in_person'
                            : c.sessions.length > 0 ? 'hybrid' : 'online',
                    startDate: c.startDate,
                    createdAt: c.createdAt,
                };
            }),
            categories: [{ id: 'all', name: 'الكل' }, ...categories.map(c => ({ id: c.id, name: c.name }))],
        };
    }

    /**
     * Get trainer bank accounts
     */
    async getBankAccounts(userId: string) {
        return prisma.bankAccount.findMany({
            where: { trainerId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Add a bank account for trainer
     */
    async addBankAccount(userId: string, data: { bankName: string; accountName: string; accountNumber: string; iban?: string }) {
        return prisma.bankAccount.create({
            data: {
                ...data,
                trainerId: userId,
            },
        });
    }

    /**
     * Update trainer bank account
     */
    async updateBankAccount(userId: string, accountId: string, data: { bankName?: string; accountName?: string; accountNumber?: string; iban?: string; isActive?: boolean }) {
        const account = await prisma.bankAccount.findFirst({
            where: { id: accountId, trainerId: userId },
        });

        if (!account) {
            throw new Error('لم يتم العثور على حساب البنك المخصص للتحديث');
        }

        return prisma.bankAccount.update({
            where: { id: accountId },
            data,
        });
    }

    /**
     * Delete a trainer bank account
     */
    async deleteBankAccount(userId: string, accountId: string) {
        const account = await prisma.bankAccount.findFirst({
            where: { id: accountId, trainerId: userId },
        });

        if (!account) {
            throw new Error('لم يتم العثور على الحساب المخصص للحذف');
        }

        await prisma.bankAccount.delete({
            where: { id: accountId },
        });
    }

    /**
     * Get all categories
     */
    async getCategories() {
        return prisma.courseCategory.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        });
    }

    /**
     * Create a new category
     */
    async createCategory(name: string) {
        // Generate a simple slug from the name
        const slug = name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '');
        return prisma.courseCategory.create({
            data: { name, slug: slug || `category-${Date.now()}` },
            select: { id: true, name: true }
        });
    }

    /**
     * Get all courses created by this trainer
     */
    async getCourses(userId: string) {
        const courses = await prisma.course.findMany({
            where: { trainerId: userId },
            include: {
                category: { select: { name: true } },
                _count: { select: { enrollments: true } },
                roomBookings: {
                    select: { status: true, rejectionReason: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map(c => {
            const latestBooking = c.roomBookings[0];
            let displayStatus = c.status.toLowerCase();
            if (latestBooking?.status === 'PENDING_PAYMENT') displayStatus = 'payment_required';
            else if (latestBooking?.status === 'PENDING_APPROVAL') displayStatus = 'pending_approval';

            return {
                id: c.id,
                title: c.title,
                shortDescription: c.shortDescription ?? '',
                description: c.description ?? '',
                image: c.image ?? null,
                price: Number(c.price),
                startDate: c.startDate,
                endDate: c.endDate,
                maxStudents: c.maxStudents,
                minStudents: c.minStudents,
                enrolledStudents: c._count.enrollments,
                status: displayStatus,
                rejectionReason: latestBooking?.rejectionReason ?? null,
                category: c.category?.name ?? '—',
                createdAt: c.createdAt,
                prerequisites: c.prerequisites ? c.prerequisites.split('\n') : [],
                objectives: c.objectives ?? [],
                tags: c.tags ?? [],
            };
        });
    }

    /**
     * Get a single course by ID (must belong to this trainer)
     */
    async getTrainerCourseById(userId: string, courseId: string) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId },
            include: {
                category: { select: { id: true, name: true } },
                _count: { select: { enrollments: true } },
                roomBookings: {
                    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
        });

        if (!course) throw new Error('الدورة غير موجودة أو لا تنتمي لهذا المدرب');

        return {
            id: course.id,
            title: course.title,
            shortDescription: course.shortDescription ?? '',
            description: course.description ?? '',
            image: course.image ?? null,
            price: Number(course.price),
            duration: course.duration,
            startDate: course.startDate,
            endDate: course.endDate,
            maxStudents: course.maxStudents,
            minStudents: course.minStudents,
            status: course.status.toLowerCase(),
            enrolledStudents: course._count.enrollments,
            category: course.category?.name ?? '',
            categoryId: course.categoryId ?? '',
            prerequisites: course.prerequisites ? course.prerequisites.split('\n').filter(Boolean) : [],
            objectives: course.objectives ?? [],
            tags: course.tags ?? [],
            roomBooking: course.roomBookings[0] ? {
                id: course.roomBookings[0].id,
                status: course.roomBookings[0].status.toLowerCase(),
                rejectionReason: course.roomBookings[0].rejectionReason,
                totalPrice: Number(course.roomBookings[0].totalPrice),
                payment: course.roomBookings[0].payments[0] ? {
                    id: course.roomBookings[0].payments[0].id,
                    status: course.roomBookings[0].payments[0].status.toLowerCase(),
                    amount: Number(course.roomBookings[0].payments[0].amount),
                    receipt: course.roomBookings[0].payments[0].depositSlipImage
                } : null
            } : null,
            createdAt: course.createdAt,
        };
    }

    /**
     * Update a course that belongs to this trainer
     */
    async updateTrainerCourse(userId: string, courseId: string, data: any) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId },
        });
        if (!course) throw new Error('الدورة غير موجودة أو لا تنتمي لهذا المدرب');

        // Build update data
        const updateData: any = {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
            ...(data.image !== undefined && { image: data.image }),
            ...(data.price !== undefined && { price: Number(data.price) }),
            ...(data.duration !== undefined && { duration: Number(data.duration) }),
            ...(data.maxStudents !== undefined && { maxStudents: Number(data.maxStudents) }),
            ...(data.startDate && { startDate: new Date(data.startDate) }),
            ...(data.endDate && { endDate: new Date(data.endDate) }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
            ...(data.status && {
                status: (data.status.toUpperCase() === 'ACTIVE' && data.deliveryType === 'in_person')
                    ? 'PENDING_REVIEW'
                    : data.status.toUpperCase()
            }),
            ...(data.objectives !== undefined && { objectives: data.objectives ?? [] }),
            ...(data.prerequisites !== undefined && { prerequisites: data.prerequisites?.length ? data.prerequisites.join('\n') : null }),
            ...(data.tags !== undefined && { tags: data.tags ?? [] }),
        };

        const updated = await prisma.course.update({
            where: { id: courseId },
            data: updateData,
        });

        // If publishing (ACTIVE or PENDING_REVIEW) with sessions payload, create sessions
        if ((data.status?.toUpperCase() === 'ACTIVE' || data.status?.toUpperCase() === 'PENDING_REVIEW') && Array.isArray(data.sessions) && data.sessions.length > 0) {
            const sessionType = data.deliveryType === 'online' ? 'ONLINE' : 'IN_PERSON';
            const mappedSessions = data.sessions.map((s: any) => ({
                startTime: new Date(`${s.date}T${s.startTime}`),
                endTime: new Date(`${s.date}T${s.endTime}`),
                type: sessionType,
                status: 'SCHEDULED' as const,
                location: s.location || '',
                meetingLink: s.meetingLink || null,
                topic: s.topic || '',
                courseId,
            }));

            // Delete old sessions for this course first
            await prisma.session.deleteMany({ where: { courseId } });

            if (data.hallId && data.paymentReceiptPath) {
                // In-person: create room booking + payment + sessions linked to booking
                const room = await prisma.room.findUnique({ where: { id: data.hallId } });
                if (!room) throw new Error('القاعة غير موجودة');

                const totalHours = mappedSessions.reduce((acc: number, s: any) => {
                    return acc + (s.endTime.getTime() - s.startTime.getTime()) / 3600000;
                }, 0);
                const totalPrice = totalHours * Number(room.pricePerHour);
                const sortedSessions = [...mappedSessions].sort((a: any, b: any) => a.startTime - b.startTime);

                const roomBooking = await prisma.roomBooking.create({
                    data: {
                        bookingMode: 'CUSTOM_TIME',
                        startDate: sortedSessions[0].startTime,
                        endDate: sortedSessions[sortedSessions.length - 1].endTime,
                        selectedDays: [],
                        defaultStartTime: sortedSessions[0].startTime,
                        defaultEndTime: sortedSessions[0].endTime,
                        status: 'PENDING_APPROVAL',
                        totalPrice,
                        roomId: room.id,
                        requestedById: userId,
                        courseId,
                        purpose: `حجز لدورة: ${updated.title}`
                    }
                });

                await prisma.payment.create({
                    data: {
                        amount: totalPrice,
                        currency: 'YER',
                        depositSlipImage: data.paymentReceiptPath,
                        notes: `إيصال دفع لحجز قاعة (${room.name})`,
                        status: 'PENDING_REVIEW',
                        roomBookingId: roomBooking.id
                    }
                });

                await prisma.session.createMany({
                    data: mappedSessions.map((s: any) => ({
                        ...s,
                        roomBookingId: roomBooking.id,
                        roomId: room.id,
                    }))
                });
            } else {
                // Online or capacity_based: just create sessions
                await prisma.session.createMany({ data: mappedSessions });
            }
        }

        return updated;
    }

    /**
     * Delete a course that belongs to this trainer
     */
    async deleteCourse(userId: string, courseId: string) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId },
        });
        if (!course) throw new Error('الدورة غير موجودة أو لا تنتمي لهذا المدرب');

        // Delete associated sessions, room bookings, etc. (cascading handled by Prisma or manual)
        // Note: In this schema, we might want to check for enrollments first.
        const enrollmentCount = await prisma.enrollment.count({ where: { courseId } });
        if (enrollmentCount > 0) {
            throw new Error('لا يمكن حذف دورة بها طلاب مسجلون. يرجى إلغاء تسجيل الطلاب أولاً.');
        }

        return prisma.course.delete({
            where: { id: courseId },
        });
    }

    /**
     * Get all students enrolled in a course that belongs to this trainer
     */
    async getCourseStudents(userId: string, courseId: string) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId },
            select: { id: true, title: true, maxStudents: true },
        });

        if (!course) throw new Error('الدورة غير موجودة أو لا تنتمي لهذا المدرب');

        const enrollments = await prisma.enrollment.findMany({
            where: { courseId, deletedAt: null },
            include: {
                student: {
                    select: { id: true, name: true, email: true, phone: true },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });

        return {
            course: { id: course.id, title: course.title, maxStudents: course.maxStudents },
            enrollments: enrollments.map(e => ({
                id: e.id,
                studentId: e.studentId,
                courseId: e.courseId,
                enrolledAt: e.enrolledAt,
                status: e.status.toLowerCase(),
                student: {
                    id: e.student.id,
                    name: e.student.name,
                    email: e.student.email,
                    phone: e.student.phone,
                },
            })),
        };
    }


    /**
     * Create an announcement for students (ALL, COURSE or SINGLE_USER) from a trainer.
     * Uses direct courseId lookup to avoid nested Prisma filter issues.
     */
    async createStudentAnnouncement(userId: string, data: {
        title: string;
        message: string;
        recipientId?: string;
        courseId?: string;
        category?: string;
        status?: string;
        scheduledAt?: string;
    }) {
        console.log(`[Announcement-Trainer] Trainer ${userId} initiating announcement to: ${data.recipientId ?? (data.courseId ?? 'ALL')}`);

        // STRICTLY INDEPENDENT TRAINER LOOKUP: Fetch only courses owned by this specific trainer User ID
        const trainerCourses = await prisma.course.findMany({ 
            where: { trainerId: userId }, 
            select: { id: true } 
        });
        let courseIds = trainerCourses.map((c: any) => c.id);

        if (data.courseId) {
            if (courseIds.includes(data.courseId)) {
                courseIds = [data.courseId];
            } else {
                throw new Error("الدورة المحددة غير تابعة لك");
            }
        }

        console.log(`[Announcement-Trainer] Trainer owns ${courseIds.length} targeted courses`);

        if (data.recipientId) {
            // Target specific student
            console.log(`[Announcement-Trainer] Verifying enrollment for target student ${data.recipientId}`);
            const isEnrolled = courseIds.length > 0
                ? await prisma.enrollment.findFirst({ 
                    where: { 
                        studentId: data.recipientId, 
                        courseId: { in: courseIds },
                        deletedAt: null
                    } 
                })
                : null;
            
            if (!isEnrolled) {
                console.warn(`[Announcement-Trainer] TARGET_ERROR: Student ${data.recipientId} is NOT enrolled in any of trainer ${userId}'s courses`);
                throw new Error('الطالب المحدد غير مسجل في أي من دوراتك المستقلة');
            }

            const student = await prisma.user.findUnique({ where: { id: data.recipientId } });
            if (!student) throw new Error('الطالب المستهدف غير موجود في النظام');

            const trainer = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { name: true, phone: true, email: true }
            });

            const contactFooter = `\n\n---\n👤 المرسل: ${trainer?.name || 'المدرب'}\n${trainer?.phone ? `📞 الجوال: ${trainer.phone}\n` : ''}${trainer?.email ? `✉️ البريد: ${trainer.email}` : ''}`;
            const fullMessage = data.message + contactFooter;

            // 1. Create Announcement Record
            const announcement = await (prisma.announcement.create as any)({
                data: {
                    title: data.title,
                    message: fullMessage,
                    targetAudience: 'SINGLE_USER',
                    senderId: userId,
                    recipientId: data.recipientId,
                    courseId: data.courseId || null,
                    category: (data.category?.toUpperCase() as any) || 'GENERAL',
                    status: (data.status?.toUpperCase() as any) || (data.scheduledAt ? 'SCHEDULED' : 'SENT'),
                    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                    sentAt: data.scheduledAt ? null : new Date(),
                    createdAt: new Date()
                }
            });

            // 2. Create Platform Notification (Only if SENT)
            if (announcement.status === 'SENT') {
                await prisma.notification.create({
                    data: {
                        userId: data.recipientId,
                        type: 'NEW_ANNOUNCEMENT' as any,
                        title: data.title,
                        message: fullMessage,
                        relatedEntityId: announcement.id
                    }
                });
            }

            // 3. Dispatch Email (Only if SENT)
            if (announcement.status === 'SENT' && student.email) {
                console.log(`[Announcement-Trainer] Dispatching email to: ${student.email}`);
                mailerService.sendAnnouncementEmail(
                    student.email,
                    student.name,
                    data.title,
                    data.message,
                    {
                        name: trainer?.name || 'المدرب',
                        phone: trainer?.phone,
                        email: trainer?.email
                    }
                )
                    .then(() => console.log(`[Announcement-Trainer] Email delivered successfully`))
                    .catch((err: any) => console.error(`[Announcement-Trainer] Email delivery FAILED:`, err));
            }
            return announcement;
        } else {
            // Target Audience (ALL students of this trainer)
            const trainer = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { name: true, phone: true, email: true }
            });

            const contactFooter = `\n\n---\n👤 المرسل: ${trainer?.name || 'المدرب'}\n${trainer?.phone ? `📞 الجوال: ${trainer.phone}\n` : ''}${trainer?.email ? `✉️ البريد: ${trainer.email}` : ''}`;
            const fullMessage = data.message + contactFooter;

            const announcement = await (prisma.announcement.create as any)({
                data: {
                    title: data.title,
                    message: fullMessage,
                    targetAudience: data.courseId ? 'STUDENTS' : 'ALL',
                    senderId: userId,
                    courseId: data.courseId || null,
                    category: (data.category?.toUpperCase() as any) || 'GENERAL',
                    status: (data.status?.toUpperCase() as any) || (data.scheduledAt ? 'SCHEDULED' : 'SENT'),
                    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
                    sentAt: data.scheduledAt ? null : new Date(),
                    createdAt: new Date()
                }
            });

            if (courseIds.length === 0) {
                console.log(`[Announcement-Trainer] Broadcast skipped: Trainer has no courses.`);
                return announcement;
            }

            const activeStudents = await prisma.enrollment.findMany({
                where: { 
                    courseId: { in: courseIds }, 
                    status: { in: ['ACTIVE', 'COMPLETED', 'PRELIMINARY', 'PENDING_PAYMENT'] }, 
                    deletedAt: null 
                },
                select: { student: { select: { id: true, name: true, email: true } } },
                distinct: ['studentId']
            });

            console.log(`[Announcement-Trainer] Broadcasting to ${activeStudents.length} students`);

            if (activeStudents.length > 0) {
                // Create platform notifications in bulk
                await prisma.notification.createMany({
                    data: activeStudents.map((s: any) => ({ 
                        userId: s.student.id, 
                        type: 'NEW_ANNOUNCEMENT' as any, 
                        title: data.title, 
                        message: fullMessage, 
                        relatedEntityId: announcement.id 
                    })),
                    skipDuplicates: true
                });

                // Fire-and-forget emails
                for (const { student } of activeStudents as any[]) {
                    if (student.email) {
                        mailerService.sendAnnouncementEmail(
                            student.email, 
                            student.name, 
                            data.title, 
                            data.message, 
                            { 
                                name: trainer?.name || 'المدرب', 
                                phone: trainer?.phone, 
                                email: trainer?.email 
                            }
                        ).catch((e: any) => console.error(`[Announcement-Trainer] Bulk email error:`, e));
                    }
                }
            }
            return announcement;
        }
    }

    /**
     * Get all announcements sent by this trainer
     */
    async getAnnouncements(userId: string) {
        const announcements = await (prisma.announcement as any).findMany({
            where: { senderId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true } },
                recipient: { select: { id: true, name: true } },
                course: { select: { id: true, title: true } },
            }
        });

        return announcements.map((a: any) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            targetAudience: a.targetAudience?.toLowerCase(),
            category: a.category?.toLowerCase(),
            status: a.status?.toLowerCase(),
            scheduledAt: a.scheduledAt,
            sentAt: a.sentAt,
            createdAt: a.createdAt,
            courseId: a.courseId,
            course: a.course,
            sender: a.sender,
            recipient: a.recipient,
        }));
    }

    /**
     * Update an announcement (only if it belongs to this trainer)
     */
    async updateAnnouncement(userId: string, announcementId: string, data: { title?: string; message?: string }) {
        const existing = await (prisma.announcement as any).findFirst({
            where: { id: announcementId, senderId: userId }
        });
        if (!existing) throw new Error('الإعلان غير موجود أو لا تملك صلاحية تعديله');

        return (prisma.announcement as any).update({
            where: { id: announcementId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.message && { message: data.message }),
            }
        });
    }

    /**
     * Delete an announcement (only if it belongs to this trainer)
     */
    async deleteAnnouncement(userId: string, announcementId: string) {
        const existing = await (prisma.announcement as any).findFirst({
            where: { id: announcementId, senderId: userId }
        });
        if (!existing) throw new Error('الإعلان غير موجود أو لا تملك صلاحية حذفه');

        await (prisma.announcement as any).delete({ where: { id: announcementId } });
        return { success: true };
    }

    /**
     * Unenroll (cancel) a student from a trainer’s course
     */
    async unenrollStudent(userId: string, courseId: string, enrollmentId: string, reason: string) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId },
        });
        if (!course) throw new Error('الدورة غير موجودة أو لا تنتمي لهذا المدرب');

        const result = await prisma.$transaction(async (tx) => {
            // Delete associated payments
            await tx.payment.deleteMany({
                where: { enrollmentId: enrollmentId }
            });

            // Update enrollment status
            const updatedEnrollment = await tx.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: reason,
                },
                include: { student: { select: { id: true, name: true, email: true, phone: true } }, course: { select: { title: true } } }
            });

            return { updatedEnrollment };
        });

        // ── Notify student about the cancellation ──────────────
        const student = result.updatedEnrollment.student;
        const courseTitle = result.updatedEnrollment.course.title;

        await notificationService.createNotification({
            userId: student.id,
            type: 'ENROLLMENT_REJECTED',
            title: 'تم إلغاء تسجيلك',
            message: `تم إلغاء تسجيلك في دورة "${courseTitle}". السبب: ${reason}`,
            relatedEntityId: enrollmentId,
            actionUrl: '/student/my-courses',
            emailFn: student.email ? () => mailerService.sendEnrollmentRejected(student.email!, student.name, courseTitle, reason) : undefined,
            whaFn: student.phone ? () => whatsAppService.notifyEnrollmentRejected(student.phone!, student.name, courseTitle, reason) : undefined,
        });

        return result.updatedEnrollment;
    }

    /**
     * Get a single ACTIVE course by ID for public viewing
     */
    async getPublicCourseById(courseId: string) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, status: 'ACTIVE' },
            include: {
                trainer: {
                    select: {
                        name: true,
                        avatar: true,
                        email: true,
                        phone: true,
                        trainerProfile: {
                            select: { bio: true, specialties: true }
                        },
                        bankAccounts: {
                            select: {
                                id: true,
                                bankName: true,
                                accountName: true,
                                accountNumber: true,
                                iban: true,
                                isActive: true,
                            }
                        }
                    }
                },
                category: { select: { name: true } },
                sessions: {
                    where: { status: { not: 'CANCELLED' } },
                    orderBy: { startTime: 'asc' },
                    include: { room: { select: { id: true, name: true, location: true } } },
                },
                enrollments: {
                    where: { status: { in: ['ACTIVE', 'PRELIMINARY', 'PENDING_PAYMENT'] } },
                    select: { id: true },
                },
                institute: {
                    select: {
                        name: true,
                        logo: true,
                        email: true,
                        phone: true,
                        description: true,
                        user: { select: { avatar: true } },
                        bankAccounts: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                bankName: true,
                                accountName: true,
                                accountNumber: true,
                                iban: true,
                                isActive: true,
                            }
                        }
                    }
                },
            }
        });

        if (!course) throw new Error('الدورة غير موجودة أو غير نشطة');

        // Fetch all staff trainers if staffTrainerIds is set (now multi-trainer only)
        const staffTrainerIds = (course as any).staffTrainerIds as string[] | undefined;
        let staffTrainers: { id: string; name: string; bio: string | null; email: string | null; phone: string | null; specialties: string[] }[] = [];
        if (staffTrainerIds && staffTrainerIds.length > 0) {
            const staffList = await prisma.instituteStaff.findMany({
                where: { id: { in: staffTrainerIds } },
                select: { id: true, name: true, bio: true, email: true, phone: true, specialties: true }
            });
            staffTrainers = staffList;
        }

        return {
            id: course.id,
            title: course.title,
            category: (course as any).category?.name ?? 'عام',
            shortDescription: course.shortDescription ?? '',
            description: course.description ?? '',
            image: course.image ?? null,
            price: Number(course.price),
            startDate: course.startDate,
            endDate: course.endDate,
            maxStudents: course.maxStudents,
            enrolledCount: (course as any).enrollments.length,
            prerequisites: course.prerequisites
                ? course.prerequisites.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                : [],
            objectives: course.objectives,
            tags: course.tags,
            deliveryType: (course as any).sessions[0]?.type === 'ONLINE' ? 'online'
                : (course as any).sessions[0]?.type === 'IN_PERSON' ? 'in_person'
                    : (course as any).sessions.length > 0 ? 'hybrid' : 'online',
            sessions: (course as any).sessions.map((s: any) => ({
                id: s.id,
                topic: s.topic ?? null,
                startTime: s.startTime,
                endTime: s.endTime,
                type: s.type.toLowerCase(),
                status: s.status,
                meetingLink: s.meetingLink ?? null,
                location: s.location ?? null,
                roomId: s.roomId ?? null,
                room: s.room ? { id: s.room.id, name: s.room.name, location: s.room.location ?? null } : null,
            })),
            staffTrainers, // قائمة جميع المدربين
            institute: (course.trainerId === null && (course as any).institute) ? {
                name: (course as any).institute.name,
                logo: (course as any).institute.logo,
                email: (course as any).institute.email,
                phone: (course as any).institute.phone,
                description: (course as any).institute.description,
            } : null,
            instructor: {
                name: (course as any).trainer?.name ?? (staffTrainers.length > 0 ? staffTrainers[0].name : ((course as any).institute?.name ?? 'مدرب')),
                avatar: (course as any).trainer?.avatar ?? ((course as any).institute?.logo ?? (course as any).institute?.user?.avatar ?? null),
                email: (course as any).trainer?.email ?? (staffTrainers.length > 0 ? staffTrainers[0].email : ((course as any).institute?.email ?? null)),
                phone: (course as any).trainer?.phone ?? (staffTrainers.length > 0 ? staffTrainers[0].phone : ((course as any).institute?.phone ?? null)),
                bio: (course as any).trainer?.trainerProfile?.bio ?? (staffTrainers.length > 0 ? staffTrainers[0].bio : ((course as any).institute?.description ?? null)),
                specialties: (course as any).trainer?.trainerProfile?.specialties ?? (staffTrainers.length > 0 ? staffTrainers[0].specialties : []),
                bankAccounts: (course as any).trainer?.bankAccounts ?? (course as any).institute?.bankAccounts ?? [],
            },
        };
    }

    /**
     * Get all active halls across all institutes
     */
    async getHalls() {
        return prisma.room.findMany({
            where: { isActive: true },
            include: {
                institute: {
                    select: {
                        id: true,
                        name: true,
                        bankAccounts: {
                            where: { isActive: true },
                            select: { id: true, bankName: true, accountName: true, accountNumber: true, iban: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getHallById(hallId: string) {
        const room = await prisma.room.findFirst({
            where: { id: hallId, isActive: true },
            include: {
                institute: {
                    include: {
                        user: { select: { avatar: true } },
                        bankAccounts: {
                            where: { isActive: true },
                            select: { id: true, bankName: true, accountName: true, accountNumber: true, iban: true }
                        }
                    }
                }
            }
        });

        if (!room) throw new Error("القاعة غير موجودة أو غير نشطة");

        return {
            ...room,
            instituteName: room.institute?.name,
            instituteDescription: room.institute?.description,
            instituteLogo: room.institute?.logo || room.institute?.user?.avatar,
            bankAccounts: room.institute?.bankAccounts || [],
        };
    }

    /**
     * Get availability for a specific hall (no ownership check)
     * Returns:
     *   - availability: the hall's defined working hours schedule
     *   - bookedSessions: all time ranges that are already taken (from both Sessions and RoomBookings)
     */
    async getHallAvailability(hallId: string) {
        const room = await prisma.room.findFirst({
            where: { id: hallId, isActive: true },
        });

        if (!room) throw new Error("القاعة غير موجودة أو غير نشطة");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // 1. Get all active RoomBookings for this room (any non-cancelled status)
        const activeRoomBookings = await prisma.roomBooking.findMany({
            where: {
                roomId: room.id,
                status: { not: 'CANCELLED' },
                endDate: { gte: yesterday },
            },
            select: { id: true, defaultStartTime: true, defaultEndTime: true, startDate: true, endDate: true }
        });

        const activeBookingIds = activeRoomBookings.map(rb => rb.id);

        // 2. Get all sessions tied directly to this room OR via a room booking
        const sessions = await prisma.session.findMany({
            where: {
                status: { not: 'CANCELLED' },
                startTime: { gte: yesterday },
                OR: [
                    { roomId: room.id },
                    { roomBookingId: { in: activeBookingIds } }
                ]
            },
            select: { startTime: true, endTime: true }
        });

        // 3. For RoomBookings that have NO sessions yet (e.g. PENDING_APPROVAL without sessions)
        //    we still block the booking's defaultStartTime..defaultEndTime on each day in range
        const sessionBookingIds = new Set(
            (await prisma.session.findMany({
                where: { roomBookingId: { in: activeBookingIds } },
                select: { roomBookingId: true }
            })).map(s => s.roomBookingId)
        );

        const bookingsWithoutSessions = activeRoomBookings.filter(rb => !sessionBookingIds.has(rb.id));

        // Expand bookings without sessions into a list of {startTime, endTime} per day in their range
        const extraBlocked: { startTime: Date; endTime: Date }[] = [];
        for (const rb of bookingsWithoutSessions) {
            const cursor = new Date(rb.startDate);
            const end = new Date(rb.endDate);
            while (cursor <= end) {
                const dateStr = cursor.toISOString().substring(0, 10);
                const sTime = rb.defaultStartTime.toISOString().substring(11, 16); // HH:MM
                const eTime = rb.defaultEndTime.toISOString().substring(11, 16);
                extraBlocked.push({
                    startTime: new Date(`${dateStr}T${sTime}:00`),
                    endTime: new Date(`${dateStr}T${eTime}:00`),
                });
                cursor.setDate(cursor.getDate() + 1);
            }
        }

        return {
            availability: (room as any).availability,
            bookedSessions: [...sessions, ...extraBlocked]
        };
    }

    /**
     * Book a hall directly without creating a course
     */
    async bookHall(trainerId: string, hallId: string, sessions: { date: string; slot: number }[], receiptFile?: string, notes?: string) {
        const room = await prisma.room.findFirst({
            where: { id: hallId, isActive: true }
        });

        if (!room) {
            throw new Error('القاعة غير موجودة أو غير متاحة');
        }

        if (!sessions || sessions.length === 0) {
            throw new Error('يجب تحديد موعد واحد على الأقل للحجز');
        }

        // Sort sessions by date and slot
        const sortedSessions = [...sessions].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.slot - b.slot;
        });

        const startDate = new Date(sortedSessions[0].date);
        const endDate = new Date(sortedSessions[sortedSessions.length - 1].date);

        // Calculate total hours
        const totalHours = sessions.length;
        const totalAmount = Number(room.pricePerHour) * totalHours;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Room Booking
            const roomBooking = await tx.roomBooking.create({
                data: {
                    roomId: hallId,
                    requestedById: trainerId,
                    bookingMode: 'CUSTOM_TIME',
                    totalPrice: totalAmount,
                    startDate,
                    endDate,
                    defaultStartTime: new Date(`${startDate.toISOString().substring(0, 10)}T08:00:00`),
                    defaultEndTime: new Date(`${endDate.toISOString().substring(0, 10)}T18:00:00`),
                    status: receiptFile ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT',
                    notes: notes || 'حجز مباشر للقاعة من قبل المدرب'
                }
            });

            // 2. Create individual Sessions
            const createdSessions = await Promise.all(sessions.map(s => {
                const sDate = s.date;
                const startTime = new Date(`${sDate}T${String(s.slot).padStart(2, '0')}:00:00`);
                const endTime = new Date(`${sDate}T${String(s.slot + 1).padStart(2, '0')}:00:00`);
                return tx.session.create({
                    data: {
                        roomId: hallId,
                        roomBookingId: roomBooking.id,
                        type: 'IN_PERSON',
                        startTime,
                        endTime,
                        status: 'SCHEDULED'
                    }
                });
            }));

            // 3. Create Payment record if receipt provided
            if (receiptFile) {
                await tx.payment.create({
                    data: {
                        amount: totalAmount,
                        currency: 'YER',
                        status: 'PENDING_REVIEW',
                        depositSlipImage: receiptFile,
                        notes: 'تحويل بنكي لحجز مباشر',
                        roomBookingId: roomBooking.id
                    }
                });
            }

            return {
                roomBooking,
                sessions: createdSessions
            };
        });

        // ── Notify Institute of new booking request ──
        const institute = await prisma.institute.findUnique({
            where: { id: room.instituteId },
            include: { user: { select: { id: true, name: true, email: true, phone: true } } }
        });
        const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { name: true } });

        if (institute && trainer && result.roomBooking) {
            await notificationService.createNotification({
                userId: institute.user.id,
                type: 'NEW_BOOKING_REQUEST',
                title: 'طلب حجز قاعة جديد',
                message: `طلب المدرب ${trainer.name} حجز قاعة "${room.name}"`,
                relatedEntityId: result.roomBooking.id,
                actionUrl: '/institute/room-bookings',
                emailFn: institute.user.email ? () => mailerService.sendNewBookingRequest(institute.user.email!, institute.user.name, trainer.name, room.name) : undefined,
                whaFn: institute.user.phone ? () => whatsAppService.notifyNewBookingRequest(institute.user.phone!, institute.user.name, trainer.name, room.name) : undefined
            });
        }

        return result;

    }

    /**
     * Create a new course (Trainer)
     * Handles standard courses, or "in_person" courses where a hall is booked and a payment receipt is required.
     */
    async createCourse(userId: string, data: any, paymentReceiptPath?: string) {
        // Validate Trainer
        const trainer = await prisma.user.findUnique({
            where: { id: userId, role: 'TRAINER' }
        });
        if (!trainer) throw new Error("لم يتم العثور على المدرب");

        const sessionType = data.deliveryType === "online" ? "ONLINE" : "IN_PERSON";

        const mappedSessions = (data.sessions || []).map((session: any) => ({
            startTime: new Date(`${session.date}T${session.startTime}`),
            endTime: new Date(`${session.date}T${session.endTime}`),
            type: sessionType,
            status: "SCHEDULED" as const,
            location: session.location,
            meetingLink: session.meetingLink || data.meetingLink || null,
            topic: session.topic || "",
        }));

        let finalStartDate = new Date(data.startDate || Date.now());
        let finalEndDate = new Date(data.endDate || Date.now());

        if (mappedSessions.length > 0) {
            const sortedSessions = [...mappedSessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            finalStartDate = sortedSessions[0].startTime;
            finalEndDate = sortedSessions[sortedSessions.length - 1].endTime;
        }

        let instituteId = data.instituteId;
        if (!instituteId && data.hallId) {
            // Need to derive institute from the selected hall
            const room = await prisma.room.findUnique({ where: { id: data.hallId } });
            if (!room) throw new Error("القاعة المحددة غير موجودة");
            instituteId = room.instituteId;
        }

        // 1. Create Course
        const course = await prisma.course.create({
            data: {
                title: data.title,
                description: data.description,
                shortDescription: data.shortDescription,
                price: Number(data.price),
                duration: Number(data.duration),
                startDate: finalStartDate,
                endDate: finalEndDate,
                maxStudents: Number(data.maxStudents),
                minStudents: Number(data.minStudents) || 1,
                status: (data.status === 'ACTIVE' && sessionType === 'IN_PERSON') ? 'PENDING_REVIEW' : (data.status || 'DRAFT'),
                image: data.image,
                trainerId: trainer.id,
                instituteId: instituteId || null,
                categoryId: data.categoryId,
                objectives: data.objectives || [],
                prerequisites: data.prerequisites ? data.prerequisites.join('\n') : null,
                tags: data.tags || [],
                sessions: data.hallId ? undefined : {
                    create: mappedSessions
                }
            }
        });

        // 2. Create Room Booking & Payment (if physical hall selected)
        if (data.hallId && mappedSessions.length >= 0) {
            if (!paymentReceiptPath) {
                // Technically shouldn't happen due to frontend validation, but protecting backend
                throw new Error("يجب إرفاق إيصال الدفع لحجز القاعة");
            }

            const room = await prisma.room.findUnique({ where: { id: data.hallId } });
            if (!room) throw new Error("القاعة المحددة غير موجودة");

            const totalHours = mappedSessions.reduce((acc: number, session: any) => {
                const diffMs = session.endTime.getTime() - session.startTime.getTime();
                return acc + (diffMs / (1000 * 60 * 60));
            }, 0);

            const totalPrice = totalHours * Number(room.pricePerHour);

            const roomBooking = await prisma.roomBooking.create({
                data: {
                    bookingMode: "CUSTOM_TIME",
                    startDate: finalStartDate,
                    endDate: finalEndDate,
                    selectedDays: [],
                    defaultStartTime: mappedSessions[0]?.startTime || new Date(),
                    defaultEndTime: mappedSessions[0]?.endTime || new Date(),
                    status: "PENDING_APPROVAL", // Pending Institute Owner approval
                    totalPrice: totalPrice,
                    roomId: room.id,
                    requestedById: userId,
                    courseId: course.id,
                    purpose: `حجز لدورة المدرب: ${course.title}`
                }
            });

            // Create Payment Request
            await prisma.payment.create({
                data: {
                    amount: totalPrice,
                    currency: "YER", // Defaulting to Yemen Rial
                    depositSlipImage: paymentReceiptPath,
                    notes: `إيصال دفع لقيمة حجز قاعة (${room.name}) للدورة (${course.title})`,
                    status: "PENDING_REVIEW",
                    roomBookingId: roomBooking.id
                }
            });

            // Associate sessions with both Course and RoomBooking
            if (mappedSessions.length > 0) {
                await prisma.session.createMany({
                    data: mappedSessions.map((session: any) => ({
                        ...session,
                        courseId: course.id,
                        roomBookingId: roomBooking.id,
                        roomId: room.id
                    }))
                });
            }

            // ── Notify Institute of new booking request ──
            const institute = await prisma.institute.findUnique({
                where: { id: room.instituteId },
                include: { user: { select: { id: true, name: true, email: true, phone: true } } }
            });

            if (institute && trainer && roomBooking) {
                await notificationService.createNotification({
                    userId: institute.user.id,
                    type: 'NEW_BOOKING_REQUEST',
                    title: 'طلب حجز قاعة جديد',
                    message: `طلب المدرب ${trainer.name} حجز قاعة "${room.name}" لدورة "${course.title}"`,
                    relatedEntityId: roomBooking.id,
                    actionUrl: '/institute/room-bookings',
                    emailFn: institute.user.email ? () => mailerService.sendNewBookingRequest(institute.user.email!, institute.user.name, trainer.name, room.name) : undefined,
                    whaFn: institute.user.phone ? () => whatsAppService.notifyNewBookingRequest(institute.user.phone!, institute.user.name, trainer.name, room.name) : undefined
                });
            }
        }

        return course;
    }

    /**
     * Get the trainer's own profile (user + trainerProfile)
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                createdAt: true,
                trainerProfile: {
                    select: {
                        bio: true,
                        cvUrl: true,
                        specialties: true,
                        certificatesUrls: true,
                        verificationStatus: true,
                    },
                },
            },
        });

        if (!user) throw new Error('المستخدم غير موجود');

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            avatar: user.avatar ?? null,
            role: user.role.toLowerCase(),
            status: user.status.toLowerCase(),
            createdAt: user.createdAt,
            bio: user.trainerProfile?.bio ?? '',
            cvUrl: user.trainerProfile?.cvUrl ?? null,
            specialties: user.trainerProfile?.specialties ?? [],
            certificatesUrls: user.trainerProfile?.certificatesUrls ?? [],
            verificationStatus: user.trainerProfile?.verificationStatus ?? null,
        };
    }

    /**
     * Update the trainer's own profile (name, phone, bio, specialties, email)
     */
    async updateProfile(userId: string, data: { name?: string; phone?: string; bio?: string; specialties?: string[]; avatarPath?: string; email?: string }) {
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

        // Update base user fields
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.avatarPath && { avatar: data.avatarPath }),
                ...(data.email && { email: data.email }),
            },
        });

        // Update trainer profile fields
        await prisma.trainerProfile.upsert({
            where: { userId },
            create: {
                userId,
                bio: data.bio ?? '',
                specialties: data.specialties ?? [],
                certificatesUrls: [],
            },
            update: {
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.specialties !== undefined && { specialties: data.specialties }),
            },
        });

        return this.getProfile(userId);
    }

    /**
     * Change password — validates old password before updating
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('المستخدم غير موجود');

        const isValid = await comparePassword(currentPassword, user.password);
        if (!isValid) throw new Error('كلمة المرور الحالية غير صحيحة');

        const hashed = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed, failedLoginAttempts: 0, lockUntil: null },
        });

        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }

    /**
     * Get all unique students enrolled in any of this trainer's courses
     */
    async getAllStudents(userId: string) {
        // Get all trainer course IDs (all statuses as requested)
        const courses = await prisma.course.findMany({
            where: {
                trainerId: userId,
            },
            select: { id: true, title: true },
        });
        const courseIds = courses.map(c => c.id);
        const courseMap = Object.fromEntries(courses.map(c => [c.id, c.title]));

        if (courseIds.length === 0) return { students: [], totalStudents: 0, totalEnrollments: 0, totalEarnings: 0 };

        // Get all enrollments for these courses (All cases, excluding deleted ones)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: { in: courseIds },
                deletedAt: null,
            },
            select: {
                id: true,
                courseId: true,
                status: true,
                enrolledAt: true,
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        deletedAt: true,
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });

        // Calculate total earnings for these students (Approved payments only)
        const earningsResult = await prisma.payment.aggregate({
            where: {
                status: 'APPROVED',
                enrollment: {
                    courseId: { in: courseIds }
                }
            },
            _sum: { amount: true }
        });
        const totalEarnings = Number(earningsResult._sum.amount || 0);

        // Group enrollments by student
        const studentMap = new Map<string, {
            id: string; name: string; email: string; phone: string | null; avatar: string | null;
            enrolledCourses: { courseId: string; courseTitle: string; enrollmentId: string; status: string; enrolledAt: Date }[];
            lastActivity: Date;
        }>();

        for (const e of enrollments) {
            const s = e.student;
            // Skip soft-deleted students
            if (s.deletedAt) continue;

            if (!studentMap.has(s.id)) {
                studentMap.set(s.id, {
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    phone: s.phone,
                    avatar: s.avatar,
                    enrolledCourses: [],
                    lastActivity: e.enrolledAt,
                });
            }
            const entry = studentMap.get(s.id)!;
            entry.enrolledCourses.push({
                courseId: e.courseId,
                courseTitle: courseMap[e.courseId] ?? '',
                enrollmentId: e.id,
                status: e.status.toLowerCase(),
                enrolledAt: e.enrolledAt,
            });
            if (e.enrolledAt > entry.lastActivity) entry.lastActivity = e.enrolledAt;
        }

        const students = Array.from(studentMap.values()).map(s => ({
            ...s,
            enrollments: s.enrolledCourses, // Add alias for frontend compatibility
            totalCourses: s.enrolledCourses.length,
        }));

        return {
            students,
            totalStudents: students.length,
            totalEnrollments: enrollments.length,
            totalEarnings,
        };
    }

    /**
     * Resubmit a rejected hall booking payment
     */
    async resubmitBookingPayment(userId: string, courseId: string, bookingId: string, paymentReceiptPath: string) {
        // 1. Validate Ownership and rejection status
        const booking = await prisma.roomBooking.findFirst({
            where: {
                id: bookingId,
                courseId: courseId,
                requestedById: userId,
                status: 'REJECTED'
            }
        });

        if (!booking) throw new Error("لم يتم العثور على طلب الحجز المرفوض");

        // 2. Update Booking Status back to PENDING_APPROVAL
        const updatedBooking = await prisma.roomBooking.update({
            where: { id: bookingId },
            data: {
                status: 'PENDING_APPROVAL',
                rejectionReason: null // Clear previous reason
            }
        });

        // 3. Create a NEW payment request
        await prisma.payment.create({
            data: {
                amount: booking.totalPrice,
                currency: "YER",
                depositSlipImage: paymentReceiptPath,
                notes: `إعادة إرسال إيصال الدفع بعد الرفض لطلب الحجز (${bookingId})`,
                status: "PENDING_REVIEW",
                roomBookingId: bookingId
            }
        });

        return updatedBooking;
    }

    /**
     * Get enrollments for courses owned by this trainer
     */
    async getEnrollments(trainerId: string) {
        return prisma.enrollment.findMany({
            where: {
                course: {
                    trainerId: trainerId
                }
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        price: true
                    }
                },
                payments: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                enrolledAt: 'desc'
            }
        });
    }

    /**
     * Update enrollment status (Accept/Reject)
     */
    async updateEnrollmentStatus(trainerId: string, enrollmentId: string, status: 'ACTIVE' | 'CANCELLED' | 'REJECT_PAYMENT', reason?: string) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                id: enrollmentId,
                course: {
                    trainerId: trainerId
                }
            },
            include: {
                payments: true,
                course: true
            }
        });

        if (!enrollment) {
            throw new Error('التسجيل غير موجود أو لا تنتمي لدوراتك');
        }

        if (status === 'REJECT_PAYMENT') {
            const latestPayment = enrollment.payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            if (!latestPayment || latestPayment.status !== 'PENDING_REVIEW') {
                throw new Error('لا يوجد دفعة معلقة للمراجعة');
            }

            await prisma.payment.update({
                where: { id: latestPayment.id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: trainerId,
                    reviewedAt: new Date(),
                    rejectionReason: reason || 'تم الرفض من قبل المدرب'
                }
            });

            return { ...enrollment, status: enrollment.status, paymentStatus: 'REJECTED' };
        }

        let targetStatus: EnrollmentStatus = status;
        // If trainer accepts a PRELIMINARY enrollment, move it to PENDING_PAYMENT if course is not free
        if (status === 'ACTIVE' && enrollment.status === 'PRELIMINARY') {
            const price = Number(enrollment.course.price);
            if (price > 0) {
                targetStatus = 'PENDING_PAYMENT';
            }
        }

        const updateData: any = { status: targetStatus };
        if (reason) {
            updateData.cancellationReason = reason;
        }

        const updatedEnrollment = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: updateData
        });

        // If status is ACTIVE, approve the latest payment as well if it's pending review
        if (status === 'ACTIVE' && enrollment.payments.length > 0) {
            const latestPayment = enrollment.payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

            if (latestPayment && latestPayment.status === 'PENDING_REVIEW') {
                await prisma.payment.update({
                    where: { id: latestPayment.id },
                    data: {
                        status: 'APPROVED',
                        reviewedBy: trainerId,
                        reviewedAt: new Date(),
                        notes: 'تم القبول من قبل المدرب'
                    }
                });
            }
        }

        // ── Notify student about the enrollment status change ──────────────
        const student = await prisma.user.findUnique({ where: { id: enrollment.studentId }, select: { name: true, email: true, phone: true } });
        const courseTitle = enrollment.course.title;

        if (student) {
            if (targetStatus === 'PENDING_PAYMENT') {
                // Preliminary acceptance
                await notificationService.createNotification({
                    userId: enrollment.studentId,
                    type: 'ENROLLMENT_PRELIMINARY_ACCEPTED',
                    title: 'تم قبولك مبدئياً',
                    message: `تم قبول طلبك مبدئياً في دورة "${courseTitle}". يرجى إكمال عملية الدفع.`,
                    relatedEntityId: enrollmentId,
                    actionUrl: '/student/my-courses',
                    emailFn: student.email ? () => mailerService.sendEnrollmentPreliminaryAccepted(student.email!, student.name, courseTitle) : undefined,
                    whaFn: student.phone ? () => whatsAppService.notifyEnrollmentPreliminaryAccepted(student.phone!, student.name, courseTitle) : undefined,
                });
            } else if (targetStatus === 'ACTIVE') {
                // Final acceptance (free course direct)
                await notificationService.createNotification({
                    userId: enrollment.studentId,
                    type: 'ENROLLMENT_FINAL_ACCEPTED',
                    title: 'تم قبولك نهائياً',
                    message: `تهانينا! تم تأكيد تسجيلك في دورة "${courseTitle}".`,
                    relatedEntityId: enrollmentId,
                    actionUrl: '/student/my-courses',
                    emailFn: student.email ? () => mailerService.sendEnrollmentFinalAccepted(student.email!, student.name, courseTitle) : undefined,
                    whaFn: student.phone ? () => whatsAppService.notifyEnrollmentFinalAccepted(student.phone!, student.name, courseTitle) : undefined,
                });
                // Also notify payment approval if there was a payment
                if (enrollment.payments.length > 0) {
                    await notificationService.createNotification({
                        userId: enrollment.studentId,
                        type: 'PAYMENT_APPROVED',
                        title: 'تم قبول دفعتك',
                        message: `تم التحقق من دفعتك لدورة "${courseTitle}" والموافقة عليها.`,
                        relatedEntityId: enrollmentId,
                        actionUrl: '/student/my-courses',
                        emailFn: student.email ? () => mailerService.sendPaymentApproved(student.email!, student.name, courseTitle) : undefined,
                        whaFn: student.phone ? () => whatsAppService.notifyPaymentApproved(student.phone!, student.name, courseTitle) : undefined,
                    });
                }
            } else if (targetStatus === 'CANCELLED') {
                // Enrollment rejected/cancelled
                await notificationService.createNotification({
                    userId: enrollment.studentId,
                    type: 'ENROLLMENT_REJECTED',
                    title: 'تم رفض تسجيلك',
                    message: `نأسف، تم رفض تسجيلك في دورة "${courseTitle}".${reason ? ` السبب: ${reason}` : ''}`,
                    relatedEntityId: enrollmentId,
                    actionUrl: '/student/my-courses',
                    emailFn: student.email ? () => mailerService.sendEnrollmentRejected(student.email!, student.name, courseTitle, reason) : undefined,
                    whaFn: student.phone ? () => whatsAppService.notifyEnrollmentRejected(student.phone!, student.name, courseTitle, reason) : undefined,
                });
            }
        }

        // Handle payment rejection notification
        if ((status as string) === 'REJECT_PAYMENT' && student) {
            await notificationService.createNotification({
                userId: enrollment.studentId,
                type: 'PAYMENT_REJECTED',
                title: 'تم رفض إيصال الدفع',
                message: `تم رفض سند الدفع لدورة "${courseTitle}".${reason ? ` السبب: ${reason}` : ''} يرجى إعادة الرفع.`,
                relatedEntityId: enrollmentId,
                actionUrl: '/student/my-courses',
                emailFn: student.email ? () => mailerService.sendPaymentRejected(student.email!, student.name, courseTitle, reason) : undefined,
                whaFn: student.phone ? () => whatsAppService.notifyPaymentRejected(student.phone!, student.name, courseTitle, reason) : undefined,
            });
        }

        return updatedEnrollment;
    }

    /**
     * Get all room bookings requested by this trainer
     */
    async getRoomBookings(userId: string) {
        return prisma.roomBooking.findMany({
            where: { requestedById: userId },
            include: {
                room: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                        type: true,
                        facilities: true,
                        image: true,
                        description: true,
                        location: true,
                        institute: { select: { name: true } }
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                sessions: {
                    select: {
                        id: true,
                        topic: true,
                        startTime: true,
                        endTime: true
                    },
                    orderBy: { startTime: 'asc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Cancel a room booking and its associated course and sessions
     */
    async cancelBooking(trainerId: string, courseId: string, bookingId: string) {
        const booking = await prisma.roomBooking.findUnique({
            where: { id: bookingId },
            include: { course: true }
        });

        if (!booking) {
            throw new Error('طلب الحجز غير موجود');
        }

        if (booking.requestedById !== trainerId) {
            throw new Error('غير مصرح لك بإلغاء هذا الحجز');
        }

        if (booking.courseId !== courseId) {
            throw new Error('طلب الحجز لا ينتمي لهذه الدورة');
        }

        return await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.roomBooking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' }
            });

            if (booking.courseId) {
                await tx.course.update({
                    where: { id: booking.courseId },
                    data: { status: 'CANCELLED' }
                });

                await tx.session.updateMany({
                    where: { courseId: booking.courseId },
                    data: { status: 'CANCELLED' }
                });
            }

            return updatedBooking;
        });
    }

    /**
     * Cancel a direct room booking not linked to any course
     */
    async cancelDirectBooking(trainerId: string, bookingId: string) {
        const booking = await prisma.roomBooking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new Error('طلب الحجز غير موجود');
        }

        if (booking.requestedById !== trainerId) {
            throw new Error('غير مصرح لك بإلغاء هذا الحجز');
        }

        return await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.roomBooking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' }
            });

            // Cancel any sessions tied to this booking
            await tx.session.updateMany({
                where: { roomBookingId: bookingId },
                data: { status: 'CANCELLED' }
            });

            return updatedBooking;
        });
    }

    /**
     * Get all sessions for all courses owned by this trainer
     */
    async getSchedule(userId: string) {
        // First get all courses belonging to this trainer
        const courses = await prisma.course.findMany({
            where: { trainerId: userId },
            select: { id: true, title: true }
        });

        const courseIds = courses.map(c => c.id);

        if (courseIds.length === 0) return [];

        // Get all sessions for these courses
        const sessions = await prisma.session.findMany({
            where: {
                courseId: { in: courseIds }
            },
            include: {
                room: { select: { name: true } },
                course: {
                    select: {
                        title: true,
                        enrollments: {
                            where: { status: { in: ['ACTIVE', 'PRELIMINARY', 'PENDING_PAYMENT'] } },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        return sessions.map(s => ({
            id: s.id,
            title: s.topic || 'جلسة تدريبية',
            courseId: s.courseId ?? null,
            courseTitle: s.course.title,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type.toLowerCase(),
            status: s.status.toLowerCase(),
            meetingLink: s.meetingLink,
            location: s.room?.name || s.location || (s.type === 'ONLINE' ? 'أونلاين' : 'غير محدد'),
            enrolledStudents: s.course.enrollments.length,
            roomId: s.roomId ?? null
        }));
    }

    /**
     * Reschedule or cancel a session belonging to this trainer
     */
    async updateSession(userId: string, sessionId: string, data: { startTime?: Date; endTime?: Date; status?: string; meetingLink?: string; updateAll?: boolean }) {
        // Get all course IDs for this trainer
        const courses = await prisma.course.findMany({
            where: { trainerId: userId },
            select: { id: true }
        });
        const courseIds = courses.map(c => c.id);

        const session = await prisma.session.findFirst({
            where: { id: sessionId, courseId: { in: courseIds } }
        });
        if (!session) throw new Error('الجلسة غير موجودة أو لا تنتمي إليك');

        // Conflict check for reschedule with a hall
        if ((data.startTime || data.endTime) && session.roomId) {
            const newStart = data.startTime ?? session.startTime;
            const newEnd = data.endTime ?? session.endTime;

            // 1. Check for other sessions
            const sessionConflict = await prisma.session.findFirst({
                where: {
                    id: { not: sessionId },
                    roomId: session.roomId,
                    status: { not: 'CANCELLED' },
                    startTime: { lt: newEnd },
                    endTime: { gt: newStart }
                }
            });
            if (sessionConflict) throw new Error('هذا الوقت محجوز بالفعل بواسطة جلسة أخرى في نفس القاعة');

            // 2. Check for blanket RoomBookings (those without sessions yet)
            const bookingConflict = await prisma.roomBooking.findFirst({
                where: {
                    roomId: session.roomId,
                    status: { in: ['APPROVED', 'PENDING_PAYMENT'] },
                    sessions: { none: {} }, // Blanket booking
                    startDate: { lte: newEnd },
                    endDate: { gte: newStart }
                }
            });
            
            if (bookingConflict) {
                // Check if the times also overlap (approximated for simplicity)
                if (bookingConflict.defaultStartTime.getHours() < newEnd.getHours() && 
                    bookingConflict.defaultEndTime.getHours() > newStart.getHours()) {
                    throw new Error('هذا الوقت محجوز بالفعل ضمن حجز قاعة كلي');
                }
            }
        }

        if (data.updateAll && data.meetingLink !== undefined && session.courseId) {
            await prisma.session.updateMany({
                where: { courseId: session.courseId },
                data: { meetingLink: data.meetingLink }
            });
        }
        
        // If moved outside RoomBooking range, expand the range
        if (data.startTime && session.roomBookingId) {
            const booking = await prisma.roomBooking.findUnique({ where: { id: session.roomBookingId } });
            if (booking) {
                const updates: any = {};
                if (data.startTime < booking.startDate) updates.startDate = data.startTime;
                if ((data.endTime ?? session.endTime) > booking.endDate) updates.endDate = data.endTime ?? session.endTime;
                
                if (Object.keys(updates).length > 0) {
                    await prisma.roomBooking.update({
                        where: { id: booking.id },
                        data: updates
                    });
                }
            }
        }

        return prisma.session.update({
            where: { id: sessionId },
            data: {
                ...(data.startTime && { startTime: data.startTime }),
                ...(data.endTime && { endTime: data.endTime }),
                ...(data.status && { status: data.status as any }),
                ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink })
            }
        });
    }

}

export default new TrainerService();
