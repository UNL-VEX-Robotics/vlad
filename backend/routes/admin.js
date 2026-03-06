import express from 'express'
import { acceptUserRequest, changeUserRole, rejectUserRequest, removeUserFromTeam, renderTeamRequests } from '../controllers/admin.controller.js'
import { isAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router()

// GET /admin/team-requests
router.get('/team-requests', isAuthenticated, requireRole(ROLES.ADMIN), renderTeamRequests);

// POST /admin/approve-member
router.post('/approve-member', isAuthenticated, requireRole(ROLES.ADMIN), acceptUserRequest);

// POST /admin/reject-member
router.post('/reject-member', isAuthenticated, requireRole(ROLES.ADMIN), rejectUserRequest);

// POST /admin/change-role
router.post('/change-role', changeUserRole);

// POST /admin/remove-member
router.post('/remove-member', removeUserFromTeam);

export default router;