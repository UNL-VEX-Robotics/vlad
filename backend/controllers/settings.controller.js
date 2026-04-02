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
import { TRANSPORTER, EMAIL_REGEX } from "../utils/constants.js";
import crypto from "crypto";

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
            SELECT pending_email FROM user_account WHERE email_verification_token = $1 AND email_token_expiry > NOW()`,
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

/**
 * Sends a verification email to the user.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the sent email.
 */
export async function sendVerificationEmail(req, res) {
    const { pending_email } = req.body;
    if (!EMAIL_REGEX.test(pending_email)) {
        return res.redirect("/settings/change-email?error=Invalid%20Email%20Format");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    try {
        await pool.query(
            `
            UPDATE user_account
            SET pending_email = $1, email_verification_token = $2, email_token_expiry = $3
            WHERE id = $4`,
            [pending_email, token, expires, req.session.user_id]
        );

        const verificationLink = `${req.protocol}://${req.get("host")}/settings/finalize-email-change?token=${token}`;

        const reportLink = `${req.protocol}://${req.get("host")}/settings/report-email-change?token=${token}`;

        await TRANSPORTER.sendMail({
            from: `"Vlad App" <${process.env.EMAIL_USER}>`,
            to: pending_email,
            subject: "Verify Your New Email Address",
            html: `<div style="background-color: #0f0f0f; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 600px; margin: auto; border: 1px solid #333;">
        <h2 style="color: #ff0000; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 10px;">Verify New Email</h2>
        <p>Hello ${req.session.user_name},</p>
        <p>We received a request to change your account email to this address. To finalize this update, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #ff0000; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">CONFIRM EMAIL CHANGE</a>
        </div>
        <p style="font-size: 0.85rem; color: #888;">This link will expire in 1 hour. If you didn't request this change, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
        <p style="font-size: 0.7rem; color: #555; font-family: monospace;">BUILD // VLAD-SECURE-AUTH</p>
    </div>`,
        });

        await TRANSPORTER.sendMail({
            from: `"Vlad App" <${process.env.EMAIL_USER}>`,
            to: req.session.email,
            subject: "Email Change Requested",
            html: `<div style="background-color: #0f0f0f; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 600px; margin: auto; border: 1px solid #ff0000;">
        <h2 style="color: #ff0000; letter-spacing: 1px; text-transform: uppercase;">Security Alert: Email Change</h2>
        <p>Hello ${req.session.user_name},</p>
        <p>The email address for your account is being changed to:</p>
        <div style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ff0000; margin: 20px 0; font-family: monospace; color: #ff0000;">
            ${pending_email}
        </div>
        <p><strong>If this was you:</strong> You can ignore this message. You just need to follow the instructions sent to your new email address to complete the process.</p>
        <p><strong>If this was NOT you:</strong> Your account security may be at risk. Please click the link below immediately to secure your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${reportLink}" style="border: 1px solid #ff0000; color: #ff0000; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">I DID NOT REQUEST THIS</a>
        </div>
        <p style="font-size: 0.85rem; color: #888;">For your protection, the change will not take effect until it is verified by the new email owner.</p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
        <p style="font-size: 0.7rem; color: #555; font-family: monospace;">SYSTEM // SECURITY_CORE_ALERT</p>
    </div>`,
        });
        return res.redirect("/settings/verify-email");
    } catch {
        return res.redirect("/settings/change-email?error=Server%20Error");
    }
}

// TODO: Implement handling for when a user reports an unauthorized email change. This should invalidate the pending email change,
// delete the pending email and token from the database, and send a notification to the user about the reported issue.
// export async function reportUnauthorizedEmailChange(req, res) {
//     return;
// }
