import express from "express";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import { ROLES } from "../utils/constants.js";
import { createSubteam, deleteSubteam, editSubteam } from "../controllers/subteam.controller.js";
import { renderCreateSubteam } from "../controllers/subteam.controller.js";

const router = express.Router();

// GET /subteam/create-subteam
router.get("/create-subteam", isAuthenticated, requireRole(ROLES.ADMIN), renderCreateSubteam);

// POST /subteam/create-subteam
router.post("/create-subteam", createSubteam);

// POST /subteam/delete-subteam
router.post("/delete-subteam", deleteSubteam);

// POST /subteam/edit-subteam
router.post("/edit-subteam", editSubteam);

export default router;
