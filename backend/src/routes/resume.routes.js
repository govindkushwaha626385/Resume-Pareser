import express from 'express';
import { upload } from '../storage/fileUpload.js';
import { chatWithResumeController } from '../controllers/chat.controller.js';
import { 
    uploadResumeController, 
    processCandidateController, 
    getReportController, 
    getLeaderboardController, 
    getJobsList, 
    createJobController,
    sendEmailController,
    handleDecisionController
} from '../controllers/resume.controller.js';

const router = express.Router();

// --- 1. Intake & Jobs Management ---
router.get('/jobs', getJobsList);
router.post('/jobs', createJobController); 
router.post('/upload', upload.single('file'), uploadResumeController);

// --- 2. AI Processing Pipeline ---
router.post('/process', processCandidateController);

// --- 3. Reporting & Analytics ---
router.get('/jobs/:jobId/candidates', getLeaderboardController);
router.get('/candidate/:candidateId/report', getReportController);

// --- 4. Communication & Decisioning ---

// FIX 404: Added the explicit /email endpoint called by your "Send Email" button
router.post('/email', sendEmailController); 

// FIX 500: Pointed /decision to a controller that updates the DB AND sends email
router.post('/decision', handleDecisionController); 

router.post('/chat', chatWithResumeController);

export default router;