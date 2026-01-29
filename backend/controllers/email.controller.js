import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

export async function sendTestEmail(req, res) {
  const { to } = req.body;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Test Email',
    text: 'This is a test email from the VLAD application.'
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to send email' });
  }
}
