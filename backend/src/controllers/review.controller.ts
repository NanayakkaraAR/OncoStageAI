import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const submitReview = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, rating, comment } = req.body;
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!doctorId || !rating || !comment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const review = await prisma.review.create({
      data: {
        patientId,
        doctorId: parseInt(doctorId),
        rating: parseInt(rating),
        comment
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({ message: 'Review submitted successfully', review });
  } catch (error: any) {
    console.error('Submit Review Error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

export const getLandingReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      take: 6,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(reviews);
  } catch (error: any) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
