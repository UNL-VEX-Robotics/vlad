import express from "express";
import {
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    deleteAllNotifications,
    renderNotifications,
} from "../controllers/notifications.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /notifications/hub page
router.get("/hub", isAuthenticated, renderNotifications);

// POST /notifications/mark-as-read
router.post("/mark-as-read", markAsRead);

// POST /notifications/mark-all-as-read
router.post("/mark-all-as-read", markAllAsRead);

// POST /notifications/delete
router.post("/delete", deleteNotifications);

// POST /notifications/delete-all
router.post("/delete-all", deleteAllNotifications);

export default router;
