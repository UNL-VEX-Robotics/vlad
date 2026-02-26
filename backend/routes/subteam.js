import express from 'express'
import { createSubteam, deleteSubteam, editSubteam } from '../controllers/subteam.controller.js'

const router = express.Router();

// POST /subteam/create-subteam
router.post('/create-subteam', createSubteam);

// POST /subteam/delete-subteam
router.post('/delete-subteam', deleteSubteam);

// POST /subteam/edit-subteam
router.post('/edit-subteam', editSubteam);

export default router;