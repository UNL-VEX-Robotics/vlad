import nodemailer from 'nodemailer';
import pool from '../db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /\w*@(?:\w*.)+/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const verbose = false;

/**
 * Nodemailer Transporter
 * Configured using Gmail SMTP settings from environment variables.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: verbose,
  logger: verbose
})

/**
 * Generates a password reset token and sends an email to the user.
 * 1. Validates the email format.
 * 2. Checks if the user exists in the database.
 * 3. Saves a 32-byte hex token and a 1-hour expiry to the user record.
 * 4. Sends a styled HTML email with a reset link.
 * * @param {Object} req - Express request object. Expects req.body.to (email).
 * @param {Object} res - Express response object. Redirects to status pages.
 */
export async function sendResetPasswordEmail(req, res) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour later
  const { to } = req.body;

  try {
    // Check if email is valid
    const clean_email = to.trim().toLowerCase();
    if (!EMAIL_REGEX.test((clean_email))) {
      return res.redirect(`/email?error=Invalid%20Email`);
    }

    const results = await pool.query(
      `SELECT id FROM user_account WHERE email = $1`,
      [clean_email]
    );

    if (!(results.rows[0])){
      return res.redirect(`/email?error=Invalid%20Email`);
    }

    await pool.query(
      `UPDATE user_account SET reset_token = $1, reset_expiry = $2 WHERE email = $3`,
      [resetToken, expires, clean_email]
    );

    const host = req.get('host');
    const protocol = req.protocol;
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `"VLAD App" <${process.env.EMAIL_USER}>`, 
      to: clean_email,
      subject: 'Reset Your VLAD Password',
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
    </div>`
    };

    await transporter.sendMail(mailOptions);
    res.redirect('/email-sent');
  }
  catch (err) {
    console.error(err);
    return res.redirect('/email?error=Server%20Error');
  }
}

/**
 * Validates a reset token and updates the user's password.
 * 1. Checks that the new password matches the confirmation.
 * 2. Validates password length and complexity (regex).
 * 3. Queries for a user with the matching token that has not expired.
 * 4. Hashes the new password using bcrypt.
 * 5. Updates the database and clears the reset token/expiry.
 * * @param {Object} req - Express request object. Expects req.body: {token, newPassword, confirmPassword}.
 * @param {Object} res - Express response object. Redirects to confirmation or error pages.
 */
export async function resetPassword(req, res) {
  const { token, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.redirect(`/reset-password?token=${token}&error=Passwords%20do%20not%20match`);
  }

  if (newPassword.length < 8) {
    return res.redirect(`/reset-password?token=${token}&error=Password%20must%20be%20at%20least%208%20characters`)
  }

  if (!passwordRegex.test(newPassword)){
    return res.redirect(`/reset-password?token=${token}&error=Password%20does%20not%20requirements`);
  }

  try {
    const user = await pool.query(
      "SELECT * FROM user_account WHERE reset_token = $1 AND reset_expiry > NOW()",
      [token]
    );

    if (user.rows.length === 0) {
      return res.redirect('/email?error=Reenter%20Email');
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      "UPDATE user_account SET password_hash = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2",
      [hashed, user.rows[0].id]
    );

    res.redirect('/reset-confirmation');
  }
  catch (err) {
    console.error(err);
    return res.redirect('/reset-password?error=Server%20Error');
  }
}