import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const publicController = {
  // 1. Get Platform Stats
  getStats: async (req: Request, res: Response) => {
    try {
      // Parallelize queries for efficiency
      const [studentsCount, coursesCount, trainersCount, institutesCount] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
        prisma.course.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'TRAINER', status: 'ACTIVE' } }),
        prisma.institute.count({ where: { user: { status: 'ACTIVE' } } })
      ]);

      res.status(200).json({
        success: true,
        data: {
          students: studentsCount,
          courses: coursesCount,
          trainers: trainersCount,
          institutes: institutesCount
        }
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, message: 'فشل في جلب الإحصائيات' });
    }
  },

  // 2. Get Categories with Course Count
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await prisma.courseCategory.findMany({
        include: {
          _count: {
            select: { courses: { where: { status: 'ACTIVE' } } }
          }
        }
      });

      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, message: 'فشل في جلب التصنيفات' });
    }
  },

  // 3. Get Featured Courses
  getFeaturedCourses: async (req: Request, res: Response) => {
    try {
      const courses = await prisma.course.findMany({
        where: { status: 'ACTIVE' },
        take: 4,
        orderBy: {
          enrollments: { _count: 'desc' }
        },
        include: {
          category: true,
          trainer: {
            select: { id: true, name: true, avatar: true }
          },
          institute: {
            select: { id: true, name: true, logo: true }
          }
        }
      });

      res.status(200).json({ success: true, data: courses });
    } catch (error: any) {
      console.error('Error fetching featured courses:', error);
      res.status(500).json({ success: false, message: 'فشل في جلب الدورات المميزة' });
    }
  }
};

export default publicController;
