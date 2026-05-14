import { Request, Response } from 'express';
import { $Enums } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { sendPasswordResetEmail } from '../utils/email.util';
import prisma from '../config/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Email, password, firstName, and lastName are required' 
      });
    }

    // Automatically assign DOCTOR role for @students.nsbm.ac.lk domain
    let assignedRole = role || 'PATIENT';
    if (email.endsWith('@students.nsbm.ac.lk')) {
      assignedRole = 'DOCTOR';
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: assignedRole,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'DOCTOR' && !email.endsWith('@students.nsbm.ac.lk')) {
      return res.status(403).json({ 
        message: 'Doctor accounts must use @students.nsbm.ac.lk email domain' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If an account exists with that email, a password reset link has been sent.' 
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email
    try {
      await sendPasswordResetEmail(email, user.firstName, resetLink);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success to user for security reasons
    }

    res.status(200).json({ 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ 
        message: 'Token, email, and password are required' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        resetToken: true,
        resetTokenExpires: true,
      },
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid reset token or email' 
      });
    }

    // Check if token is valid
    if ((user.resetToken as string | null) !== token) {
      return res.status(400).json({ 
        message: 'Invalid reset token' 
      });
    }

    // Check if token has expired
    const resetExpires = user.resetTokenExpires as Date | null;
    if (!resetExpires || resetExpires < new Date()) {
      return res.status(400).json({ 
        message: 'Reset token has expired' 
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.status(200).json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
