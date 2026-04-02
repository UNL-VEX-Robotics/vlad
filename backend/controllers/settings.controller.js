import pool from "../db.js";
import { withLayout } from "../views/layout.js";
import {
    changeEmailPage,
    emailUpdateSuccessPage,
    finalizeEmailChangePage,
    settingsPage,
    verificationSentPage,
} from "../views/settings.view.js";
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
        };

        res.send(withLayout("Settings", settingsPage(pageData), req));
    } catch (err) {
        res.status(500).json({ error: "Failed to load settings", details: err.message });
    }
};

/**
 * Renders the change email page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the rendered page.
 */
export const renderChangeEmailPage = (req, res) => {
    return res.send(withLayout("Change Email", changeEmailPage(req.error), req));
};

/**
 * Renders the email verification sent page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the rendered page.
 */
export const renderVerificationSentPage = (req, res) => {
    return res.send(withLayout("Verify Email", verificationSentPage(), req));
};

/**
 * Renders the finalize email change page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the rendered page.
 */
export const renderFinalizeEmailChangePage = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect("/settings/change-email?error=Invalid%20Token");
    }
    try {
        const result = await pool.query(
            `
            SELECT pending_email FROM user_account WHERE email_change_token = $1 AND email_change_expires > NOW()`,
            [token]
        );
        if (result.rows.length === 0) {
            return res.redirect("/settings/change-email?error=Invalid%20or%20Expired%20Token");
        }
        return res.send(
            withLayout(
                "Finalize Email Change",
                finalizeEmailChangePage(token, result.rows[0].pending_email),
                req
            )
        );
    } catch {
        return res.redirect("/settings/change-email?error=Server%20Error");
    }
};

/**
 * Renders the email update success page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the rendered page.
 */
export const renderEmailUpdateSuccessPage = (req, res) => {
    return res.send(withLayout("Email Updated", emailUpdateSuccessPage(), req));
};

/**
 * Updates the user's settings.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the updated settings.
 */
export async function updateSettings(req, res) {
    const { user_name, theme, email_notifications, email_digest_mode, two_factor_enabled } =
        req.body;

    try {
        // Update the user's name in the user_account table
        if (user_name !== req.session.user_name) {
            await pool.query("UPDATE user_account SET user_name = $1 WHERE id = $2", [
                user_name,
                req.session.user_id,
            ]);
        }

        // Update the users settings in the database
        await pool.query(
            `
            UPDATE user_settings 
            SET theme = $1, email_notifications = $2, email_digest_mode = $3, two_factor_enabled = $4, updated_at = NOW()
            WHERE user_id = $5`,
            [theme, email_notifications, email_digest_mode, two_factor_enabled, req.session.user_id]
        );
        return res.redirect("/settings?success=Settings%20updated");
    } catch {
        return res.redirect("/settings?error=Server%20Error");
    }
}
