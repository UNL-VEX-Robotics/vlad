import db from "../db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodeCron from "node-cron";
import { TRANSPORTER, SALT_ROUNDS, EMAIL_REGEX, PASSWORD_REGEX } from "../utils/constants.js";
import logger from "../utils/logger.js";
import { withLayout } from "../views/layout.js";
import { Op } from "sequelize";
import {
    forgotPasswordPage,
    emailSentPage,
    setNewPasswordPage,
    resetConfirmationPage,
} from "../views/reset.view.js";

/**
 * Renders the forgot password page.
 * @param {Object} req - Express request object. Can contain an optional query parameter 'error' for displaying error messages.
 * @param {Object} res - Express response object. Sends the rendered HTML page for password reset requests.
 */
export const renderForgotPassword = (req, res) => {
    const error = req.query.error;
    const content = forgotPasswordPage(error);

    // Using withLayout to keep the CSS/Header consistent
    res.send(withLayout("Reset Password", content, req));
};

/**
 * Renders the email sent page.
 * @param {Object} req - Express request object. Can contain an optional query parameter 'error' for displaying error messages.
 * @param {Object} res - Express response object. Sends the rendered HTML page for password reset requests.
 */
export const renderEmailSent = (req, res) => {
    const content = emailSentPage();
    res.send(withLayout("Email Sent", content, req));
};

/**
 * Renders the reset password form page.
 * @param {Object} req - Express request object. Can contain an optional query parameter 'error' for displaying error messages.
 * @param {Object} res - Express response object. Sends the rendered HTML page for password reset requests.
 */
export const renderResetPassword = (req, res) => {
    const token = req.query.token;
    const error = req.query.error;

    // If there is no token, you might want to redirect them back to the forgot-password page
    if (!token && !error) {
        return res.redirect("/reset/forgot-password");
    }

    const content = setNewPasswordPage(token, error);
    res.send(withLayout("Set New Password", content, req));
};

/**
 * Renders the reset confirmation form page.
 * @param {Object} req - Express request object. Can contain an optional query parameter 'error' for displaying error messages.
 * @param {Object} res - Express response object. Sends the rendered HTML page for password reset requests.
 */
export const renderResetConfirmation = (req, res) => {
    const content = resetConfirmationPage();
    res.send(withLayout("Password Reset Successful", content, req));
};

/**
 * Empty the reset tokens from all user records after they expire.
 */
nodeCron.schedule(
    "0 2 * * *",
    async () => {
        try {
            await db.user_account.update(
                { reset_token: null, reset_expiry: null },
                {
                    where: {
                        reset_expiry: { [Op.lt]: new Date() },
                    },
                }
            );
        } catch (err) {
            logger.error("Error clearing expired reset tokens:", err);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);

/**
 * Generates a password reset token and sends an email to the user.
 * 1. Validates the email format.
 * 2. Checks if the user exists in the database.
 * 3. Saves a 32-byte hex token and a 1-hour expiry to the user record.
 * 4. Sends a styled HTML email with a reset link.
 * @param {Object} req - Express request object. Expects req.body.to (email).
 * @param {Object} res - Express response object. Redirects to status pages.
 */
export async function sendResetPasswordEmail(req, res) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour later
    const { to } = req.body;

    try {
        // Check if email is valid
        const clean_email = to.trim().toLowerCase();
        if (!EMAIL_REGEX.test(clean_email)) {
            return res.redirect("/reset/email-sent");
        }

        const user = await db.user_account.findOne({
            where: { email: clean_email },
            attributes: ["id"],
        });

        if (!user) {
            return res.redirect("/reset/email-sent");
        }

        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        await user.update({
            reset_token: hashedToken,
            reset_expiry: expires,
        });

        const host = req.get("host");
        const protocol = req.protocol;
        const resetLink = `${protocol}://${host}/reset/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: `"VLAD App" <${process.env.EMAIL_USER}>`,
            to: clean_email,
            subject: "Reset Your VLAD Password",
            html: `
    <div style="font-family: sans-serif; background-color: #f4f7f9; padding: 40px 10px; line-height: 1.6;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #3182ce; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">VLAD</h1>
        </div>
        <div style="padding: 30px; color: #4a5568;">
          <h2 style="color: #2d3748; margin-top: 0;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your VLAD account. If you didn't make this request, you can safely ignore this email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #3182ce; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
               Reset My Password
            </a>
          </div>
          <p style="font-size: 0.9rem; color: #718096;">
            <strong>Note:</strong> This link will expire in <strong>1 hour</strong> for your security.
          </p>
        </div>
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #edf2f7;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">
            If the button above doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: #3182ce;">${resetLink}</a>
          </p>
        </div>
      </div>
    </div>`,
        };

        await TRANSPORTER.sendMail(mailOptions);
        res.redirect("/reset/email-sent");
    } catch (err) {
        logger.error("Error sending password reset email:", err);
        return res.redirect("/reset/forgot-password?error=Server%20Error");
    }
}

/**
 * Validates a reset token and updates the user's password.
 * 1. Checks that the new password matches the confirmation.
 * 2. Validates password length and complexity (regex).
 * 3. Queries for a user with the matching token that has not expired.
 * 4. Hashes the new password using bcrypt.
 * 5. Updates the database and clears the reset token/expiry.
 * @param {Object} req - Express request object. Expects req.body: {token, newPassword, confirmPassword}.
 * @param {Object} res - Express response object. Redirects to confirmation or error pages.
 */
export async function resetPassword(req, res) {
    const { token, newPassword, confirmPassword } = req.body;

    if (
        newPassword !== confirmPassword ||
        newPassword.length < 8 ||
        !PASSWORD_REGEX.test(newPassword)
    ) {
        const errorMsg = "Validation failed";
        return res.redirect(
            `/reset/reset-password?token=${token}&error=${encodeURIComponent(errorMsg)}`
        );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    try {
        const user = await db.user_account.findOne({
            where: {
                reset_token: hashedToken,
                reset_expiry: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.redirect("/reset/forgot-password?error=Reenter%20Email");
        }

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await user.update({
            password_hash: hashed,
            reset_token: null,
            reset_expiry: null,
        });

        res.redirect("/reset/reset-confirmation");
    } catch (err) {
        logger.error("Error resetting password:", err);
        return res.redirect("/reset-password?error=Server%20Error");
    }
}
