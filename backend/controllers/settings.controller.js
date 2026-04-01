import pool from "../db.js";
import { withLayout } from "../views/layout.js";
import { settingsPage } from "../views/settings.view.js";
import pkg from "../../package.json" with { type: "json" };

/**
 * Renders the settings page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 */
export const renderSettings = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const settingsRes = await pool.query("SELECT * FROM user_settings WHERE user_id = $1", [
            userId,
        ]);

        const pageData = {
            user: { user_name: req.session.user_name, email: req.session.email },
            settings: settingsRes.rows[0],
            version: pkg.version,
            error: req.query.error,
            success: req.query.success === "true",
        };

        res.send(withLayout("Settings", settingsPage(pageData), req));
    } catch (err) {
        res.status(500).json({ error: "Failed to load settings", details: err.message });
    }
};

/**
 * Updates the user's settings.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the updated settings.
 */
export async function updateSettings(req, res) {
    const { theme, email_notifications, email_digest_mode, tfa_enabled } = req.body;

    try {
        await pool.query(
            `
            UPDATE user_settings 
            SET theme = $1, email_notifications = $2, email_digest_mode = $3, tfa_enabled = $4, updated_at = NOW()
            WHERE user_id = $5`,
            [theme, email_notifications, email_digest_mode, tfa_enabled, req.session.user_id]
        );
        return res.redirect("/settings?success=Settings%20updated");
    } catch {
        return res.redirect("/settings?error=Server%20Error");
    }
}

export async function updateEmail(req, res) {
    return;
}
