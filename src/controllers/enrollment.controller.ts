import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import crypto from 'crypto';

// PayWay placeholders
const PAYWAY_MERCHANT_ID = process.env.PAYWAY_MERCHANT_ID || 'ec4387xx';
const PAYWAY_API_KEY = process.env.PAYWAY_API_KEY || 'your_api_key';
const PAYWAY_API_URL = process.env.PAYWAY_API_URL || 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

export const checkout = async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const userId = (req as any).user.id;

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const transaction = await prisma.transaction.create({
      data: {
        amount: course.price,
        currency: 'USD',
        status: 'PENDING',
        provider: 'payway',
        userId,
        courseId,
      },
    });

    const reqData = {
      req_time: Math.floor(Date.now() / 1000).toString(),
      merchant_id: PAYWAY_MERCHANT_ID,
      tran_id: transaction.id,
      amount: course.price.toFixed(2),
      payment_option: 'abapay_khqr',
      return_url: `http://localhost:3000/api/enrollments/complete?tran_id=${transaction.id}`,
    };

    const hash = crypto.createHmac('sha512', PAYWAY_API_KEY).update(Object.values(reqData).join('')).digest('base64');
    
    res.status(200).json({
      success: true,
      data: {
        paymentUrl: PAYWAY_API_URL,
        payload: { ...reqData, hash },
        transactionId: transaction.id
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Checkout failed', error });
  }
};

export const paywayWebhook = async (req: Request, res: Response) => {
  const { tran_id, status } = req.body;
  try {
    if (status === '00' || status === 'SUCCESS') {
      const transaction = await prisma.transaction.update({
        where: { id: tran_id },
        data: { status: 'SUCCESS' },
      });
      
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: transaction.userId, courseId: transaction.courseId } },
        update: {},
        create: {
          userId: transaction.userId,
          courseId: transaction.courseId,
          progress: 0,
          completedLessons: []
        }
      });
      
      return res.status(200).json({ status: 0, message: 'Success' });
    }
    
    await prisma.transaction.update({
      where: { id: tran_id },
      data: { status: 'FAILED' }
    });
    
    res.status(200).json({ status: 0, message: 'Handled' });
  } catch (error) {
    res.status(500).json({ status: 1, message: 'Error' });
  }
};

// NEW: Student Learning Experience
export const getMyLearning = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            _count: { select: { lessons: true } }
          }
        }
      }
    });
    res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch learning content', error });
  }
};

export const getCourseLearn = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = (req as any).user.id;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
      include: {
        course: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch course data', error });
  }
};

export const updateProgress = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  const { lessonId, completed } = req.body; // completed: boolean
  const userId = (req as any).user.id;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: { include: { _count: { select: { lessons: true } } } } }
    });

    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    let completedLessons = enrollment.completedLessons;

    if (completed) {
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
    } else {
      completedLessons = completedLessons.filter(id => id !== lessonId);
    }

    const totalLessons = enrollment.course._count.lessons;
    const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedLessons,
        progress,
        lastAccessedAt: new Date()
      }
    });

    res.status(200).json({ success: true, data: updatedEnrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update progress', error });
  }
};

export const getCertificate = async (req: Request, res: Response) => {
  const { courseId } = req.params as { courseId: string };
  const userId = (req as any).user.id;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: true, user: { select: { name: true } } }
    });

    if (!enrollment || enrollment.progress < 100) {
      return res.status(403).json({ success: false, message: 'Certificate not available' });
    }

    // Placeholder certificate data
    res.status(200).json({
      success: true,
      data: {
        certificateId: `CERT-${enrollment.id.substring(0, 8).toUpperCase()}`,
        studentName: enrollment.user.name,
        courseTitle: enrollment.course.title,
        completionDate: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificate', error });
  }
};
