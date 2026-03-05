import express from 'express';
import { renderDashboard, renderProfile } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /dashboard
router.get('/dashboard', isAuthenticated, renderDashboard);

// GET /profile?user_id=123
router.get('/profile', isAuthenticated, renderProfile);

export default router;