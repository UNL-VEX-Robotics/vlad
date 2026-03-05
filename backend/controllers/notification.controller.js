import pool from '../db.js';
import nodeCron from 'node-cron';

const ROLES = {
    PENDING: 0,
    MEMBER: 1,
    LEAD: 2,
    ADMIN: 3,
    OWNER: 4,
}

/** 
 * This cron job runs every day at 2:00 AM Central Time and deletes notifications that are older than 30 days from the database.
 */
nodeCron.schedule('0 2 * * *', async () => {
    try {
        await pool.query(
            "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'"
        );
    }
    catch (err) {
        console.error("Error cleaning up old notifications: ", err);
    }
});

/**
 * Dismisses a notification for a user.
 * @param {Object} req - Express request object. Expects req.body.notification_id.
 * @param {Object} res - Express response object. Redirects to dashboard after dismissal.
 */
export async function markAsRead(req, res) {
    const { notification_id } = req.body;
    try {
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1",
            [notification_id]
        );
        return res.redirect('/dashboard');
    }
    catch (err){
        console.error("Error marking notification as read: ", err);
        return res.redirect('/dashboard?error=Server%20Error');
    }
}

/** 
 * Marks all notifications as read for the current user
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object. Redirects to dashboard after marking as read.
 */
export async function markAllAsRead(req, res) {
    try {
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [req.session.user_id]
        );
        return res.redirect('/dashboard');
    }
    catch (err){
        console.error("Error marking all notifications as read: ", err);
        return res.redirect('/dashboard?error=Server%20Error');
    }
}

/**
 * Deletes a notification for a user.
 * @param {Object} req - Express request object. Expects req.body.notification_id.
 * @param {Object} res - Express response object. Redirects to dashboard after deletion.
 */
export async function deleteNotification(req, res) {
    const { notification_id } = req.body;
    try {
        await pool.query(
            "DELETE FROM notifications WHERE id = $1",
            [notification_id]
        );
        return res.redirect('/dashboard');
    }
    catch (err){
        console.error("Error deleting notification: ", err);
        return res.redirect('/dashboard?error=Server%20Error');
    }
}

/**
 * Deletes all notifications for a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object. Redirects to dashboard after deletion.
 */
export async function deleteAllNotifications(req, res) {
    try {
        await pool.query(
            "DELETE FROM notifications WHERE user_id = $1",
            [req.session.user_id]
        );
        return res.redirect('/dashboard');
    }
    catch (err){
        console.error("Error deleting all notifications: ", err);
        return res.redirect('/dashboard?error=Server%20Error');
    }
}

