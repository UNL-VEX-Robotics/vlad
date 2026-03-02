import express from 'express'
import { acceptUserRequest, changeUserRole, rejectUserRequest } from '../controllers/admin.controller.js'

const router = express.Router()

// POST /admin/approve-member
router.post('/approve-member', acceptUserRequest);

// POST /admin/reject-member
router.post('/reject-member', rejectUserRequest);

// POST /admin/change-role
router.post('/change-role', changeUserRole);

// POST /admin/remove-member
router.post('/remove-member', changeUserRole);

export default router;