import nodemailer from 'nodemailer';
import pool from '../db.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Configure the email transporter
// TODO: Remove debug and logger
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
  logger: true
})

// Send a reset password email to the user
// TODO: remove the console logs 
export async function sendResetPasswordEmail(req, res) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour later
  console.log("Generated reset token: " + resetToken);
  
  try {
    await pool.query(
      `
      UPDATE user_account SET reset_token = $1, reset_expiry = $2 WHERE email = $3
      `,
      [resetToken, expires, req.body.to]
    );

    const { to } = req.body;
    const host = req.get('host');
    const protocol = req.protocol;
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'Password Reset - VLAD Application',
      html: `<h1>Reset your password</h1>
          <p><p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p></p>`
    };

    await transporter.sendMail(mailOptions);
    console.log("Successfully sent email to " + to);
    res.status(200).json({ message: 'Email sent successfully' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to send email' });
  }
}

// Reset the user's password using the provided token
// TODO: remove console logs
export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try{
    // Find the user "connected" to this specific token
    const user = await pool.query(
      "SELECT * FROM user_account WHERE reset_token = $1 AND reset_expiry > NOW()",
      [token]
    );

    console.log("User found for token: ", user.rows);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

      // Hash the new password and update the user's password and clear the reset token
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      "UPDATE user_account SET password_hash = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2",
      [hashed, user.rows[0].id]
    );

    res.redirect('/reset-confirmation');
  }
  catch (err){
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}
