import pool from '../db.js';
import nodeCron from 'node-cron';
import { ROLES } from '../utils/constants.js';
import { withLayout } from '../views/layout.js';
import { notificationsPage } from '../views/notifications.view.js';

// Need to figure out a way to clear notifications from the dashboard when they are marked as read because function brings them to notifications 
// page when it should bring them to the dashboard if they are on the dashboard and the notifications page when on the notifications page.

/**
 * This renders the notifications page.
 * @param {Object} req - Express request object. Expects req.session.user_id to identify the user.
 * @param {Object} res - Express response object. Renders the notifications page with the user's notifications.
 */
export const renderNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, title, message, created_at, is_read 
             FROM notifications 
             WHERE user_id = $1 
             AND created_at > NOW() - INTERVAL '30 days'
             ORDER BY created_at DESC`,
            [req.session.user_id]
        );

        const content = notificationsPage(result.rows);
        res.send(withLayout("Notification Hub", content, req));
    } catch (err) {
        console.error("Error loading notifications:", err);
        res.status(500).send("Error loading notifications");
    }
};

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
        return res.redirect('/notifications');
    }
    catch (err){
        console.error("Error marking notification as read: ", err);
        return res.redirect('/notifications?error=Server%20Error');
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
        return res.redirect('/notifications');
    }
    catch (err){
        console.error("Error marking all notifications as read: ", err);
        return res.redirect('/notifications?error=Server%20Error');
    }
}

/**
 * Deletes a notification for a user.
 * @param {Object} req - Express request object. Expects req.body.notification_id.
 * @param {Object} res - Express response object. Redirects to dashboard after deletion.
 */
export async function deleteNotifications(req, res) {
    const { notification_id } = req.body;
    try {
        await pool.query(
            "DELETE FROM notifications WHERE id = $1",
            [notification_id]
        );
        return res.redirect('/notifications');
    }
    catch (err){
        console.error("Error deleting notification: ", err);
        return res.redirect('/notifications?error=Server%20Error');
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
        return res.redirect('/notifications/hub');
    }
    catch (err){
        console.error("Error deleting all notifications: ", err);
        return res.redirect('/notifications/hub?error=Server%20Error');
    }
}

