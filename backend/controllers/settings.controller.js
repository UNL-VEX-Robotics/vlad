import db from "../db.js";
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
import { Op } from "sequelize";

/**
 * Renders the settings page.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 */
export const renderSettings = async (req, res) => {
    try {
        const userId = req.session.user_id;

        const settings = await db.user_settings.findOne({
            where: { user_id: userId },
        });

        const pageData = {
            user: { user_name: req.session.user_name, email: req.session.email },
            settings: settings,
            version: pkg.version,
        };

        res.send(withLayout("Settings", settingsPage(pageData), req));
    } catch (err) {
        logger.error(`Error rendering settings page: ${err}`);
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
        const user = await db.user_account.findOne({
            where: {
                email_verification_token: hashedToken,
                email_token_expiry: { [Op.gt]: new Date() },
            },
            attributes: ["pending_email"],
        });
        if (!user) {
            return res.redirect("/settings/change-email?error=Invalid%20or%20Expired%20Token");
        }
        return res.send(
            withLayout(
                "Finalize Email Change",
                finalizeEmailChangePage(token, user.pending_email),
                req
            )
        );
    } catch (err) {
        logger.error(`Error rendering finalize email change page: ${err}`);
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
        await db.sequelize.transaction(async (t) => {
            // Update name in user_account if changed
            if (user_name !== req.session.user_name) {
                await db.user_account.update(
                    { user_name },
                    { where: { id: req.session.user_id }, transaction: t }
                );
                req.session.user_name = user_name;
            }

            // Update user_settings
            await db.user_settings.update(
                {
                    theme,
                    email_notifications: email_notifications === "on",
                    email_digest_mode,
                    two_factor_enabled: two_factor_enabled === "on",
                    updatedAt: new Date(),
                },
                {
                    where: { user_id: req.session.user_id },
                    transaction: t,
                }
            );
        });
        req.session.theme = theme;
        return res.redirect("/settings?success=Settings%20updated");
    } catch (err) {
        logger.error(`Error updating settings: ${err}`);
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
        await db.user_account.update(
            {
                pending_email,
                email_verification_token: hashedToken,
                email_token_expiry: expires,
            },
            {
                where: { id: req.session.user_id },
            }
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
        logger.error(`Error sending email change verification: ${err}`);
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

        const user = await db.user_account.findOne({
            where: {
                email_verification_token: hashedToken,
                email_token_expiry: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.redirect("/settings/change-email?error=Invalid%20or%20Expired%20Token");
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.redirect(
                `/settings/finalize-email-change?token=${token}&error=Incorrect%20Password`
            );
        }

        const newEmail = user.pending_email;

        await db.sequelize.transaction(async (t) => {
            await user.update(
                {
                    email: newEmail,
                    pending_email: null,
                    email_verification_token: null,
                    email_token_expiry: null,
                },
                { transaction: t }
            );

            await db.notifications.create(
                {
                    user_id: user.id,
                    title: "Email Updated",
                    message: `Your account email has been successfully updated to ${newEmail}`,
                    type: "email_change",
                },
                { transaction: t }
            );
        });

        await req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ error: "Failed to log out", details: err.message });
                return res.redirect("/settings?error=Failed%20to%20Log%20Out");
            }
            res.clearCookie("connect.sid");
            return res.redirect("/settings/email-update-success");
        });
    } catch (err) {
        logger.error(`Error finalizing email change: ${err}`);
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

        const user = await db.user_account.findOne({
            where: { email_verification_token: hashedToken },
        });

        if (!user) {
            return res.redirect("/auth/login?error=Invalid%20Token");
        }

        const attemptedEmail = user.pending_email;

        await db.sequelize.transaction(async (t) => {
            await user.update(
                {
                    pending_email: null,
                    email_verification_token: null,
                    email_token_expiry: null,
                    require_password_reset: true,
                },
                { transaction: t }
            );

            await db.notifications.create(
                {
                    user_id: user.id,
                    title: "Unauthorized Email Change Attempt",
                    message:
                        "A request was made to change your email address that you did not authorize.",
                    type: "security_alert",
                },
                { transaction: t }
            );

            await db.sequelize.query("DELETE FROM session WHERE sess::json->>'user_id' = :id", {
                replacements: { id: user.id.toString() },
                transaction: t,
            });
        });

        logger.warn(
            `
            Unauthorized email change reported for user ID ${user.id} and attempted email ${attemptedEmail}
            `
        );

        return res.redirect(`/settings/account-secured?attempted_email=${attemptedEmail}`);
    } catch (err) {
        logger.error(`Error reporting unauthorized email change: ${err}`);
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
            await db.user_account.update(
                { pending_email: null, email_verification_token: null, email_token_expiry: null },
                { where: { email_token_expiry: { [Op.lt]: new Date() } } }
            );
        } catch (err) {
            logger.error(`Error clearing expired email change tokens: ${err}`);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);
