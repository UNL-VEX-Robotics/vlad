import nodemailer from 'nodemailer';

export const ROLES = {
    PENDING: 0,
    MEMBER: 1,
    LEAD: 2,
    ADMIN: 3,
    OWNER: 4,
};

export const SALT_ROUNDS = 12;
export const EMAIL_REGEX = /\w*@(?:\w*.)+/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Nodemailer Transporter
 * Configured using Gmail SMTP settings from environment variables.
 */
const verbose = process.env.VERBOSE === 'true';
export const TRANSPORTER = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: verbose,
  logger: verbose
})
