import express from 'express'
import { acceptUserRequest, rejectUserRequest } from '../controllers/admin.controller.js'

const router = express.Router()

// POST /admin/approve-member
router.post('/approve-member', acceptUserRequest);

// POST /admin/reject-member
router.post('/reject-member', rejectUserRequest);

export default router;