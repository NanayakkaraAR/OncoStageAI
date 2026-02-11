import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// Helper function to get the start of the current week (Monday)
const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getAvailableDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const weekStart = getWeekStart();

    // Get all active doctors
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        doctorAssignments: {
          where: {
            weekStartDate: weekStart,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate available slots for each doctor
    const doctorsWithAvailability = doctors.map(doctor => {
      const currentPatientCount = doctor.doctorAssignments.length;
      const availableSlots = Math.max(0, 10 - currentPatientCount);
      
      return {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        fullName: `${doctor.firstName} ${doctor.lastName}`,
        currentPatientCount,
        availableSlots,
        isAvailable: availableSlots > 0,
      };
    });

    // Sort by availability (available doctors first, then by available slots)
    doctorsWithAvailability.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return b.availableSlots - a.availableSlots;
    });

    res.status(200).json({
      doctors: doctorsWithAvailability,
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignPatientToDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId } = req.body;
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const weekStart = getWeekStart();

    // Check if patient already has an assignment
    const existingAssignment = await prisma.doctorPatientAssignment.findUnique({
      where: { patientId },
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'You are already assigned to a doctor' 
      });
    }

    // Verify doctor exists and is active
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: 'DOCTOR',
        isActive: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or inactive' });
    }

    // Check doctor's current patient count for this week
    const currentAssignmentsCount = await prisma.doctorPatientAssignment.count({
      where: {
        doctorId,
        weekStartDate: weekStart,
      },
    });

    if (currentAssignmentsCount >= 10) {
      return res.status(400).json({ 
        message: 'This doctor has reached the maximum patient limit for this week' 
      });
    }

    // Create assignment
    const assignment = await prisma.doctorPatientAssignment.create({
      data: {
        doctorId,
        patientId,
        weekStartDate: weekStart,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Successfully assigned to doctor',
      assignment: {
        id: assignment.id,
        doctor: assignment.doctor,
        assignedAt: assignment.assignedAt,
      },
    });
  } catch (error) {
    console.error('Error assigning patient to doctor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const assignment = await prisma.doctorPatientAssignment.findUnique({
      where: { patientId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No doctor assignment found' });
    }

    res.status(200).json({
      assignment: {
        id: assignment.id,
        doctor: assignment.doctor,
        assignedAt: assignment.assignedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching patient assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
