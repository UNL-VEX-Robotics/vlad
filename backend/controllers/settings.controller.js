import pool from "../db.js";
import { withLayout } from "../views/layout.js";
import {
    changeEmailPage,
    emailUpdateSuccessPage,
    finalizeEmailChangePage,
    settingsPage,
    verificationSentPage,
    accountSecuredPage,
} from "../views/settings.view.js";
import pkg from "../../package.json" with { type: "json" };
import { TRANSPORTER, EMAIL_REGEX } from "../utils/constants.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodeCron from "node-cron";
import logger from "../utils/logger.js";

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
        logger.error("Error rendering settings page:", err);
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
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const result = await pool.query(
            `
            SELECT pending_email FROM user_account WHERE email_verification_token = $1 AND email_token_expiry > NOW()`,
            [hashedToken]
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
    } catch (err) {
        logger.error("Error rendering finalize email change page:", err);
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
 * Renders the account secured page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the rendered page.
 */
export const renderAccountSecuredPage = (req, res) => {
    const { attempted_email } = req.query;
    return res.send(withLayout("Account Secured", accountSecuredPage({ attempted_email }), req));
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
            [
                theme,
                email_notifications === "on",
                email_digest_mode,
                two_factor_enabled === "on",
                req.session.user_id,
            ]
        );
        return res.redirect("/settings?success=Settings%20updated");
    } catch (err) {
        logger.error("Error updating settings:", err);
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
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 3600000);

    try {
        await pool.query(
            `
            UPDATE user_account
            SET pending_email = $1, email_verification_token = $2, email_token_expiry = $3
            WHERE id = $4`,
            [pending_email, hashedToken, expires, req.session.user_id]
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
            <form method="POST" action="${reportLink}">
                <button type="submit" style="background-color: #ff0000; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; border: none; cursor: pointer;">REPORT UNAUTHORIZED CHANGE</button>
            </form>
        </div>
        <p style="font-size: 0.85rem; color: #888;">For your protection, the change will not take effect until it is verified by the new email owner.</p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
        <p style="font-size: 0.7rem; color: #555; font-family: monospace;">SYSTEM // SECURITY_CORE_ALERT</p>
    </div>`,
        });
        return res.redirect("/settings/verify-email");
    } catch (err) {
        logger.error("Error sending email change verification:", err);
        return res.redirect("/settings/change-email?error=Server%20Error");
    }
}

/**
 * Handles the finalization of the email change after the user clicks the verification link.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the finalization of the email change.
 * Note: This also logs the user out after the email change for security purposes, forcing them to log back in with their new email.
 */
export async function finalizeEmailChange(req, res) {
    const { token, password } = req.body;
    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const result = await pool.query(
            `
            SELECT pending_email FROM user_account WHERE email_verification_token = $1 AND email_token_expiry > NOW()`,
            [hashedToken]
        );

        if (result.rows.length === 0) {
            return res.redirect("/settings/change-email?error=Invalid%20or%20Expired%20Token");
        }

        const pending_email = result.rows[0].pending_email;

        const userResult = await pool.query(
            "SELECT password_hash FROM user_account WHERE email = $1",
            [req.session.email]
        );
        const passwordHash = userResult.rows[0].password_hash;
        const passwordMatch = await bcrypt.compare(password, passwordHash);
        if (!passwordMatch) {
            return res.redirect(
                "/settings/finalize-email-change?token=" + token + "&error=Incorrect%20Password"
            );
        }
        await pool.query(
            `
            UPDATE user_account
            SET email = $1, pending_email = NULL, email_verification_token = NULL, email_token_expiry = NULL
            WHERE email_verification_token = $2 AND email_token_expiry > NOW()`,
            [pending_email, hashedToken]
        );

        await pool.query(
            `
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES ($1, $2, $3, $4, NOW())`,
            [
                req.session.user_id,
                "Email Updated",
                "Your account email has been successfully updated to " + pending_email,
                "email_change",
            ]
        );

        req.session.email = pending_email;

        await req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ error: "Failed to log out", details: err.message });
                return res.redirect("/settings?error=Failed%20to%20Log%20Out");
            }
            res.clearCookie("connect.sid");
            return res.redirect("/settings/email-update-success");
        });
    } catch (err) {
        logger.error("Error finalizing email change:", err);
        return res.redirect("/settings/change-email?error=Server%20Error");
    }
}

/**
 * Reports an unauthorized email change attempt.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @returns {Promise<void>} A promise resolving to the handling of the unauthorized email change report.
 */
export async function reportUnauthorizedEmailChange(req, res) {
    const { token } = req.query;
    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const result = await pool.query(
            `
            SELECT id, pending_email
            FROM user_account
            WHERE email_verification_token = $1`,
            [hashedToken]
        );

        if (result.rows.length === 0) {
            return res.redirect("/auth/login?error=Invalid%20Token");
        }

        await pool.query(
            `
            UPDATE user_account 
            SET pending_email = NULL, email_verification_token = NULL, email_token_expiry = NULL, require_password_reset = TRUE
            WHERE email_verification_token = $1`,
            [hashedToken]
        );
        await pool.query(
            `
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES ($1, $2, $3, $4, NOW())`,
            [
                result.rows[0].id,
                "Unauthorized Email Change Attempt",
                "A request was made to change your email address that you did not authorize. If this was not you, we recommend changing your password and enabling two-factor authentication for your account.",
                "security_alert",
            ]
        );
        await pool.query(
            `
            DELETE FROM session
            WHERE sess::json->>'user_id' = $1`,
            [result.rows[0].id]
        );

        logger.warn(
            `
            Unauthorized email change reported for user ID ${result.rows[0].id}.
            `,
            {
                user_id: result.rows[0].id,
                attempted_email: result.rows[0].pending_email,
            }
        );

        return res.redirect(
            "/settings/account-secured?attempted_email=" + result.rows[0].pending_email
        );
    } catch (err) {
        logger.error("Error reporting unauthorized email change:", err);
        return res.redirect("/auth/login?error=Server%20Error");
    }
}

/**
 * Empty the email change tokens from all user records after they expire.
 */
nodeCron.schedule(
    "0 2 * * *",
    async () => {
        try {
            await pool.query(
                "UPDATE user_account SET pending_email = NULL, email_verification_token = NULL, email_token_expiry = NULL WHERE email_token_expiry < NOW()"
            );
        } catch (err) {
            logger.error("Error clearing expired email change tokens:", err);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);
