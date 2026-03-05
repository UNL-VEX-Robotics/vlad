import express from 'express';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/reset.js';
import adminRoutes from './routes/admin.js';
import subteamRoutes from './routes/subteam.js';
import userRoutes from './routes/user.js';
import notificationRoutes from './routes/notifications.js';
import { ROLES } from './constants.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { isAuthenticated, requireRole } from './middleware/auth.middleware.js';
import commonStyles from './views/layout.js';


import bodyParser from "body-parser";

const app = express();
const PostgresStore = pgSession(session);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  store: new PostgresStore({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.COOKIE_MAX_AGE),
    httpOnly: true,
    secure: false
  }
}));

app.use(async (req, res, next) => {
  if (req.session && req.session.user_id) {
    try {
      // Fetch multiple updated fields from the DB
      const result = await pool.query(
        'SELECT role, user_name, team_id FROM user_account WHERE id = $1',
        [req.session.user_id]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];

        // Sync all relevant variables to the session
        req.session.role = user.role;
        req.session.user_name = user.user_name; // Syncs name changes
        req.session.team_id = user.team_id;     // Syncs team switches
      }
    } catch (err) {
      console.error("Session sync error:", err);
    }
  }
  next();
});

// --- ROUTES ---

const auth = '/auth';
app.use(auth, authRoutes);

const reset = '/reset';
app.use(reset, emailRoutes);

const admin = '/admin';
app.use(admin, adminRoutes);

const subteam = '/subteam';
app.use(subteam, subteamRoutes);

const notifications = '/notifications';
app.use(notifications, notificationRoutes);

app.use('/', userRoutes);


app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// --- ROUTES ---

// Signup Page
app.get('/signup', (req, res) => res.redirect('/auth/signup'));

// Login Page
app.get('/login', (req, res) => res.redirect('/auth/login'));

// Main Dashboard Page
app.get('/', isAuthenticated, (req, res) => res.redirect('/dashboard'));

// Page with a profile for the specifed user
app.get('/profile', (req, res) => res.redirect('/user/profile'));

