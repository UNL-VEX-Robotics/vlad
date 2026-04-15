import db from "../db.js";
import nodeCron from "node-cron";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

//TODO: Implement Email Notifications for users that enable them in their settings. This is implemented in the database and settings page,
// but we need to add the actual email sending functionality and have it work with the different digest modes (immediate, daily, weekly)

/**
 * This renders the notifications page.
 * @param {Object} req - Express request object. Expects req.session.user_id to identify the user.
 * @param {Object} res - Express response object. Renders the notifications page with the user's notifications.
 */
export const renderNotifications = async (req, res) => {
    try {
        const notifications = await db.notifications.findAll({
            where: {
                user_id: req.session.user_id,
                createdAt: {
                    // WHERE createdAt > (NOW() - 30 days)
                    [Op.gt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
                },
            },
            attributes: ["id", "title", "message", "createdAt", "is_read"],
            order: [
                ["is_read", "ASC"], // false (0) comes before true (1)
                ["createdAt", "DESC"], // Newest first
            ],
        });
        return res.render("notifications/notifications", {
            title: "Notifications",
            notifications: notifications,
        });
    } catch (err) {
        logger.error(`Error rendering notifications page: ${err}`);
        return res.redirect("/dashboard?error=Server%20Error");
    }
};

/**
 * This cron job runs every day at 2:00 AM Central Time and deletes notifications that are older than 30 days from the database.
 */
nodeCron.schedule(
    "0 2 * * *",
    async () => {
        try {
            await db.notifications.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            });
        } catch (err) {
            logger.error(`Error clearing old notifications: ${err}`);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);

/**
 * Dismisses a notification for a user.
 * @param {Object} req - Express request object. Expects req.body.notification_id.
 * @param {Object} res - Express response object. Redirects to dashboard after dismissal.
 */
export async function markAsRead(req, res) {
    const { notification_id, redirect } = req.body;
    try {
        await db.notifications.update({ is_read: true }, { where: { id: notification_id } });
        const referer = redirect || "/dashboard";
        return res.redirect(referer);
    } catch (err) {
        logger.error(`Error marking notification as read: ${err}`);
        return res.redirect("/notifications?error=Server%20Error");
    }
}

/**
 * Marks all notifications as read for the current user
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object. Redirects to dashboard after marking as read.
 */
export async function markAllAsRead(req, res) {
    const { redirect } = req.body;
    try {
        await db.notifications.update(
            { is_read: true },
            { where: { user_id: req.session.user_id } }
        );
        const referer = redirect || "/dashboard";
        return res.redirect(referer);
    } catch (err) {
        logger.error(`Error marking all notifications as read: ${err}`);
        return res.redirect("/notifications?error=Server%20Error");
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
        await db.notifications.destroy({
            where: { id: notification_id },
        });
        return res.redirect("/notifications");
    } catch (err) {
        logger.error(`Error deleting notifications: ${err}`);
        return res.redirect("/notifications?error=Server%20Error");
    }
}

/**
 * Deletes all notifications for a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object. Redirects to dashboard after deletion.
 */
export async function deleteAllNotifications(req, res) {
    try {
        await db.notifications.destroy({
            where: { user_id: req.session.user_id },
        });
        return res.redirect("/notifications/hub");
    } catch (err) {
        logger.error(`Error deleting all notifications: ${err}`);
        return res.redirect("/notifications/hub?error=Server%20Error");
    }
}
