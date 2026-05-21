import { Request, Response } from 'express';
import { hashPassword, comparePassword } from '../utils/password.util';
import prisma from '../config/prisma';

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
  phoneNumber: true,
  address: true,
  emailNotifications: true,
  smsNotifications: true,
  predictionAlerts: true,
  doctorFeedback: true,
  weeklyReports: true,
  systemUpdates: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ settings: user });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
  const { firstName, lastName, email, phoneNumber, address } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
      },
      select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, address: true }
    });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email is already taken by another account.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      emailNotifications,
      smsNotifications,
      predictionAlerts,
      doctorFeedback,
      weeklyReports,
      systemUpdates,
    } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailNotifications: Boolean(emailNotifications),
        smsNotifications: Boolean(smsNotifications),
        predictionAlerts: Boolean(predictionAlerts),
        doctorFeedback: Boolean(doctorFeedback),
        weeklyReports: Boolean(weeklyReports),
        systemUpdates: Boolean(systemUpdates),
      },
    });

    res.status(200).json({ message: 'Notifications updated successfully' });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