// Where the requests to join the team are located for admins
app.get('/team-requests', isAuthenticated, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT u.id, u.user_name, u.email 
             FROM user_account u 
             JOIN team t ON u.team_id = t.id 
             WHERE t.name = $1 AND u.role = 0`,
      [req.session.team]
    );

    const requestListHtml = requests.rows.map(r => `
            <div class="request-panel">
                <div class="request-details">
                    <div class="info-label">User</div>
                    <div class="info-value">${r.user_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${r.email}</div>
                </div>
                <div class="request-actions">
                    <form action="${admin}/approve-member" method="POST">
                        <input type="hidden" name="user_id" value="${r.id}">
                        <button type="submit" class="action-btn approve">Approve</button>
                    </form>
                    <form action="${admin}/reject-member" method="POST">
                        <input type="hidden" name="user_id" value="${r.id}">
                        <button type="submit" class="action-btn reject">Reject</button>
                    </form>
                </div>
            </div>
        `).join('') || '<div class="card" style="text-align:center; color:var(--text-muted);">No pending requests.</div>';

    res.send(`
        <html>
            <head>
                ${commonStyles}
                <style>
                    .request-panel {
                        background: var(--bg-card);
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        padding: 1.5rem;
                        max-width: 500px;
                        margin: 1rem auto;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    /* Override the global button width only for these actions */
                    .request-actions {
                        display: flex;
                        gap: 8px;
                    }
                    
                    .action-btn {
                        width: auto !important; /* Forces button to fit text */
                        padding: 8px 16px !important;
                        font-size: 0.8rem !important;
                    }

                    .approve {
                        background: #2f855a !important; /* Green for success */
                    }

                    .approve:hover {
                        background: #276749 !important;
                    }

                    /* The reject button will naturally use var(--accent-red) from commonStyles */

                    .back-nav {
                        max-width: 500px;
                        margin: 2rem auto 0.5rem;
                        display: flex;
                        align-items: center;
                    }
                </style>
            </head>
            <body>
                <div class="back-nav">
                    <a href="/dashboard" style="text-decoration:none; color:var(--accent-red); font-weight:700; font-size:0.9rem;">
                        ← BACK TO DASHBOARD
                    </a>
                </div>
                <h2 style="text-align:center; margin-bottom: 2rem;">Pending Requests</h2>
                ${requestListHtml}
            </body>
        </html>`);
  } catch (err) {
    res.status(500).send("Error loading requests");
  }
});

// Team Creation Page
app.get('/create-team', (req, res) => res.redirect('/auth/create-team'));

// Page to request to join a team
app.get('/join-team', (req, res) => res.redirect('/auth/join-team'));

// Page to collect email before a reset password email is sent
app.get('/email', (req, res) => {
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
    <div class="alert-box">
      ${error}
    </div>
  `;
  }
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="${reset}/send">
        <h2>Reset Password</h2>
        ${errorMessageHtml}
        <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
          Enter your email address and we'll send you a recovery link.
        </p>
        <label>Email Address</label>
        <input name="to" type="email" placeholder="email@example.com" required />
        <input type="submit" value="Send Reset Link" />
      </form>
      <form action="/login" method="GET">
        <button type="submit" class="secondary-btn">Back to Login</button>
      </form>
    </div>
  </body></html>`);
});

// Where you are sent after email is sent to user
app.get('/email-sent', (req, res) => {
  res.send(`
    <html>
      <head>
        ${commonStyles}
        <style>
          .success-icon {
            font-size: 3rem;
            color: #48bb78;
            margin-bottom: 1rem;
          }
          .instruction-box {
            background: #f7fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 0.9rem;
            color: #4a5568;
            border: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="card" style="text-align: center;">
          <div class="success-icon">✉️</div>
          <h2>Check Your Email</h2>
          <p style="color: #718096;">We've sent a password reset link to the email address provided.</p>
          
          <div class="instruction-box">
            <strong>Next Steps:</strong>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li>Click the link in the email to reset your password.</li>
              <li>Check your <strong>Spam</strong> folder if you don't see it.</li>
              <li>The link will expire in 1 hour.</li>
            </ul>
          </div>

          <form action="/login" method="GET">
            <button type="submit">Back to Login</button>
          </form>
          
          <p style="font-size: 0.8rem; margin-top: 15px; color: #a0aec0;">
            Didn't get the email? <a href="/email" style="color: #3182ce; text-decoration: none;">Try again</a>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Page where you reset your password accessed through link with specified token
app.get('/reset-password', (req, res) => {
  const tokenFromEmail = req.query.token;
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
    <div class="alert-box">
      ${error}
    </div>
  `;
  }

  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="${reset}/reset-password">
        <h2>Set New Password</h2>
        ${errorMessageHtml}
        <input type="hidden" name="token" value="${tokenFromEmail}" />
        
        <label>New Password</label>
        <ul style="padding-left: 18px; padding-bottom: 7px; margin: 0; font-size: 0.7rem;">
          <li>Minimum 8 characters</li>
          <li>Include at least one uppercase letter</li>
          <li>Include at least one number</li>
          <li>Include at least one special character (!@#$)</li>
        </ul>
        <div class="password-wrapper">
          <input type="password" id="newPass" name="newPassword" placeholder="Min. 8 characters" required />
          <span class="password-toggle-text" onclick="toggle('newPass', this)">Show</span>
        </div>

        <label>Confirm Password</label>
        <div class="password-wrapper">
          <input type="password" id="confirmPass" name="confirmPassword" placeholder="Repeat password" required />
          <span class="password-toggle-text" onclick="toggle('confirmPass', this)">Show</span>
        </div>

        <input type="submit" value="Update Password" />
      </form>
    </div>
    <script>
      function toggle(inputId, element) {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
          input.type = "text";
          element.textContent = "Hide";
        } else {
          input.type = "password";
          element.textContent = "Show";
        }
      }
    </script>
  </body></html>`);
});

// Where you are sent after password is reset
app.get('/reset-confirmation', (req, res) => {
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card" style="text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
      <h2>Password Reset</h2>
      <p style="color: #4a5568;">Your password has been successfully updated.</p>
      <form action="/login" method="GET">
        <button type="submit">Log In Now</button>
      </form>
    </div>
  </body></html>`);
});

// Where team leads can create subteams for their team
app.get('/create-subteam', isAuthenticated, requireRole(ROLES.ADMIN), (req, res) => {
  const error = req.query.error;

  res.send(`
    <html>
      <head>
        ${commonStyles}
      </head>
      <body>
        <div class="card">
          <form action="/subteam/create-subteam" method="POST">
            <h2 style="border-bottom: 2px solid var(--accent-red); padding-bottom: 10px; margin-bottom: 20px;">
                Initialize Subteam
            </h2>
            
            ${error ? `
                <div class="alert-box" style="margin-bottom: 20px;">
                    <span style="margin-right: 8px;"></span> ${error}
                </div>` : ''}

            <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 25px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
                Primary Team: <span style="color: var(--text-main);">${req.session.team}</span>
            </p>

            <label>Subteam Designation</label>
            <input type="text" name="subteamName" placeholder="Enter subteam name..." required autofocus />

            <div style="margin-top: 25px;">
                <button type="submit">Deploy Subteam</button>
                <a href="/dashboard" style="text-decoration: none;">
                    <button type="button" class="secondary-btn" style="margin-top: 10px;">Return to Dashboard</button>
                </a>
            </div>
          </form>
        </div>
      </body>
    </html>`);
});

// A notification hub that allows users to see all their notifications in one place and mark them as read
app.get('/notifications', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, title, message, created_at, is_read 
             FROM notifications 
             WHERE user_id = $1 
             AND created_at > NOW() - INTERVAL '30 days'
             ORDER BY created_at DESC`,
            [req.session.user_id]
        );

        const notifications = result.rows;
        
        const notifHtml = notifications.length > 0 ? notifications.map(n => `
            <div class="notif-card ${n.is_read ? 'read' : 'unread'}" 
                 style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 18px; border-radius: 8px; margin-bottom: 15px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: var(--text-heading); font-size: 1.05rem;">${n.title}</h4>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            ${new Date(n.created_at).toLocaleString()}
                        </span>
                    </div>
                    <form action="/notifications/delete" method="POST" style="margin:0;">
                        <input type="hidden" name="notification_id" value="${n.id}">
                        <button type="submit" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 1.2rem; padding:0 5px;" title="Delete">×</button>
                    </form>
                </div>
                
                <p style="margin: 12px 0 0 0; font-size: 0.95rem; color: #ffffff; line-height: 1.5; opacity: 1;">${n.message}</p>
                
                ${!n.is_read ? `
                    <form action="/notifications/mark-as-read" method="POST" style="margin-top: 15px;">
                        <input type="hidden" name="notification_id" value="${n.id}">
                        <input type="hidden" name="redirect" value="/notifications">
                        <button type="submit" style="background:none; border:none; color:var(--accent-red); font-size: 0.75rem; font-weight:bold; cursor:pointer; text-transform:uppercase; padding:0;">
                            Mark as read
                        </button>
                    </form>
                ` : ''}
            </div>
        `).join('') : '<p style="text-align:center; color:var(--text-muted); margin-top: 3rem;">No recent notifications.</p>';

        res.send(`
            <html>
                <head>
                    ${commonStyles}
                    <style>
                        /* Centering the Hub Header */
                        .hub-header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .unread { border-left: 4px solid var(--accent-red) !important; }
                        .read { opacity: 0.8; }

                        /* Reverted Global Action Button Styles */
                        .global-actions {
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                            margin-bottom: 25px;
                        }
                        .action-btn-reverted {
                            background: none;
                            border: none;
                            color: var(--accent-red);
                            font-size: 0.7rem;
                            font-weight: bold;
                            cursor: pointer;
                            text-transform: uppercase;
                            letter-spacing: 0.05rem;
                        }
                        
                        .info-banner {
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px dashed var(--border-color);
                            padding: 10px;
                            border-radius: 6px;
                            text-align: center;
                            font-size: 0.8rem;
                            color: var(--text-muted);
                            margin-bottom: 30px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container" style="max-width: 650px; margin: 50px auto; padding: 0 20px;">
                        
                        <div class="hub-header">
                            <h2 style="color: var(--text-heading); margin-bottom: 10px;">Notification Hub</h2>
                            
                            <div class="global-actions">
                                <form action="/notifications/mark-all-as-read" method="POST" style="margin:0;">
                                    <button type="submit" class="action-btn-reverted">✓ Mark All Read</button>
                                </form>
                                <form action="/notifications/delete-all" method="POST" style="margin:0;" onsubmit="return confirm('Delete all notifications?')">
                                    <button type="submit" class="action-btn-reverted">🗑 Delete All</button>
                                </form>
                            </div>
                        </div>

                        <div class="info-banner">
                            Notifications are automatically cleared after 30 days.
                        </div>

                        <div class="notif-list">
                            ${notifHtml}
                        </div>

                        <div style="margin-top: 40px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 30px;">
                            <a href="/dashboard" style="text-decoration: none;">
                                <button type="button" class="secondary-btn">Back to Dashboard</button>
                            </a>
                        </div>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading notifications");
    }
});

export default app;