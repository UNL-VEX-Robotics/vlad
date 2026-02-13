import express from 'express'
import { acceptUserSignup } from '../controllers/admin.controller.js'

const router = express.Router()

// POST /admin/approve-member
router.post('/approve-member', acceptUserSignup);

export default router;