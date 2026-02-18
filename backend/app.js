import express from 'express';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js';
import adminRoutes from './routes/admin.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple'

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
  secret: process.env.SESSION_SECRET || 'vlad_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false
  }
}));

// Checks if a users has a session before they can access the specified page
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return next();
  }
  else {
    res.redirect('/login');
  }
};

// Checks if the user is an Admin on their team before they can access the specified page
const isAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  else {
    res.redirect('/dashboard');
  }
};

app.use('/auth', authRoutes);

app.use('/email', emailRoutes);

app.use('/admin', adminRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// This holds the styles for the HTML including a light and dark mode that go by 
// what the users system settings are this is here to making changing application looks
const commonStyles = `
<style>
    :root {
        /* Light Mode: White and Red */
        --bg-body: #f7f9fc;
        --bg-card: #ffffff;
        --bg-sidebar: #ffffff;
        --text-main: #1a1a1a;
        --text-heading: #1a1a1a;
        --text-label: #4a5568;
        --text-muted: #718096;
        --border-color: #e2e8f0;
        --input-bg: #ffffff;
        --btn-secondary-bg: #edf2f7;
        --btn-secondary-text: #4a5568;
        --accent-red: #e53e3e;
        --accent-hover: #c53030;
        
        --badge-approved-bg: #c6f6d5;
        --badge-approved-text: #22543d;
        --badge-pending-bg: #fff5f5;
        --badge-pending-text: #c53030;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            /* Dark Mode: Black and Red */
            --bg-body: #000000;
            --bg-card: #121212;
            --bg-sidebar: #121212;
            --text-main: #f7fafc;
            --text-heading: #ffffff;
            --text-label: #a0aec0;
            --text-muted: #718096;
            --border-color: #2d2d2d;
            --input-bg: #1a1a1a;
            --btn-secondary-bg: #2d2d2d;
            --btn-secondary-text: #f7fafc;
            --accent-red: #ff4d4d;
            --accent-hover: #ff6666;

            --badge-approved-bg: #1c4532;
            --badge-approved-text: #9ae6b4;
            --badge-pending-bg: #441919;
            --badge-pending-text: #feb2b2;
        }
    }

    body { font-family: 'Inter', sans-serif; margin: 0; background: var(--bg-body); color: var(--text-main); display: flex; flex-direction: column; min-height: 100vh; transition: 0.3s; }
    .card { background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); width: 100%; max-width: 400px; margin: auto; border: 1px solid var(--border-color); }
    h2 { margin-top: 0; color: var(--text-heading); letter-spacing: -0.02em; }
    label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.85rem; color: var(--text-label); text-transform: uppercase; }
    input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; background: var(--input-bg); color: var(--text-main); font-size: 1rem; }
    input:focus { outline: none; border-color: var(--accent-red); }
    
    button, input[type="submit"] { width: 100%; padding: 12px; border: none; border-radius: 8px; background: var(--accent-red); color: white; font-weight: 700; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.03em; }
    button:hover, input[type="submit"]:hover { background: var(--accent-hover); transform: translateY(-1px); }
    
    .secondary-btn { background: var(--btn-secondary-bg) !important; color: var(--btn-secondary-text) !important; margin-top: 4px; }
    .secondary-btn:hover { background: var(--border-color) !important; }
    
    /* Sidebar */
    .sidebar { width: 280px; background: var(--bg-sidebar); border-left: 1px solid var(--border-color); padding: 20px; height: 100vh; box-sizing: border-box; }
    .member-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); position: relative; }
    .dropdown-menu { display: none; position: absolute; right: 0; top: 30px; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 10px 15px rgba(0,0,0,0.5); z-index: 100; width: 160px; border-radius: 8px; overflow: hidden;}
    .dropdown-menu button { border-radius: 0; border: none; border-bottom: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); text-align: left; padding: 12px; font-size: 0.85rem; text-transform: none; letter-spacing: normal; }
    .dropdown-menu button:hover { background: var(--accent-red); color: white; }

    /* Profile UI */
    .info-group { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .info-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
    .info-value { font-size: 1.1rem; color: var(--text-main); font-weight: 500; }
    .badge-approved { background: var(--badge-approved-bg); color: var(--badge-approved-text); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .badge-pending { background: var(--badge-pending-bg); color: var(--badge-pending-text); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }

    /* Password Toggle Fix */
    .password-wrapper { position: relative; display: flex; align-items: center; margin-bottom: 15px; width: 100%; }
    .password-wrapper input { margin-bottom: 0; padding-right: 60px; }
    .password-toggle-text { position: absolute; right: 15px; font-size: 0.7rem; font-weight: 800; color: var(--accent-red); cursor: pointer; user-select: none; text-transform: uppercase; }
    .password-toggle-text:hover { color: var(--accent-hover); }
</style>
`;

// --- ROUTES ---

// Signup Page
app.get('/signup', (req, res) => {
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
      <div style="color: #e53e3e; background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; text-align: center;">
        ${error}
      </div>
    `;
  }
  res.send(`<html><head>${commonStyles}</head><body>
        <div class="card">
            <form method="POST" action="/auth/signup">
                <h2>Sign Up</h2>
                ${errorMessageHtml}
                <label>Username</label><input name="user_name" placeholder="Username" required />
                <label>Email</label><input name="email" type="email" placeholder="Email" required />
                <label>Password</label>
                <div class="password-wrapper">
                  <input type="password" id='pass' name="password" placeholder="Password" required />
                  <span class="password-toggle-text" onclick="toggle('pass', this)">Show</span>
                </div>
                <label>Confirm Password</label>
                <div class="password-wrapper">
                  <input type="password" id='confirmPass' name="confirmPassword" placeholder="Confirm Password" required />
                  <span class="password-toggle-text" onclick="toggle('confirmPass', this)">Show</span>
                </div>
                
                <input type="submit" value="Create Account" />
            </form>
            <form method="GET" action="/login"><button type="submit" class="secondary-btn">Already have an account? Login</button></form>
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

// Login Page
app.get('/login', (req, res) => {
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
      <div style="color: #e53e3e; background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; text-align: center;">
        ${error}
      </div>
    `;
  }

  res.send(`<html><head>${commonStyles}</head><body>
        <div class="card">
            <form method="POST" action="/auth/login">
                <h2>Log In</h2>
                ${errorMessageHtml}
                <label>Email</label><input name="email" placeholder="Email" required />
                <label>Password</label>
                <div class="password-wrapper">
                  <input type="password" id="pass" name="password" placeholder="Password" required />
                  <span class="password-toggle-text" onclick="toggle('pass', this)">Show</span>
                </div>

                <input type="submit" value="Login" />
            </form>
            <div style="margin-top: 10px;">
                <form action="/email" method="GET"><button type="submit" class="secondary-btn">Forgot Password?</button></form>
                <form action="/signup" method="GET"><button type="submit" class="secondary-btn">New here? Signup</button></form>
            </div>
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

// Main Dashboard Page
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    let memberListHtml = '';
    let approvalMessage = '';

    const userCheck = await pool.query(
      `SELECT is_approved, team_id FROM user_account WHERE id = $1`,
      [req.session.user_id]
    );
    const isApproved = userCheck.rows[0]?.is_approved;
    const teamIdFromDb = userCheck.rows[0]?.team_id;

    if (req.session.team && isApproved) {
      const membersResult = await pool.query(
        `SELECT id, user_name FROM user_account 
         WHERE team_id = (SELECT id FROM team WHERE name = $1) 
         AND is_approved = TRUE`,
        [req.session.team]
      );
      memberListHtml = membersResult.rows.map(m => `
        <li class="member-row">
          <span>${m.user_name}</span>
          <div class="menu-container">
            <button class="dot-btn" onclick="toggleMenu(event, 'menu-${m.id}')">⋮</button>
            <div id="menu-${m.id}" class="dropdown-menu">
                <form action="/profile" method="GET" style="margin:0;"><input type="hidden" name="user_id" value="${m.id}"><button type="submit">View Profile</button></form>
                <form action="/report" method="POST" style="margin:0;"><input type="hidden" name="user_id" value="${m.id}"><button type="submit">Report</button></form>
            </div>
          </div>
        </li>
      `).join('');
    } else if (req.session.team && !isApproved && teamIdFromDb !== null) {
      // Adjusted for Dark Mode compatibility
      approvalMessage = `<div style="background: var(--badge-pending-bg); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; color: var(--badge-pending-text); margin-bottom: 20px;">⏳ Waiting for team lead approval...</div>`;
    }

    res.send(`
    <html>
      <head>
        ${commonStyles}
        <style>
          body { display: flex; flex-direction: row; }
          .main-content { flex: 1; padding: 40px; }
          
          .sidebar { 
            width: 280px; 
            background: var(--bg-sidebar); 
            border-left: 1px solid var(--border-color); 
            padding: 20px; 
            height: 100vh; 
            box-sizing: border-box; 
          }
          
          .member-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 5px 0; 
            border-bottom: 1px solid var(--border-color); 
            position: relative; 
          }
          
          .dot-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); }
          
          .dropdown-menu { 
            display: none; 
            position: absolute; 
            right: 0; 
            top: 25px; 
            background: var(--bg-card); 
            border: 1px solid var(--border-color); 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            z-index: 100; 
            width: 140px; 
            border-radius: 6px; 
            overflow: hidden;
          }
          
          .dropdown-menu button { 
            border-radius: 0; 
            border: none; 
            border-bottom: 1px solid var(--border-color); 
            background: var(--bg-card); 
            color: var(--text-main); 
            text-align: left; 
            padding: 8px 12px; 
            font-size: 0.85rem; 
          }
          
          .dropdown-menu button:hover { background: var(--btn-secondary-bg); }
          .dropdown-menu form:last-child button { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="main-content">
          <h2 style="color: var(--text-heading);">Welcome, ${req.session.user_name}</h2>
          ${approvalMessage}

          <div style="max-width: 400px;">
            ${(!req.session.team || teamIdFromDb === null) ? `
              <form action="/create-team" method="GET"><button type="submit">Create Team</button></form>
              <form action="/join-team" method="GET"><button type="submit" class="secondary-btn">Join Team</button></form>
            ` : isApproved ? `<p><strong>✓ Active Member of: ${req.session.team}</strong></p>` : ''}

            ${req.session.admin ? `<form action="/team-requests" method="GET"><button type="submit" style="background:#805ad5; margin-top:4px;">Manage Team Requests</button></form>` : ''}
            
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border-color);">
            <form action="/email" method="GET"><button type="submit" class="secondary-btn">Reset Password</button></form>
            <form action="/health" method="GET"><button type="submit" class="secondary-btn">System Health</button></form>
            <form action="/auth/logout" method="POST"><button type="submit" style="background:#e53e3e; margin-top:4px;">Log Out</button></form>
          </div>
        </div>

        <div class="sidebar">
          <h3 style="margin-top:0; font-size: 1.1rem; color: var(--text-heading);">${req.session.team ? 'Team: ' + req.session.team : 'No Team'}</h3>
          <label>MEMBERS</label>
          <ul style="list-style:none; padding:0;">
            ${memberListHtml || `<li style="color: var(--text-muted); font-size:0.9rem;">No members visible</li>`}
          </ul>
        </div>

        <script>
          function toggleMenu(event, id) {
            event.stopPropagation();
            document.querySelectorAll('.dropdown-menu').forEach(m => { if(m.id !== id) m.style.display = 'none'; });
            const menu = document.getElementById(id);
            menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
          }
          document.addEventListener('click', () => { document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); });
        </script>
      </body></html>`);
  } catch (err) {
    res.status(500).send("Error loading dashboard");
  }
});

// Page with a profile for the specifed user
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const targetUserId = req.query.user_id;
    const userResult = await pool.query(
      `SELECT u.user_name, u.email, u.is_approved, t.name as team_name 
             FROM user_account u 
             LEFT JOIN team t ON u.team_id = t.id 
             WHERE u.id = $1`,
      [targetUserId]
    );

    if (userResult.rows.length === 0) return res.status(404).send("User not found");
    const user = userResult.rows[0];

    // Using standard quotes inside the send string to avoid parsing errors
    res.send(`
        <html>
            <head>
                ${commonStyles}
                <style>
                    .profile-header { text-align: center; margin-bottom: 2rem; }
                    .avatar-circle { 
                        width: 80px; height: 80px; background: #3182ce; color: white; 
                        border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-size: 2rem; margin: 0 auto 1rem;
                        text-transform: uppercase;
                    }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="card" style="max-width: 500px;">
                    <div class="profile-header">
                        <div class="avatar-circle">${user.user_name.charAt(0)}</div>
                        <h2 style="color: var(--text-heading);">${user.user_name}</h2>
                        <span class="badge ${user.is_approved ? '' : 'badge-pending'}">
                            ${user.is_approved ? "" : '⏳ Pending Approval'}
                        </span>
                    </div>

                    <div class="info-group">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${user.email}</div>
                    </div>

                    <div class="info-group">
                        <div class="info-label">Current Team</div>
                        <div class="info-value">${user.team_name || 'No Team Assigned'}</div>
                    </div>

                    <div style="margin-top: 2rem;">
                        <a href="/dashboard" style="text-decoration: none;">
                            <button type="button" class="secondary-btn">Back to Dashboard</button>
                        </a>
                    </div>
                </div>
            </body>
        </html>`);
  } catch (err) {
    res.status(500).send("Error loading profile");
  }
});

