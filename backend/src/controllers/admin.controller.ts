import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        phoneNumber: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
};

export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        phoneNumber: true,
        _count: {
          select: { doctorComplaints: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = doctors.map(d => ({
      ...d,
      complaintCount: d._count.doctorComplaints,
      _count: undefined,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const complaints = await prisma.doctorComplaint.findMany({
      include: {
        patient: {
          select: { firstName: true, lastName: true, email: true }
        },
        doctor: {
          select: { firstName: true, lastName: true, email: true, isActive: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
};

export const toggleDoctorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: !doctor.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true }
    });

    res.json({ success: true, data: updated, message: updated.isActive ? 'Doctor activated' : 'Doctor banned' });
  } catch (error) {
    console.error('Toggle doctor status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update doctor status' });
  }
};

export const deleteDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Delete related records first
    await prisma.doctorComplaint.deleteMany({ where: { doctorId: Number(id) } });
    await prisma.review.deleteMany({ where: { doctorId: Number(id) } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: Number(id) }, { receiverId: Number(id) }] } });
    await prisma.doctor_patient_assignments.deleteMany({ where: { doctorId: Number(id) } });
    await prisma.prediction.deleteMany({ where: { doctorId: Number(id) } });
    await prisma.report.deleteMany({ where: { doctorId: Number(id) } });
    await prisma.user.delete({ where: { id: Number(id) } });

    res.json({ success: true, message: 'Doctor account deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete doctor' });
  }
};
