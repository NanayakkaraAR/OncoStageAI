import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const submitComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;
    const { doctorId, reason } = req.body;

    if (!doctorId || !reason) {
      return res.status(400).json({ success: false, error: 'Doctor ID and reason are required' });
    }

    const complaint = await prisma.doctorComplaint.create({
      data: {
        patientId,
        doctorId: Number(doctorId),
        reason,
      },
    });

    const complaintCount = await prisma.doctorComplaint.count({
      where: { doctorId: Number(doctorId) },
    });

    if (complaintCount === 3) {
      await prisma.message.create({
        data: {
          senderId: 0, // 0 can represent system/admin
          receiverId: Number(doctorId),
          content: '[SYSTEM WARNING] You have received 3 complaints from patients regarding unprofessional behavior. Please review your conduct.',
        },
      });
    } else if (complaintCount >= 5) {
      await prisma.user.update({
        where: { id: Number(doctorId) },
        data: { isActive: false },
      });
    }

    res.status(201).json({ success: true, data: complaint, message: 'Complaint submitted successfully' });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit complaint' });
  }
};
