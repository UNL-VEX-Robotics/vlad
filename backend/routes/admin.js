import express from 'express'
import { acceptUserSignup, rejectUserSignup } from '../controllers/admin.controller.js'

const router = express.Router()

// POST /admin/approve-member
router.post('/approve-member', acceptUserSignup);

// POST /admin/reject-member
router.post('/reject-member', rejectUserSignup);

export default router;