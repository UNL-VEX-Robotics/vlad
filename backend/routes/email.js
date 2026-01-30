import express from 'express';
import { sendResetPasswordEmail, resetPassword } from '../controllers/email.controller.js';

const router = express.Router();

// POST /email/send
router.post('/send', sendResetPasswordEmail);

// POST /reset-password
router.post('/reset-password', resetPassword);

export default router;