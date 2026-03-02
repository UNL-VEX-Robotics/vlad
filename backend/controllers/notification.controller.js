import pool from '../db.js';


/**
 * Dismisses a notification for a user.
 * @param {Object} req - Express request object. Expects req.body.notification_id.
 * @param {Object} res - Express response object. Redirects to dashboard after dismissal.
 */
export async function dismissNotification(req, res) {
    return
}

/** 
 * Marks all notifications as read for the current user
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object. Redirects to dashboard after marking as read.
 */
export async function markAllAsRead(req, res) {
    return
}