// Where the requests to join the team are located for admins
app.get('/team-requests', isAdmin, async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT id, user_name, email FROM user_account 
       WHERE team_id = (SELECT id FROM team WHERE lead_id = $1) AND is_approved = FALSE`,
      [req.session.user_id]
    );

    let listItems = requests.rows.length === 0 ? "<p>No pending requests.</p>" : requests.rows.map(user => `
        <li style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0;">
            <div><strong>${user.user_name}</strong><br><small style="color:#718096">${user.email}</small></div>
            <div>
                <form action="/admin/approve-member" method="POST" style="display:inline;"><input type="hidden" name="user_id" value="${user.id}"><button type="submit" style="width:auto; background:#48bb78; padding:5px 15px;">Accept</button></form>
                <form action="/admin/reject-member" method="POST" style="display:inline;"><input type="hidden" name="user_id" value="${user.id}"><button type="submit" style="width:auto; background:#f56565; padding:5px 15px;">Reject</button></form>
            </div>
        </li>`).join('');

    res.send(`<html><head>${commonStyles}</head><body style="padding:40px;">
        <div style="max-width:600px; margin:auto;">
            <h2>Team Join Requests</h2>
            <ul style="list-style:none; padding:0;">${listItems}</ul>
            <a href="/dashboard"><button class="secondary-btn">Back to Dashboard</button></a>
        </div>
    </body></html>`);
  } catch (err) { res.status(500).send("Error loading requests."); }
});

// Team Creation Page
app.get('/create-team', isAuthenticated, (req, res) => {
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/auth/create-team">
        <h2>Create A New Team</h2>
        <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
          As the creator, you will be the team lead and manage join requests.
        </p>
        <label>Team Name</label>
        <input name="team_name" placeholder="e.g. Alpha Squad" required />
        <input type="submit" value="Establish Team" />
      </form>
      <form action="/dashboard" method="GET">
        <button type="submit" class="secondary-btn">Cancel</button>
      </form>
    </div>
  </body></html>`);
});

// Page to request to join a team
app.get('/join-team', isAuthenticated, (req, res) => {
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/auth/join-team">
        <h2>Join Team</h2>
        <label>Search Team Name</label>
        <input name="team_name" placeholder="Enter exact team name" required />
        <input type="submit" value="Send Join Request" />
      </form>
      <p style="font-size: 0.8rem; color: #a0aec0; text-align: center; margin-top: 15px;">
        Note: You will need to be accepted by the team lead.
      </p>
      <form action="/dashboard" method="GET">
        <button type="submit" class="secondary-btn">Back</button>
      </form>
    </div>
  </body></html>`);
});

// Page to collect email before a reset password email is sent
app.get('/email', (req, res) => {
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
      <div style="color: #e53e3e; background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; text-align: center;">
        ${error}
      </div>
    `;
  }
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/email/send">
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
      <div style="color: #e53e3e; background: #fff5f5; border: 1px solid #feb2b2; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; text-align: center;">
        ${error}
      </div>
    `;
  }

  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/email/reset-password">
        <h2>Set New Password</h2>
        ${errorMessageHtml}
        <input type="hidden" name="token" value="${tokenFromEmail}" />
        
        <label>New Password</label>
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

export default app;