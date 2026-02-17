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

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return next();
  }
  else {
    res.redirect('/login');
  }
};

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

// --- STYLING CONSTANT (Shared across all pages for a professional look) ---
const commonStyles = `
<style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; background: #f0f2f5; color: #1a1a1a; display: flex; flex-direction: column; min-height: 100vh; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); width: 100%; max-width: 400px; margin: auto; }
    h2 { margin-top: 0; color: #2d3748; }
    label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #4a5568; }
    input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 6px; box-sizing: border-box; }
    button, input[type="submit"] { 
        width: 100%; padding: 10px; border: none; border-radius: 6px; 
        background: #3182ce; color: white; font-weight: 600; cursor: pointer; transition: background 0.2s; 
    }
    button:hover { background: #2b6cb0; }
    .secondary-btn { background: #edf2f7; color: #4a5568; margin-top: 10px; }
    .secondary-btn:hover { background: #e2e8f0; }
    form { margin: 0; }
</style>
`;

// --- ROUTES ---

app.get('/signup', (req, res) => {
    res.send(`<html><head>${commonStyles}</head><body>
        <div class="card">
            <form method="POST" action="/auth/signup">
                <h2>Sign Up</h2>
                <label>Username</label><input name="user_name" required />
                <label>Email</label><input name="email" type="email" required />
                <label>Password</label><input type="password" name="password" required />
                <input type="submit" value="Create Account" />
            </form>
            <form method="GET" action="/login"><button type="submit" class="secondary-btn">Already have an account? Login</button></form>
        </div>
    </body></html>`);
});

app.get('/login', (req, res) => {
    res.send(`<html><head>${commonStyles}</head><body>
        <div class="card">
            <form method="POST" action="/auth/login">
                <h2>Log In</h2>
                <label>Email</label><input name="email" required />
                <label>Password</label><input type="password" name="password" required />
                <input type="submit" value="Login" />
            </form>
            <div style="margin-top: 10px;">
                <form action="/email" method="GET"><button type="submit" class="secondary-btn">Forgot Password?</button></form>
                <form action="/signup" method="GET"><button type="submit" class="secondary-btn">New here? Signup</button></form>
            </div>
        </div>
    </body></html>`);
});

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
                <form action="/report" method="POST"><input type="hidden" name="user_id" value="${m.id}"><button type="submit">Report</button></form>
            </div>
          </div>
        </li>
      `).join('');
    } else if (req.session.team && !isApproved && teamIdFromDb !== null) {
      approvalMessage = `<div style="background: #fffaf0; border: 1px solid #fbd38d; padding: 15px; border-radius: 8px; color: #9c4221; margin-bottom: 20px;">⏳ Waiting for team lead approval...</div>`;
    }

    res.send(`
    <html>
      <head>
        ${commonStyles}
        <style>
          body { display: flex; flex-direction: row; }
          .main-content { flex: 1; padding: 40px; }
          .sidebar { width: 280px; background: white; border-left: 1px solid #e2e8f0; padding: 20px; height: 100vh; box-sizing: border-box; }
          .member-row { display: flex; justify-content: space-between; align-items: center; padding: 1px 0; border-bottom: 1px solid #f7fafc; position: relative; }
          .dot-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #a0aec0; }
          .dropdown-menu { display: none; position: absolute; right: 0; top: 15px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 100; width: 140px; border-radius: 6px; overflow: hidden;}
          .dropdown-menu button { border-radius: 0; border: none; border-bottom: 1px solid #f7fafc; background: white; color: #4a5568; text-align: left; padding: 10px; font-size: 0.85rem; }
          .dropdown-menu button:hover { background: #edf2f7; }
        </style>
      </head>
      <body>
        <div class="main-content">
          <h2>Welcome, ${req.session.user_name}</h2>
          ${approvalMessage}

          <div style="max-width: 400px;">
            ${(!req.session.team || teamIdFromDb === null) ? `
              <form action="/create-team" method="GET"><button type="submit">Create Team</button></form>
              <form action="/join-team" method="GET"><button type="submit" class="secondary-btn">Join Team</button></form>
            ` : isApproved ? `<p><strong>✓ Active Member of: ${req.session.team}</strong></p>` : ''}

            ${req.session.admin ? `<form action="/team-requests" method="GET"><button type="submit" style="background:#805ad5; margin-top:10px;">Manage Team Requests</button></form>` : ''}
            
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <form action="/email" method="GET"><button type="submit" class="secondary-btn">Reset Password</button></form>
            <form action="/health" method="GET"><button type="submit" class="secondary-btn">System Health</button></form>
            <form action="/auth/logout" method="POST"><button type="submit" style="background:#e53e3e; margin-top:10px;">Log Out</button></form>
          </div>
        </div>

        <div class="sidebar">
          <h3 style="margin-top:0; font-size: 1.1rem; color: #2d3748;">${req.session.team ? 'Team: ' + req.session.team : 'No Team'}</h3>
          <label>MEMBERS</label>
          <ul style="list-style:none; padding:0;">${memberListHtml || '<li style="color:#a0aec0; font-size:0.9rem;">No members visible</li>'}</ul>
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

app.get('/email', (req, res) => {
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/email/send">
        <h2>Reset Password</h2>
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

app.get('/reset-password', (req, res) => {
  const tokenFromEmail = req.query.token;
  res.send(`<html><head>${commonStyles}</head><body>
    <div class="card">
      <form method="POST" action="/reset-confirmation">
        <h2>Set New Password</h2>
        <input type="hidden" name="token" value="${tokenFromEmail}" />
        
        <label>New Password</label>
        <input type="password" name="newPassword" placeholder="Min. 8 characters" required />
        
        <input type="submit" value="Update Password" />
      </form>
    </div>
  </body></html>`);
});

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

app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const targetUserId = req.query.user_id; // Grabs the ID from the hidden form in the 3-dot menu

        const userResult = await pool.query(
            `SELECT u.user_name, u.email, u.is_approved, t.name as team_name 
             FROM user_account u 
             LEFT JOIN team t ON u.team_id = t.id 
             WHERE u.id = $1`,
            [targetUserId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = userResult.rows[0];

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
                    .info-group { margin-bottom: 1.5rem; border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem; }
                    .info-label { font-size: 0.75rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.05em; }
                    .info-value { font-size: 1.1rem; color: #2d3748; font-weight: 500; }
                    .badge { 
                        display: inline-block; padding: 4px 12px; border-radius: 99px; 
                        font-size: 0.8rem; font-weight: 600; 
                    }
                    .badge-approved { background: #c6f6d5; color: #22543d; }
                    .badge-pending { background: #feebc8; color: #744210; }
                </style>
            </head>
            <body>
                <div class="card" style="max-width: 500px;">
                    <div class="profile-header">
                        <div class="avatar-circle">${user.user_name.charAt(0)}</div>
                        <h2>${user.user_name}</h2>
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
        console.error(err);
        res.status(500).send("Error fetching profile");
    }
});

export default app;