import nodemailer from 'nodemailer';
import pool from '../db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /\w*@(?:\w*.)+/;

const verbose = false;

// Configure the email transporter
// TODO: Remove debug and logger
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: verbose,
  logger: verbose
})

// Send a reset password email to the user
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
      `
      SELECT id FROM user_account WHERE email = $1
      `,
      [to]
    );

    if (!(results.rows[0])){
      return res.redirect(`/email?error=Invalid%20Email`);
    }

    await pool.query(
      `
      UPDATE user_account SET reset_token = $1, reset_expiry = $2 WHERE email = $3
      `,
      [resetToken, expires, to]
    );

    const host = req.get('host');
    const protocol = req.protocol;
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `"VLAD App" <${process.env.EMAIL_USER}>`, // Adds a nice display name
      to: to,
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
    </div>
  `
    };

    await transporter.sendMail(mailOptions);
    res.redirect('/email-sent');
    //res.status(200).json({ message: 'Email sent successfully' });
  }
  catch (err) {
    console.error(err);
    return res.redirect('/email?error=Server%20Error');
    //res.status(500).json({ error: 'Failed to send email' });
  }
}

// Reset the user's password using the provided token
export async function resetPassword(req, res) {
  const { token, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    // Redirect back with the error and the token (so they don't lose their place)
    return res.redirect(`/reset-password?token=${token}&error=Passwords%20do%20not%20match`);
  }

  if (newPassword.length < 8) {
    return res.redirect(`/reset-password?token=${token}&error=Password%20must%20be%20at%20least%208%20characters`)
  }

  try {
    // Find the user "connected" to this specific token
    const user = await pool.query(
      "SELECT * FROM user_account WHERE reset_token = $1 AND reset_expiry > NOW()",
      [token]
    );

    if (user.rows.length === 0) {
      return res.redirect('/email?error=Reenter%20Email');
      //return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash the new password and update the user's password and clear the reset token
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
    //res.status(500).json({ error: 'Failed to reset password' });
  }
}
