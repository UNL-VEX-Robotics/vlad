import express from 'express';
import { sendResetPasswordEmail, resetPassword } from '../controllers/reset.controller.js';

const router = express.Router();

// POST /reset/send
router.post('/send', sendResetPasswordEmail);

// POST /reset/reset-password
router.post('/reset-password', resetPassword);

export default router;