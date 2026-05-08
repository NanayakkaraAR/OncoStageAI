import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const otherUserId = parseInt(req.params.userId, 10);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId: parseInt(receiverId, 10),
        content,
      },
    });

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getChatPartners = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const messagePartners = await prisma.message.findMany({
      where: {
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      },
      select: { senderId: true, receiverId: true },
    });

    const predictionPartners = await prisma.prediction.findMany({
      where: { patientId: currentUserId },
      select: { doctorId: true },
    });

    const assignment = await prisma.doctor_patient_assignments.findUnique({
      where: { patientId: currentUserId },
    });

    const partnerIds = new Set<number>();
    messagePartners.forEach(m => {
      if (m.senderId !== currentUserId) partnerIds.add(m.senderId);
      if (m.receiverId !== currentUserId) partnerIds.add(m.receiverId);
    });
    predictionPartners.forEach(p => partnerIds.add(p.doctorId));
    if (assignment) {
      partnerIds.add(assignment.doctorId);
    }

    const doctors = await prisma.user.findMany({
      where: {
        id: { in: Array.from(partnerIds) },
        role: 'DOCTOR'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    const doctorsWithUnread = await Promise.all(doctors.map(async (doc) => {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: doc.id,
          receiverId: currentUserId,
          isRead: false
        }
      });
      return { ...doc, unreadCount };
    }));

    res.status(200).json({ success: true, data: doctorsWithUnread });
  } catch (error) {
    console.error('Error fetching chat partners:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
