import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Helper function to create future date
function addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

// Helper function to create past date
function subtractDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

// Helper function to create datetime with specific hours
function createDateTime(days: number, hours: number, minutes: number = 0): Date {
    const date = days >= 0 ? addDays(days) : subtractDays(Math.abs(days));
    date.setHours(hours, minutes, 0, 0);
    return date;
}

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Delete all existing data (in correct order due to foreign keys)
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.roomBooking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.course.deleteMany();
    await prisma.courseCategory.deleteMany();
    await prisma.institute.deleteMany();
    await prisma.trainerProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Common password for all users
    const commonPassword = await hashPassword('Test@123456');

    // ================================================
    // USERS
    // ================================================
    console.log('👥 Creating users...');

    // Platform Admins
    const platformAdmin1 = await prisma.user.create({
        data: {
            name: 'Admin Master',
            email: 'admin@platform.com',
            password: commonPassword,
            phone: '+967777000001',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const platformAdmin2 = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'superadmin@platform.com',
            password: commonPassword,
            phone: '+967777000002',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    // Institute Admins with Institutes
    const instituteAdmin1 = await prisma.user.create({
        data: {
            name: 'Dr. Rami Al-Mansour',
            email: 'rami.admin@test.com',
            password: commonPassword,
            phone: '+967777111001',
            role: 'INSTITUTE_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const instituteAdmin2 = await prisma.user.create({
        data: {
            name: 'Huda Al-Farsi',
            email: 'huda.admin@test.com',
            password: commonPassword,
            phone: '+967777111002',
            role: 'INSTITUTE_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const instituteAdmin3 = await prisma.user.create({
        data: {
            name: 'Samir Al-Hashimi',
            email: 'samir.admin@test.com',
            password: commonPassword,
            phone: '+967777111003',
            role: 'INSTITUTE_ADMIN',
            status: 'SUSPENDED',
            emailVerified: true,
        },
    });

    // Trainers
    const trainer1 = await prisma.user.create({
        data: {
            name: 'Dr. Khaled Rahman',
            email: 'khaled.trainer@test.com',
            password: commonPassword,
            phone: '+967777222001',
            role: 'TRAINER',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const trainer2 = await prisma.user.create({
        data: {
            name: 'Prof. Amina Abdullah',
            email: 'amina.trainer@test.com',
            password: commonPassword,
            phone: '+967777222002',
            role: 'TRAINER',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const trainer3 = await prisma.user.create({
        data: {
            name: 'Dr. Hassan Mahmoud',
            email: 'hassan.trainer@test.com',
            password: commonPassword,
            phone: '+967777222003',
            role: 'TRAINER',
            status: 'SUSPENDED',
            emailVerified: true,
        },
    });

    const trainer4 = await prisma.user.create({
        data: {
            name: 'Dr. Nadia Yousef',
            email: 'nadia.trainer@test.com',
            password: commonPassword,
            phone: '+967777222004',
            role: 'TRAINER',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const trainer5 = await prisma.user.create({
        data: {
            name: 'Prof. Tariq Saeed',
            email: 'tariq.trainer@test.com',
            password: commonPassword,
            phone: '+967777222005',
            role: 'TRAINER',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    // Students
    const student1 = await prisma.user.create({
        data: {
            name: 'Ahmed Ali',
            email: 'ahmed.student@test.com',
            password: commonPassword,
            phone: '+967777333001',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const student2 = await prisma.user.create({
        data: {
            name: 'Sara Hassan',
            email: 'sara.student@test.com',
            password: commonPassword,
            phone: '+967777333002',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const student3 = await prisma.user.create({
        data: {
            name: 'Omar Khalid',
            email: 'omar.student@test.com',
            password: commonPassword,
            phone: '+967777333003',
            role: 'STUDENT',
            status: 'SUSPENDED',
            emailVerified: true,
        },
    });

    const student4 = await prisma.user.create({
        data: {
            name: 'Fatima Noor',
            email: 'fatima.student@test.com',
            password: commonPassword,
            phone: '+967777333004',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const student5 = await prisma.user.create({
        data: {
            name: 'Layla Mohammed',
            email: 'layla.student@test.com',
            password: commonPassword,
            phone: '+967777333005',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const student6 = await prisma.user.create({
        data: {
            name: 'Youssef Ibrahim',
            email: 'youssef.student@test.com',
            password: commonPassword,
            phone: '+967777333006',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const student7 = await prisma.user.create({
        data: {
            name: 'Maryam Saleh',
            email: 'maryam.student@test.com',
            password: commonPassword,
            phone: '+967777333007',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    console.log('✅ Created 17 users\n');

    // ================================================
    // TRAINER PROFILES
    // ================================================
    console.log('👨‍🏫 Creating trainer profiles...');

    await prisma.trainerProfile.create({
        data: {
            userId: trainer1.id,
            bio: 'Experienced software engineering trainer with 10+ years of industry experience.',
            cvUrl: 'https://example.com/cv/khaled.pdf',
            specialties: ['Web Development', 'Mobile Apps', 'Cloud Computing'],
            certificatesUrls: ['https://example.com/cert/khaled-1.pdf', 'https://example.com/cert/khaled-2.pdf'],
            verificationStatus: 'APPROVED',
        },
    });

    await prisma.trainerProfile.create({
        data: {
            userId: trainer2.id,
            bio: 'Data Science and AI specialist with PhD in Machine Learning.',
            cvUrl: 'https://example.com/cv/amina.pdf',
            specialties: ['Machine Learning', 'Data Science', 'Python'],
            certificatesUrls: ['https://example.com/cert/amina-1.pdf'],
            verificationStatus: 'APPROVED',
        },
    });

    await prisma.trainerProfile.create({
        data: {
            userId: trainer3.id,
            bio: 'Cybersecurity expert with extensive experience.',
            specialties: ['Cybersecurity', 'Network Security'],
            verificationStatus: 'REJECTED',
            rejectionReason: 'Insufficient documentation provided',
        },
    });

    await prisma.trainerProfile.create({
        data: {
            userId: trainer4.id,
            bio: 'UI/UX design specialist and creative director.',
            cvUrl: 'https://example.com/cv/nadia.pdf',
            specialties: ['UI Design', 'UX Research', 'Figma', 'Adobe XD'],
            certificatesUrls: ['https://example.com/cert/nadia-1.pdf'],
            verificationStatus: 'APPROVED',
        },
    });

    await prisma.trainerProfile.create({
        data: {
            userId: trainer5.id,
            bio: 'Digital marketing and business strategy consultant.',
            specialties: ['Digital Marketing', 'SEO', 'Social Media'],
            verificationStatus: 'PENDING',
        },
    });

    console.log('✅ Created 5 trainer profiles\n');

    // ================================================
    // INSTITUTES
    // ================================================
    console.log('🏛️  Creating institutes...');

    const institute1 = await prisma.institute.create({
        data: {
            userId: instituteAdmin1.id,
            name: 'Tech Academy Yemen',
            description: 'Leading technology training institute in Yemen',
            email: 'info@techacademy.ye',
            phone: '+967777111001',
            address: 'Sana\'a, Tech District, Building 42',
            licenseNumber: 'LIC-2024-001',
            licenseDocumentUrl: 'https://example.com/licenses/tech-academy.pdf',
            verificationStatus: 'APPROVED',
        },
    });

    const institute2 = await prisma.institute.create({
        data: {
            userId: instituteAdmin2.id,
            name: 'Business Skills Institute',
            description: 'Professional development and business training center',
            email: 'contact@businessskills.ye',
            phone: '+967777111002',
            address: 'Aden, Commercial Hub, Floor 3',
            licenseNumber: 'LIC-2024-002',
            verificationStatus: 'PENDING',
        },
    });

    const institute3 = await prisma.institute.create({
        data: {
            userId: instituteAdmin3.id,
            name: 'Creative Arts Center',
            description: 'Design and creative skills training',
            email: 'hello@creativearts.ye',
            phone: '+967777111003',
            address: 'Taiz, Arts Quarter',
            licenseNumber: 'LIC-2024-003',
            verificationStatus: 'REJECTED',
            rejectionReason: 'License document expired',
        },
    });

    console.log('✅ Created 3 institutes\n');

    // ================================================
    // ROOMS
    // ================================================
    console.log('🚪 Creating rooms...');

    const room1 = await prisma.room.create({
        data: {
            name: 'Main Training Hall A',
            capacity: 30,
            pricePerHour: 50,
            facilities: ['Projector', 'Whiteboard', 'AC', 'WiFi'],
            instituteId: institute1.id,
            isActive: true,
        },
    });

    const room2 = await prisma.room.create({
        data: {
            name: 'Computer Lab 1',
            capacity: 20,
            pricePerHour: 75,
            facilities: ['20 Computers', 'Projector', 'AC', 'WiFi', 'Software Licenses'],
            instituteId: institute1.id,
            isActive: true,
        },
    });

    const room3 = await prisma.room.create({
        data: {
            name: 'Seminar Room B',
            capacity: 15,
            pricePerHour: 40,
            facilities: ['Projector', 'Whiteboard', 'AC'],
            instituteId: institute1.id,
            isActive: true,
        },
    });

    const room4 = await prisma.room.create({
        data: {
            name: 'Conference Hall',
            capacity: 50,
            pricePerHour: 100,
            facilities: ['Projector', 'Sound System', 'AC', 'WiFi', 'Video Conferencing'],
            instituteId: institute2.id,
            isActive: true,
        },
    });

    const room5 = await prisma.room.create({
        data: {
            name: 'Workshop Space',
            capacity: 25,
            pricePerHour: 60,
            facilities: ['Tables', 'Chairs', 'Whiteboard', 'AC'],
            instituteId: institute2.id,
            isActive: false,
        },
    });

    console.log('✅ Created 5 rooms\n');

    // ================================================
    // COURSE CATEGORIES
    // ================================================
    console.log('📚 Creating course categories...');

    const catTech = await prisma.courseCategory.create({
        data: {
            name: 'Technology & Programming',
            slug: 'technology-programming',
            description: 'Software development, web, mobile, and IT courses',
        },
    });

    const catBusiness = await prisma.courseCategory.create({
        data: {
            name: 'Business & Management',
            slug: 'business-management',
            description: 'Business skills, management, and entrepreneurship',
        },
    });

    const catDesign = await prisma.courseCategory.create({
        data: {
            name: 'Design & Creative',
            slug: 'design-creative',
            description: 'UI/UX design, graphic design, and creative arts',
        },
    });

    const catData = await prisma.courseCategory.create({
        data: {
            name: 'Data Science & AI',
            slug: 'data-science-ai',
            description: 'Machine learning, data analytics, and artificial intelligence',
        },
    });

    console.log('✅ Created 4 course categories\n');

    // ================================================
    // COURSES
    // ================================================
    console.log('📖 Creating courses...');

    const course1 = await prisma.course.create({
        data: {
            title: 'Full-Stack Web Development Bootcamp',
            description: 'Comprehensive web development course covering frontend and backend technologies, databases, and deployment.',
            shortDescription: 'Learn full-stack development from scratch',
            price: 500,
            duration: 12,
            startDate: addDays(10),
            endDate: addDays(94),
            minStudents: 5,
            maxStudents: 25,
            status: 'ACTIVE',
            bookingTrigger: 'CAPACITY_BASED',
            objectives: ['Build full-stack web applications', 'Master React and Node.js', 'Deploy to cloud platforms'],
            tags: ['web development', 'react', 'nodejs', 'mongodb'],
            trainerId: trainer1.id,
            instituteId: institute1.id,
            categoryId: catTech.id,
        },
    });

    const course2 = await prisma.course.create({
        data: {
            title: 'Machine Learning Fundamentals',
            description: 'Introduction to machine learning concepts, algorithms, and practical applications using Python.',
            shortDescription: 'Learn ML from the ground up',
            price: 600,
            duration: 10,
            startDate: addDays(15),
            endDate: addDays(85),
            minStudents: 3,
            maxStudents: 20,
            status: 'ACTIVE',
            bookingTrigger: 'IMMEDIATE',
            objectives: ['Understand ML algorithms', 'Build predictive models', 'Use scikit-learn and TensorFlow'],
            tags: ['machine learning', 'python', 'ai', 'data science'],
            trainerId: trainer2.id,
            instituteId: institute1.id,
            categoryId: catData.id,
        },
    });

    const course3 = await prisma.course.create({
        data: {
            title: 'UI/UX Design Masterclass',
            description: 'Complete guide to user interface and user experience design with hands-on projects.',
            shortDescription: 'Master UI/UX design',
            price: 450,
            duration: 8,
            startDate: addDays(20),
            endDate: addDays(76),
            minStudents: 4,
            maxStudents: 15,
            status: 'ACTIVE',
            bookingTrigger: 'IMMEDIATE',
            objectives: ['Design beautiful interfaces', 'Conduct user research', 'Create prototypes in Figma'],
            tags: ['ui design', 'ux design', 'figma', 'prototyping'],
            trainerId: trainer4.id,
            instituteId: institute1.id,
            categoryId: catDesign.id,
        },
    });

    const course4 = await prisma.course.create({
        data: {
            title: 'Digital Marketing Strategy',
            description: 'Learn how to create and execute effective digital marketing campaigns.',
            shortDescription: 'Master digital marketing',
            price: 350,
            duration: 6,
            startDate: subtractDays(10),
            endDate: addDays(32),
            minStudents: 5,
            maxStudents: 30,
            status: 'ACTIVE',
            bookingTrigger: 'IMMEDIATE',
            objectives: ['Build marketing funnels', 'Run social media campaigns', 'Analyze marketing data'],
            tags: ['digital marketing', 'seo', 'social media', 'analytics'],
            trainerId: trainer5.id,
            instituteId: institute2.id,
            categoryId: catBusiness.id,
        },
    });

    const course5 = await prisma.course.create({
        data: {
            title: 'Introduction to Python Programming',
            description: 'Beginner-friendly Python course for aspiring programmers.',
            shortDescription: 'Learn Python from zero',
            price: 250,
            duration: 4,
            startDate: addDays(30),
            endDate: addDays(58),
            minStudents: 3,
            maxStudents: 20,
            status: 'DRAFT',
            bookingTrigger: 'IMMEDIATE',
            objectives: ['Learn Python basics', 'Write clean code', 'Build simple applications'],
            tags: ['python', 'programming', 'beginner'],
            trainerId: trainer1.id,
            instituteId: institute1.id,
            categoryId: catTech.id,
        },
    });

    const course6 = await prisma.course.create({
        data: {
            title: 'Advanced React Development',
            description: 'Deep dive into React patterns, performance optimization, and best practices.',
            shortDescription: 'Advanced React techniques',
            price: 400,
            duration: 6,
            startDate: subtractDays(45),
            endDate: subtractDays(3),
            minStudents: 5,
            maxStudents: 15,
            status: 'COMPLETED',
            bookingTrigger: 'IMMEDIATE',
            objectives: ['Master React hooks', 'Optimize performance', 'Build scalable applications'],
            tags: ['react', 'javascript', 'frontend', 'advanced'],
            trainerId: trainer1.id,
            instituteId: institute1.id,
            categoryId: catTech.id,
        },
    });

    console.log('✅ Created 6 courses\n');

    // ================================================
    // ROOM BOOKINGS
    // ================================================
    console.log('📅 Creating room bookings...');

    const booking1 = await prisma.roomBooking.create({
        data: {
            bookingMode: 'UNIFIED_TIME',
            startDate: addDays(10),
            endDate: addDays(94),
            selectedDays: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
            defaultStartTime: new Date('2024-01-01T09:00:00'),
            defaultEndTime: new Date('2024-01-01T12:00:00'),
            status: 'APPROVED',
            purpose: 'Full-Stack Web Development Bootcamp',
            totalPrice: 12600,
            roomId: room2.id,
            requestedById: instituteAdmin1.id,
            approvedById: platformAdmin1.id,
            courseId: course1.id,
        },
    });

    const booking2 = await prisma.roomBooking.create({
        data: {
            bookingMode: 'UNIFIED_TIME',
            startDate: addDays(15),
            endDate: addDays(85),
            selectedDays: ['MONDAY', 'WEDNESDAY'],
            defaultStartTime: new Date('2024-01-01T14:00:00'),
            defaultEndTime: new Date('2024-01-01T17:00:00'),
            status: 'APPROVED',
            purpose: 'Machine Learning Fundamentals',
            totalPrice: 6300,
            roomId: room2.id,
            requestedById: instituteAdmin1.id,
            approvedById: platformAdmin1.id,
            courseId: course2.id,
        },
    });

    const booking3 = await prisma.roomBooking.create({
        data: {
            bookingMode: 'UNIFIED_TIME',
            startDate: addDays(20),
            endDate: addDays(76),
            selectedDays: ['SATURDAY'],
            defaultStartTime: new Date('2024-01-01T10:00:00'),
            defaultEndTime: new Date('2024-01-01T14:00:00'),
            status: 'APPROVED',
            purpose: 'UI/UX Design Masterclass',
            totalPrice: 3200,
            roomId: room3.id,
            requestedById: instituteAdmin1.id,
            approvedById: platformAdmin1.id,
            courseId: course3.id,
        },
    });

    const booking4 = await prisma.roomBooking.create({
        data: {
            bookingMode: 'UNIFIED_TIME',
            startDate: addDays(5),
            endDate: addDays(12),
            selectedDays: ['SUNDAY', 'MONDAY', 'TUESDAY'],
            defaultStartTime: new Date('2024-01-01T09:00:00'),
            defaultEndTime: new Date('2024-01-01T11:00:00'),
            status: 'PENDING_APPROVAL',
            purpose: 'Workshop on Cloud Computing',
            totalPrice: 1200,
            roomId: room1.id,
            requestedById: trainer1.id,
        },
    });

    const booking5 = await prisma.roomBooking.create({
        data: {
            bookingMode: 'UNIFIED_TIME',
            startDate: addDays(1),
            endDate: addDays(3),
            selectedDays: ['FRIDAY'],
            defaultStartTime: new Date('2024-01-01T15:00:00'),
            defaultEndTime: new Date('2024-01-01T18:00:00'),
            status: 'REJECTED',
            purpose: 'Private coaching session',
            rejectionReason: 'Room already booked for this time slot',
            totalPrice: 300,
            roomId: room1.id,
            requestedById: trainer4.id,
        },
    });

    console.log('✅ Created 5 room bookings\n');

    // ================================================
    // SESSIONS
    // ================================================
    console.log('🎓 Creating sessions...');

    // Sessions for course1 (Full-Stack Web Development)
    await prisma.session.create({
        data: {
            startTime: createDateTime(10, 9, 0),
            endTime: createDateTime(10, 12, 0),
            type: 'IN_PERSON',
            status: 'SCHEDULED',
            courseId: course1.id,
            roomBookingId: booking1.id,
        },
    });

    await prisma.session.create({
        data: {
            startTime: createDateTime(12, 9, 0),
            endTime: createDateTime(12, 12, 0),
            type: 'IN_PERSON',
            status: 'SCHEDULED',
            courseId: course1.id,
            roomBookingId: booking1.id,
        },
    });

    // Sessions for course2 (Machine Learning)
    await prisma.session.create({
        data: {
            startTime: createDateTime(15, 14, 0),
            endTime: createDateTime(15, 17, 0),
            type: 'HYBRID',
            status: 'SCHEDULED',
            meetingLink: 'https://meet.example.com/ml-session-1',
            courseId: course2.id,
            roomBookingId: booking2.id,
        },
    });

    // Online session for course3
    await prisma.session.create({
        data: {
            startTime: createDateTime(20, 10, 0),
            endTime: createDateTime(20, 14, 0),
            type: 'ONLINE',
            status: 'SCHEDULED',
            meetingLink: 'https://meet.example.com/ux-session-1',
            courseId: course3.id,
        },
    });

    // Completed session for course6
    await prisma.session.create({
        data: {
            startTime: createDateTime(-40, 10, 0),
            endTime: createDateTime(-40, 13, 0),
            type: 'ONLINE',
            status: 'COMPLETED',
            meetingLink: 'https://meet.example.com/react-session-1',
            courseId: course6.id,
        },
    });

    // Cancelled session
    await prisma.session.create({
        data: {
            startTime: createDateTime(25, 9, 0),
            endTime: createDateTime(25, 12, 0),
            type: 'IN_PERSON',
            status: 'CANCELLED',
            courseId: course4.id,
        },
    });

    console.log('✅ Created 6 sessions\n');

    // ================================================
    // ENROLLMENTS
    // ================================================
    console.log('📝 Creating enrollments...');

    const enrollment1 = await prisma.enrollment.create({
        data: {
            studentId: student1.id,
            courseId: course1.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(5),
        },
    });

    const enrollment2 = await prisma.enrollment.create({
        data: {
            studentId: student2.id,
            courseId: course1.id,
            status: 'PENDING_PAYMENT',
            enrolledAt: subtractDays(2),
        },
    });

    const enrollment3 = await prisma.enrollment.create({
        data: {
            studentId: student4.id,
            courseId: course2.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(3),
        },
    });

    const enrollment4 = await prisma.enrollment.create({
        data: {
            studentId: student5.id,
            courseId: course3.id,
            status: 'PRELIMINARY',
            enrolledAt: subtractDays(1),
        },
    });

    const enrollment5 = await prisma.enrollment.create({
        data: {
            studentId: student6.id,
            courseId: course6.id,
            status: 'COMPLETED',
            enrolledAt: subtractDays(50),
        },
    });

    const enrollment6 = await prisma.enrollment.create({
        data: {
            studentId: student7.id,
            courseId: course4.id,
            status: 'CANCELLED',
            cancellationReason: 'Schedule conflict',
            enrolledAt: subtractDays(15),
        },
    });

    const enrollment7 = await prisma.enrollment.create({
        data: {
            studentId: student1.id,
            courseId: course2.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(4),
        },
    });

    // ---- Additional enrollments for richer testing ----

    // More students in course1 (Full-Stack) - institute1
    const enrollment8 = await prisma.enrollment.create({
        data: {
            studentId: student3.id,
            courseId: course1.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(4),
        },
    });

    const enrollment9 = await prisma.enrollment.create({
        data: {
            studentId: student4.id,
            courseId: course1.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(3),
        },
    });

    const enrollment10 = await prisma.enrollment.create({
        data: {
            studentId: student5.id,
            courseId: course1.id,
            status: 'COMPLETED',
            enrolledAt: subtractDays(20),
        },
    });

    const enrollment11 = await prisma.enrollment.create({
        data: {
            studentId: student6.id,
            courseId: course1.id,
            status: 'CANCELLED',
            cancellationReason: 'الطالب طلب الانسحاب لأسباب شخصية',
            enrolledAt: subtractDays(8),
        },
    });

    // More students in course2 (Machine Learning) - institute1
    const enrollment12 = await prisma.enrollment.create({
        data: {
            studentId: student2.id,
            courseId: course2.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(6),
        },
    });

    const enrollment13 = await prisma.enrollment.create({
        data: {
            studentId: student3.id,
            courseId: course2.id,
            status: 'PRELIMINARY',
            enrolledAt: subtractDays(1),
        },
    });

    // More students in course3 (UI/UX Design) - institute1
    const enrollment14 = await prisma.enrollment.create({
        data: {
            studentId: student1.id,
            courseId: course3.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(7),
        },
    });

    const enrollment15 = await prisma.enrollment.create({
        data: {
            studentId: student2.id,
            courseId: course3.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(5),
        },
    });

    // More students in course4 (Digital Marketing) - institute2
    const enrollment16 = await prisma.enrollment.create({
        data: {
            studentId: student1.id,
            courseId: course4.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(9),
        },
    });

    const enrollment17 = await prisma.enrollment.create({
        data: {
            studentId: student3.id,
            courseId: course4.id,
            status: 'ACTIVE',
            enrolledAt: subtractDays(7),
        },
    });

    // More students in course6 (Advanced React - COMPLETED) - institute1
    const enrollment18 = await prisma.enrollment.create({
        data: {
            studentId: student7.id,
            courseId: course6.id,
            status: 'COMPLETED',
            enrolledAt: subtractDays(50),
        },
    });

    console.log('✅ Created 18 enrollments\n');

    // ================================================
    // PAYMENTS
    // ================================================
    console.log('💰 Creating payments...');

    await prisma.payment.create({
        data: {
            amount: 500,
            currency: 'YER',
            depositSlipImage: 'https://example.com/slips/payment-1.jpg',
            notes: 'First installment for Full-Stack course',
            status: 'APPROVED',
            reviewedBy: platformAdmin1.id,
            reviewedAt: subtractDays(4),
            enrollmentId: enrollment1.id,
        },
    });

    await prisma.payment.create({
        data: {
            amount: 500,
            currency: 'YER',
            depositSlipImage: 'https://example.com/slips/payment-2.jpg',
            status: 'PENDING_REVIEW',
            enrollmentId: enrollment2.id,
        },
    });

    await prisma.payment.create({
        data: {
            amount: 600,
            currency: 'YER',
            depositSlipImage: 'https://example.com/slips/payment-3.jpg',
            notes: 'Payment for ML course',
            status: 'APPROVED',
            reviewedBy: platformAdmin2.id,
            reviewedAt: subtractDays(2),
            enrollmentId: enrollment3.id,
        },
    });

    await prisma.payment.create({
        data: {
            amount: 450,
            currency: 'YER',
            depositSlipImage: 'https://example.com/slips/payment-4.jpg',
            status: 'REJECTED',
            rejectionReason: 'Invalid payment slip - amount mismatch',
            reviewedBy: platformAdmin1.id,
            reviewedAt: subtractDays(1),
            enrollmentId: enrollment4.id,
        },
    });

    await prisma.payment.create({
        data: {
            amount: 12600,
            currency: 'YER',
            depositSlipImage: 'https://example.com/slips/room-payment-1.jpg',
            notes: 'Room booking payment for Full-Stack course',
            status: 'APPROVED',
            reviewedBy: platformAdmin1.id,
            reviewedAt: subtractDays(8),
            roomBookingId: booking1.id,
        },
    });

    console.log('✅ Created 5 payments\n');

    // ================================================
    // WISHLISTS
    // ================================================
    console.log('⭐ Creating wishlists...');

    await prisma.wishlist.create({
        data: {
            studentId: student2.id,
            courseId: course2.id,
        },
    });

    await prisma.wishlist.create({
        data: {
            studentId: student2.id,
            courseId: course3.id,
        },
    });

    await prisma.wishlist.create({
        data: {
            studentId: student5.id,
            courseId: course1.id,
        },
    });

    await prisma.wishlist.create({
        data: {
            studentId: student7.id,
            courseId: course5.id,
        },
    });

    console.log('✅ Created 4 wishlists\n');

    // ================================================
    // ANNOUNCEMENTS
    // ================================================
    console.log('📢 Creating announcements...');

    await prisma.announcement.create({
        data: {
            title: 'Welcome to Full-Stack Web Development!',
            message: 'Welcome everyone! The course starts next week. Please make sure you have all the prerequisites installed.',
            senderId: trainer1.id,
            courseId: course1.id,
            sentAt: subtractDays(7),
        },
    });

    await prisma.announcement.create({
        data: {
            title: 'Session Postponed',
            message: 'Tomorrow\'s session has been postponed to Friday due to technical issues.',
            senderId: trainer2.id,
            courseId: course2.id,
            scheduledAt: addDays(1),
        },
    });

    await prisma.announcement.create({
        data: {
            title: 'Assignment Deadline Reminder',
            message: 'Don\'t forget to submit your UI design assignment by Sunday!',
            senderId: trainer4.id,
            courseId: course3.id,
            sentAt: subtractDays(2),
        },
    });

    console.log('✅ Created 3 announcements\n');

    // ================================================
    // NOTIFICATIONS
    // ================================================
    console.log('🔔 Creating notifications...');

    await prisma.notification.create({
        data: {
            type: 'COURSE_ENROLLMENT',
            userId: student1.id,
            relatedEntityId: course1.id,
            isRead: true,
            createdAt: subtractDays(5),
        },
    });

    await prisma.notification.create({
        data: {
            type: 'PAYMENT_APPROVED',
            userId: student1.id,
            relatedEntityId: enrollment1.id,
            isRead: true,
            createdAt: subtractDays(4),
        },
    });

    await prisma.notification.create({
        data: {
            type: 'PAYMENT_REJECTED',
            userId: student5.id,
            relatedEntityId: enrollment4.id,
            isRead: false,
            createdAt: subtractDays(1),
        },
    });

    await prisma.notification.create({
        data: {
            type: 'SESSION_REMINDER',
            userId: student1.id,
            relatedEntityId: course1.id,
            isRead: false,
            createdAt: subtractDays(1),
        },
    });

    await prisma.notification.create({
        data: {
            type: 'NEW_ANNOUNCEMENT',
            userId: student4.id,
            relatedEntityId: course2.id,
            isRead: false,
            createdAt: subtractDays(2),
        },
    });

    console.log('✅ Created 5 notifications\n');

    // ================================================
    // ROOM BOOKINGS
    // ================================================
    console.log('📅 Creating room bookings...');

    const bookingsData = [
        {
            bookingMode: 'UNIFIED_TIME',
            startDate: new Date('2026-03-01T00:00:00.000Z'),
            endDate: new Date('2026-03-10T00:00:00.000Z'),
            selectedDays: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
            defaultStartTime: new Date('2026-03-01T09:00:00.000Z'),
            defaultEndTime: new Date('2026-03-01T12:00:00.000Z'),
            status: 'PENDING_APPROVAL',
            purpose: 'دورة برمجة',
            notes: 'نرجو تجهيز البروجكتر',
            totalPrice: 1500,
            roomId: room1.id,
            requestedById: trainer1.id,
            courseId: course1.id,
            payments: {
                create: [
                    {
                        amount: 1500,
                        currency: 'YER',
                        status: 'APPROVED',
                        depositSlipImage: '/uploads/slip1.jpg',
                        notes: 'تم الدفع بالكامل',
                        reviewedBy: platformAdmin1.id,
                        reviewedAt: new Date(),
                    }
                ]
            }
        },
        {
            bookingMode: 'UNIFIED_TIME',
            startDate: new Date('2026-03-05T00:00:00.000Z'),
            endDate: new Date('2026-03-15T00:00:00.000Z'),
            selectedDays: ['MONDAY', 'WEDNESDAY'],
            defaultStartTime: new Date('2026-03-05T14:00:00.000Z'),
            defaultEndTime: new Date('2026-03-05T17:00:00.000Z'),
            status: 'PENDING_PAYMENT',
            purpose: 'ورشة عمل تصميم',
            totalPrice: 2000,
            roomId: room2.id,
            requestedById: trainer2.id,
            courseId: course2.id,
            payments: {
                create: [
                    {
                        amount: 1000,
                        currency: 'YER',
                        status: 'REJECTED',
                        depositSlipImage: '/uploads/slip2.jpg',
                        notes: 'دفعة أولى مرفوضة',
                        rejectionReason: 'صورة الإيصال غير واضحة',
                        reviewedBy: platformAdmin1.id,
                        reviewedAt: new Date(),
                    },
                    {
                        amount: 1000,
                        currency: 'YER',
                        status: 'PENDING_REVIEW',
                        depositSlipImage: '/uploads/slip3.jpg',
                        notes: 'إعادة إرسال الإيصال',
                    }
                ]
            }
        },
        {
            bookingMode: 'CUSTOM_TIME',
            startDate: new Date('2026-03-20T00:00:00.000Z'),
            endDate: new Date('2026-03-20T00:00:00.000Z'),
            selectedDays: ['THURSDAY'],
            defaultStartTime: new Date('2026-03-20T10:00:00.000Z'),
            defaultEndTime: new Date('2026-03-20T15:00:00.000Z'),
            status: 'APPROVED',
            purpose: 'اجتماع إدارة',
            notes: 'تمت الموافقة',
            totalPrice: 500,
            roomId: room1.id,
            requestedById: trainer1.id,
            approvedById: instituteAdmin1.id,
            courseId: course1.id,
        },
        {
            bookingMode: 'UNIFIED_TIME',
            startDate: new Date('2026-04-01T00:00:00.000Z'),
            endDate: new Date('2026-04-05T00:00:00.000Z'),
            selectedDays: ['SUNDAY', 'MONDAY', 'TUESDAY'],
            defaultStartTime: new Date('2026-04-01T16:00:00.000Z'),
            defaultEndTime: new Date('2026-04-01T20:00:00.000Z'),
            status: 'REJECTED',
            purpose: 'تدريب داخلي',
            rejectionReason: 'القاعة محجوزة مسبقاً في هذا الوقت',
            totalPrice: 1200,
            roomId: room1.id,
            requestedById: trainer1.id,
            approvedById: instituteAdmin1.id,
            courseId: course1.id,
        }
    ];

    for (const data of bookingsData) {
        await prisma.roomBooking.create({ data: data as any });
    }

    console.log('✅ Created 4 room bookings\n');


    // ================================================
    // AUDIT LOGS
    // ================================================
    console.log('📋 Creating audit logs...');

    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entityName: 'Course',
            entityId: course1.id,
            description: 'Created new course: Full-Stack Web Development Bootcamp',
            performedBy: trainer1.id,
            performedAt: subtractDays(30),
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'APPROVE',
            entityName: 'Payment',
            entityId: enrollment1.id,
            description: 'Approved payment for enrollment',
            performedBy: platformAdmin1.id,
            performedAt: subtractDays(4),
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'REJECT',
            entityName: 'Payment',
            entityId: enrollment4.id,
            description: 'Rejected payment due to invalid slip',
            performedBy: platformAdmin1.id,
            performedAt: subtractDays(1),
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'CANCEL',
            entityName: 'Session',
            entityId: course4.id,
            description: 'Cancelled session due to trainer unavailability',
            performedBy: trainer5.id,
            performedAt: subtractDays(3),
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entityName: 'Course',
            entityId: course1.id,
            description: 'Updated course status to ACTIVE',
            performedBy: platformAdmin1.id,
            performedAt: subtractDays(25),
        },
    });

    console.log('✅ Created 5 audit logs\n');

    // ================================================
    // SUMMARY
    // ================================================
    console.log('📊 Seed Summary:');
    console.log('=====================================');
    console.log('👥 Users: 17');
    console.log('   - Platform Admins: 2');
    console.log('   - Institute Admins: 3');
    console.log('   - Trainers: 5');
    console.log('   - Students: 7');
    console.log('');
    console.log('👨‍🏫 Trainer Profiles: 5');
    console.log('🏛️  Institutes: 3');
    console.log('🚪 Rooms: 5');
    console.log('📚 Course Categories: 4');
    console.log('📖 Courses: 6');
    console.log('📅 Room Bookings: 5');
    console.log('🎓 Sessions: 6');
    console.log('📝 Enrollments: 18');
    console.log('💰 Payments: 5');
    console.log('⭐ Wishlists: 4');
    console.log('📢 Announcements: 3');
    console.log('🔔 Notifications: 5');
    console.log('📋 Audit Logs: 5');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   - Password (all users): Test@123456');
    console.log('');
    console.log('🎯 Scenarios covered:');
    console.log('   ✅ All user roles and statuses');
    console.log('   ✅ Trainer profiles (approved, rejected, pending)');
    console.log('   ✅ Institutes (approved, rejected, pending)');
    console.log('   ✅ Courses in various statuses (draft, active, completed)');
    console.log('   ✅ Room bookings (approved, pending, rejected)');
    console.log('   ✅ Sessions (scheduled, completed, cancelled)');
    console.log('   ✅ Enrollments (preliminary, pending payment, active, completed, cancelled)');
    console.log('   ✅ Payments (pending, approved, rejected)');
    console.log('   ✅ Wishlists, announcements, notifications');
    console.log('   ✅ Complete audit trail');
    console.log('');
    console.log('=====================================');
    console.log('✨ Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
