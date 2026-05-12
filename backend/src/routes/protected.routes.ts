import { Router } from 'express';
import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';
import { getMessages, sendMessage, getChatPartners } from '../controllers/chat.controller';
import { getDoctors, submitPrediction, getDoctorPredictions, getPatientPredictions, getAssignedDoctor, assignDoctor, updatePredictionStatus, getDoctorPatients } from '../controllers/predictions.controller';
import { getUserSettings, updateProfile, updateNotifications, changePassword } from '../controllers/user.controller';
import { uploadReport, getPatientReports, getDoctorReports, getAllDoctorReports, parseReport, getReportFile, deleteReport, updateReportStatus } from '../controllers/report.controller';
import { getAIResponse } from '../controllers/ai-chat.controller';
import { submitReview } from '../controllers/review.controller';



const router = Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.get('/doctors',
  authenticateToken,
  getDoctors
);
router.get('/user/settings', authenticateToken, getUserSettings);
router.put('/user/profile', authenticateToken, updateProfile);
router.put('/user/notifications', authenticateToken, updateNotifications);
router.put('/user/change-password', authenticateToken, changePassword);
router.get('/chat/partners', authenticateToken, getChatPartners);
router.get('/chat/:userId', authenticateToken, getMessages);
router.post('/chat/send', authenticateToken, sendMessage);

router.get('/patient/dashboard',
  authenticateToken,
  authorizeRoles('PATIENT'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Patient Dashboard', user: req.user });
  }
);

router.get('/patient/predictions',
  authenticateToken,
  authorizeRoles('PATIENT'),
  getPatientPredictions
);

router.get('/patient/assigned-doctor',
  authenticateToken,
  authorizeRoles('PATIENT'),
  getAssignedDoctor
);

router.post('/patient/assign-doctor',
  authenticateToken,
  authorizeRoles('PATIENT'),
  assignDoctor
);

// Report Routes
router.post('/reports/upload',
  authenticateToken,
  authorizeRoles('PATIENT'),
  upload.single('report'),
  uploadReport
);
router.get('/reports/patient',
  authenticateToken,
  authorizeRoles('PATIENT'),
  getPatientReports
);
router.get('/reports/doctor/:patientId',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  getDoctorReports
);
router.get('/reports/doctor-all',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  getAllDoctorReports
);
router.post('/reports/:reportId/parse',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  parseReport
);
router.get('/reports/:reportId/file',
  authenticateToken,
  authorizeRoles('PATIENT', 'DOCTOR'),
  getReportFile
);
router.delete('/reports/:reportId',
  authenticateToken,
  authorizeRoles('PATIENT', 'DOCTOR'),
  deleteReport
);
router.patch('/reports/:reportId/status',
  authenticateToken,
  authorizeRoles('PATIENT', 'DOCTOR'),
  updateReportStatus
);

router.post('/predict',
  authenticateToken,
  authorizeRoles('PATIENT', 'DOCTOR'),
  submitPrediction
);

router.get('/doctor/dashboard',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Doctor Dashboard', user: req.user });
  }
);

router.get('/doctor/predictions',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  getDoctorPredictions
);

router.get('/doctor/patients',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  getDoctorPatients
);

router.patch('/doctor/predictions/:id/status',
  authenticateToken,
  authorizeRoles('DOCTOR'),
  updatePredictionStatus
);

router.get('/admin/dashboard',
  authenticateToken,
  authorizeRoles('ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Welcome to Admin Dashboard', user: req.user });
  }
);

// Multiple roles allowed
router.get('/doctor-admin/users',
  authenticateToken,
  authorizeRoles('DOCTOR', 'ADMIN'),
  (req: AuthRequest, res: Response) => {
    res.json({ message: 'Users list (Doctor or Admin access)', user: req.user });
  }
);

router.post('/ai-chat', authenticateToken, getAIResponse);
router.post('/reviews', authenticateToken, authorizeRoles('PATIENT'), submitReview);

export default router;


