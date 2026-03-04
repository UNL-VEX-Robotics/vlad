import express from 'express';
import { markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../controllers/notification.controller.js';

const router = express.Router();

// POST /notifications/mark-as-read
router.post('/mark-as-read', markAsRead);

// POST /notifications/mark-all-as-read
router.post('/mark-all-as-read', markAllAsRead);

// POST /notifications/delete
router.post('/delete', deleteNotification);

// POST /notifications/delete-all
router.post('delete-all', deleteAllNotifications);

export default router;