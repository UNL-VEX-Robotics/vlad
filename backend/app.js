import express from 'express';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/reset.js';
import adminRoutes from './routes/admin.js';
import subteamRoutes from './routes/subteam.js';
import notificationRoutes from './routes/notifications.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { configDotenv } from 'dotenv';


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

// Checks if a users has a session before they can access the specified page
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return next();
  }
  else {
    res.redirect('/login');
  }
};

// ROLES: used to check if a user has the correct permissions to access a page based on their role on the team, stored in the session when they login or signup
const ROLES = {
  PENDING: 0,
  MEMBER: 1,
  LEAD: 2,
  ADMIN: 3,
  OWNER: 4,
}

// To check if the user has the correct permissions to access a page based on their role on the team
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.session && req.session.role >= requiredRole) {
      next();
    }
    else {
      res.redirect('/dashboard?error=Insufficient%20Permissions');
    }
  }
}

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
        --alert-bg: #fff5f5;
        --alert-text: #c53030;
        --alert-border: #feb2b2;
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
            --alert-bg: #822727; /* Deep blood red */
            --alert-text: #ffffff;
            --alert-border: #e53e3e;
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

    /* Alert Box */
    .alert-box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
    line-height: 1.4;
    transition: all 0.3s ease;}
    .alert-box {
    background: var(--alert-bg);
    color: var(--alert-text);
    border: 1px solid var(--alert-border);}

    /* Top Profile Menu */
    .top-nav { position: absolute; top: 20px; right: 280px; z-index: 10; }
    .profile-trigger { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    color: var(--text-main); 
    padding: 8px 15px; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: 600; 
    font-size: 0.85rem;}

    /* Subteam Grid */
    .subteam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
    .subteam-card { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    padding: 15px; 
    border-radius: 10px; 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start;
    position: relative;}

    /* Sidebar Request Button */
    .manage-btn { 
    background: #805ad5 !important; 
    font-size: 0.75rem !important; 
    padding: 6px !important; 
    margin-top: 10px; }

    /* Modal Styles */
    .modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    justify-content: center;
    align-items: center;}

    .modal-content {
    background: var(--bg-card);
    border: 2px solid var(--accent-red);
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 0 20px rgba(229, 62, 62, 0.2);}

    .modal-btns {
    display: flex;
    gap: 10px;
    margin-top: 20px;}
</style>
`;

// --- ROUTES ---

// Signup Page
app.get('/signup', (req, res) => {
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
            <form method="POST" action="${auth}/signup">
                <h2>Sign Up</h2>
                ${errorMessageHtml}
                <label>Username</label><input name="user_name" placeholder="Username" required />
                <label>Email</label><input name="email" type="email" placeholder="Email" required />
                <label>Password</label>
                <ul style="padding-left: 18px; padding-bottom: 7px; margin: 0; font-size: 0.7rem;">
                  <li>Minimum 8 characters</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character (!@#$)</li>
                </ul>
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
    <div class="alert-box">
      ${error}
    </div>
  `;
  }

  res.send(`<html><head>${commonStyles}</head><body>
        <div class="card">
            <form method="POST" action="${auth}/login">
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
  const error = req.query.error;

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `<div class="alert-box">${error}</div>`;
  }

  try {
    let memberListHtml = '';
    let subteamHtml = '';
    let approvalMessage = '';
    let notificationsHtml = '';

    const userRole = req.session.role;
    const teamId = req.session.team_id;
    const isApproved = userRole > 0;

    // 0. Fetch Notifications (Reasons for removal/promotion/etc)
    const notifResult = await pool.query(
      `SELECT id, title, message FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE 
       ORDER BY created_at DESC`,
      [req.session.user_id]
    );

    // Inside app.get('/dashboard')
    // ... (previous logic for fetching notifResult)

    const notificationsList = notifResult.rows.map(n => `
    <div class="notification-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-red); padding: 12px; border-radius: 6px; margin-bottom: 10px; position: relative;">
      <h4 style="margin: 0 0 3px 0; font-size: 0.9rem; color: var(--text-heading);">${n.title}</h4>
      <p style="margin: 0; font-size: 0.85rem; color: var(--text-main); line-height:1.4;">${n.message}</p>
      <form action="/notifications/mark-as-read" method="POST" style="margin-top: 8px;">
        <input type="hidden" name="notification_id" value="${n.id}">
        <button type="submit" style="background:none; border:none; color:var(--text-muted); font-size:0.75rem; cursor:pointer; text-decoration:underline; padding:0;">Mark as read</button>
      </form>
    </div>
    `).join('');

    notificationsHtml = notifResult.rows.length > 0 ? `
    <div class="notifications-container" style="margin-bottom: 40px; max-width: 600px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <label style="font-size:0.7rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase; letter-spacing: 0.05rem;">
          Notifications (${notifResult.rows.length})
        </label>
        <form action="/notifications/mark-all-as-read" method="POST" style="margin:0;">
          <button type="submit" style="background:none; border:none; color:var(--accent-red); font-size:0.7rem; font-weight:bold; cursor:pointer; text-transform:uppercase;">
            Clear All
          </button>
        </form>
      </div>
      <div class="notifications-scroll-area" style="max-height: 250px; overflow-y: auto; padding-right: 8px;">
        ${notificationsList}
      </div>
    </div>
    ` : '';

    if (req.session.team && isApproved) {
      // 1. Get Members
      const membersResult = await pool.query(
        `SELECT id, user_name, role FROM user_account 
          WHERE team_id = (SELECT id FROM team WHERE name = $1) 
          AND role != 0
          ORDER BY role DESC, user_name ASC`,
        [req.session.team]
      );

      memberListHtml = membersResult.rows.map(m => {
        const roleLabels = { 1: 'Member', 2: 'Lead', 3: 'Admin', 4: 'Owner' };
        let actionButtons = '';
        if (userRole >= 3 && m.id !== req.session.user_id) {
          if (m.role < 3) {
            actionButtons += `
              <form action="/admin/change-role" method="POST" style="margin:0;">
                <input type="hidden" name="user_id" value="${m.id}">
                <input type="hidden" name="new_role" value="${m.role + 1}">
                <button type="submit">Promote to ${roleLabels[m.role + 1]}</button>
              </form>`;
          }
          const canDemote = m.role > 1 && (userRole > m.role);
          if (canDemote) {
            actionButtons += `
              <form action="/admin/change-role" method="POST" style="margin:0;">
                <input type="hidden" name="user_id" value="${m.id}">
                <input type="hidden" name="new_role" value="${m.role - 1}">
                <button type="submit" style="color:var(--accent-red);">Demote to ${roleLabels[m.role - 1]}</button>
              </form>`;
          }
        }

        return `
        <li class="member-row">
          <span>${m.user_name} <small style="color:var(--text-muted); font-size:0.7rem;">(${roleLabels[m.role]})</small></span>
          <div class="menu-container">
            <button class="dot-btn" onclick="toggleMenu(event, 'menu-${m.id}')">⋮</button>
            <div id="menu-${m.id}" class="dropdown-menu">
                <form action="/profile" method="GET" style="margin:0;"><input type="hidden" name="user_id" value="${m.id}"><button type="submit">View Profile</button></form>
                ${actionButtons}
                <form action="/report" method="POST" style="margin:0;"><input type="hidden" name="user_id" value="${m.id}"><button type="submit">Report</button></form>
            </div>
          </div>
        </li>`;
      }).join('');

      // 2. Get Subteams
      const subteamsResult = await pool.query(
        `SELECT id, name FROM subteam WHERE team_id = $1`,
        [teamId]
      );
      subteamHtml = subteamsResult.rows.map(s => `
        <div class="subteam-card">
          <div style="font-weight: 700; color: var(--text-heading);">${s.name}</div>
          ${userRole > 2 ? `
          <div class="menu-container">
            <button class="dot-btn" onclick="toggleMenu(event, 'sub-${s.id}')">⋮</button>
            <div id="sub-${s.id}" class="dropdown-menu">
              <form action="/edit-subteam" method="GET" style="margin:0;"><input type="hidden" name="id" value="${s.id}"><button type="submit">Edit Name</button></form>
              <button type="button" onclick="confirmDelete('${s.id}', '${s.name}')" style="color:var(--accent-red); width:100%; text-align:left; background:none; border:none; padding: 8px 12px; font-size: 0.85rem; cursor:pointer;">Delete</button>
            </div>
          </div>` : ''}
        </div>`).join('');
    } else if (req.session.team && !isApproved && teamId !== null) {
      approvalMessage = `<div style="background: var(--badge-pending-bg); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; color: var(--badge-pending-text); margin-bottom: 20px;">⏳ Waiting for team lead approval...</div>`;
    }

    res.send(`
    <html>
      <head>
        ${commonStyles}
        <style>
          body { display: flex; flex-direction: row; position: relative; }
          .main-content { flex: 1; padding: 40px; }
          .dropdown-menu button { width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); }
          .dropdown-menu button:hover { background: var(--bg-body); }
          .alert-box { background: var(--accent-red); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div id="deleteModal" class="modal-overlay">
            <div class="modal-content">
                <h3 style="color: var(--accent-red); margin-top: 0;">Confirm Deletion</h3>
                <p style="color: var(--text-main); font-size: 0.9rem;">
                    Are you sure you want to delete subteam <strong id="deleteSubteamName"></strong>?
                </p>
                <div class="modal-btns">
                    <button class="secondary-btn" onclick="closeModal()">Cancel</button>
                    <form id="deleteForm" action="/subteam/delete-subteam" method="POST" style="margin:0; flex:1;">
                        <input type="hidden" name="id" id="deleteSubteamId">
                        <button type="submit" style="background: var(--accent-red);">Delete</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="top-nav">
          <div class="menu-container">
            <button class="profile-trigger" onclick="toggleMenu(event, 'profile-menu')">
              Account: ${req.session.user_name} ▾
            </button>
            <div id="profile-menu" class="dropdown-menu">
              <form action="/auth/logout" method="POST" style="border-top: 1px solid var(--border-color);">
                <button type="submit" style="color: var(--accent-red);">Log Out</button>
              </form>
            </div>
          </div>
        </div>

        <div class="main-content">
          ${errorMessageHtml}
          ${notificationsHtml}
          <h2 style="color: var(--text-heading);">Dashboard</h2>
          ${approvalMessage}

          ${(!req.session.team || teamId === null) ? `
            <div class="card" style="margin:0; max-width:400px;">
              <h3>Get Started</h3>
              <form action="/create-team" method="GET"><button type="submit">Create Team</button></form>
              <form action="/join-team" method="GET"><button type="submit" class="secondary-btn">Join Team</button></form>
            </div>
          ` : `
            <h3 style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Subteams</h3>
            <div class="subteam-grid">
              ${subteamHtml || `<div class="subteam-card" style="color:var(--text-muted);">No subteams created yet.</div>`}
              ${userRole > 2 ? `
                <a href="/create-subteam" style="text-decoration:none;">
                  <div class="subteam-card" style="border: 2px dashed var(--border-color); justify-content:center; color: var(--accent-red); cursor:pointer;">
                    + Create Subteam
                  </div>
                </a>
              ` : ''}
            </div>
          `}
        </div>

        <div class="sidebar">
          <h3 style="margin-top:0; font-size: 1.1rem; color: var(--text-heading); margin-bottom: 5px;">
            ${req.session.team ? req.session.team : 'No Team'}
          </h3>
          
          ${userRole > 2 ? `
            <form action="/team-requests" method="GET">
              <button type="submit" class="manage-btn">Manage Requests</button>
            </form>
          ` : ''}

          <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border-color);">
          
          <label>MEMBERS</label>
          <ul style="list-style:none; padding:0;">
            ${memberListHtml || `<li style="color: var(--text-muted); font-size:0.9rem;">No members visible</li>`}
          </ul>
        </div>

        <script>
          function toggleMenu(event, id) {
            event.stopPropagation();
            const menu = document.getElementById(id);
            const isVisible = menu.style.display === 'block';
            document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
            menu.style.display = isVisible ? 'none' : 'block';
          }

          function confirmDelete(id, name) {
            document.getElementById('deleteSubteamId').value = id;
            document.getElementById('deleteSubteamName').innerText = name;
            document.getElementById('deleteModal').style.display = 'flex';
          }

          function closeModal() {
            document.getElementById('deleteModal').style.display = 'none';
          }

          document.addEventListener('click', () => { 
            document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); 
          });
        </script>
      </body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

// Page with a profile for the specifed user
app.get('/profile', isAuthenticated, async (req, res) => {
  const error = req.query.error; // Catch the error message from the URL

  let errorMessageHtml = '';
  if (error) {
    errorMessageHtml = `
    <div class="alert-box">
      ${error}
    </div>
  `;
  }
  try {
    const targetUserId = req.query.user_id;
    const userResult = await pool.query(
      `SELECT u.id, u.user_name, u.email, u.role, t.name as team_name 
       FROM user_account u 
       LEFT JOIN team t ON u.team_id = t.id 
       WHERE u.id = $1`,
      [targetUserId]
    );

    if (userResult.rows.length === 0) return res.status(404).send("User not found");
    const user = userResult.rows[0];

    const roleMap = {
      [ROLES.PENDING]: { label: 'Pending Approval', class: 'badge-pending' },
      [ROLES.MEMBER]: { label: 'Member', class: 'badge-member' },
      [ROLES.LEAD]: { label: 'Lead', class: 'badge-lead' },
      [ROLES.ADMIN]: { label: 'Admin', class: 'badge-admin' },
      [ROLES.OWNER]: { label: 'Owner', class: 'badge-owner' }
    };

    const currentRole = roleMap[user.role] || { label: 'Unknown', class: 'badge-pending' };

    let manageDropdownHtml = '';
    // Only show management if session user is OWNER and not looking at themselves
    if (req.session.role === ROLES.OWNER && user.id !== req.session.user_id) {
      let actions = '';

      // Promote Logic: Pulls "Lead" or "Admin" label dynamically
      if (user.role < ROLES.ADMIN) {
        const nextRoleData = roleMap[user.role + 1];
        actions += `
          <form action="/admin/change-role" method="POST" style="margin:0;">
            <input type="hidden" name="user_id" value="${user.id}">
            <input type="hidden" name="new_role" value="${user.role + 1}">
            <button type="submit">Promote to ${nextRoleData.label}</button>
          </form>`;
      }

      // Demote Logic: Pulls "Member" or "Lead" label dynamically
      if (user.role > ROLES.MEMBER) {
        const prevRoleData = roleMap[user.role - 1];
        actions += `
          <form action="/admin/change-role" method="POST" style="margin:0;">
            <input type="hidden" name="user_id" value="${user.id}">
            <input type="hidden" name="new_role" value="${user.role - 1}">
            <button type="submit" style="color:var(--accent-red);">Demote to ${prevRoleData.label}</button>
          </form>`;
      }

      // Transfer Ownership: Special high-priority action
      actions += `
        <button type="button" onclick="openTransferModal()" style="color:var(--accent-red); font-weight:bold; border-top:1px solid var(--border-color); margin-top:5px; padding-top:10px;">
          Transfer Ownership
        </button>`;

      // Remove User
      actions += `
        <button type="button" onclick="openRemoveModal()" style="color:var(--accent-red);">
          Remove from Team
        </button>`;

      manageDropdownHtml = `
        <div class="menu-container" style="flex: 1; position: relative;">
          <button type="button" class="manage-btn" style="width:100%;" onclick="toggleMenu(event, 'manage-menu')">Manage User ▾</button>
          <div id="manage-menu" class="dropdown-menu" style="top: 100%; right: 0; width: 100%; min-width: 200px; z-index: 1000; display: none; box-shadow: var(--shadow-lg);">
            ${actions}
          </div>
        </div>`;
    }

    res.send(`
        <html>
            <head>
                ${commonStyles}
                <style>
                    .profile-header { text-align: center; margin-bottom: 2rem; }
                    .avatar-circle { 
                        width: 80px; height: 80px; background: var(--accent-red); color: white; 
                        border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-size: 2rem; margin: 0 auto 1rem;
                        text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    }
                    .badge { display: inline-block; padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                    .badge-owner { background: var(--accent-red); color: white; }
                    .badge-admin { background: #805ad5; color: white; }
                    .badge-lead { background: #3182ce; color: white; }
                    .badge-member { background: #38a169; color: white; }
                    .badge-pending { background: #718096; color: white; }

                    .info-group { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
                    .info-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 4px; }
                    .info-value { font-size: 1.1rem; color: var(--text-heading); }
                    
                    .dropdown-menu { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; position: absolute; }
                    .dropdown-menu button { width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); border-radius: 4px; }
                    .dropdown-menu button:hover { background: var(--bg-body); }
                </style>
            </head>
            <body>
                <div id="removeModal" class="modal-overlay" style="display:none;">
                    <div class="modal-content">
                        <h3 style="color: var(--accent-red); margin-top: 0;">Remove ${user.user_name}</h3>
                        <p style="font-size: 0.9rem; color: var(--text-main);">Provide a reason for removal. This will be sent to the user.</p>
                        <form action="/admin/remove-member" method="POST">
                            <input type="hidden" name="user_id" value="${user.id}">
                            <textarea name="reason" placeholder="Reason for removal..." required style="width:100%; min-height:100px; padding:10px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-body); color:var(--text-main); margin-bottom:15px; resize: none;"></textarea>
                            <div class="modal-btns">
                                <button type="button" class="secondary-btn" onclick="closeModal('removeModal')">Cancel</button>
                                <button type="submit" style="background: var(--accent-red);">Confirm Removal</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div id="transferModal" class="modal-overlay" style="display:none;">
                    <div class="modal-content">
                        <h3 style="color: var(--accent-red); margin-top: 0;">Transfer Ownership</h3>
                        <p style="font-size: 0.9rem; color: var(--text-main);">
                            Are you sure you want to transfer team ownership to <strong>${user.user_name}</strong>? 
                            <br><br>
                            <span style="color: var(--accent-red);">⚠️ You will be demoted to Admin and lose Owner privileges.</span>
                        </p>
                        <form action="/admin/transfer-ownership" method="POST">
                            <input type="hidden" name="new_owner_id" value="${user.id}">
                            <div class="modal-btns">
                                <button type="button" class="secondary-btn" onclick="closeModal('transferModal')">Cancel</button>
                                <button type="submit" style="background: var(--accent-red);">Confirm Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="card" style="max-width: 450px; margin: 50px auto;">
                    <div class="profile-header">
                        <div class="avatar-circle">${user.user_name.charAt(0)}</div>
                        <h2 style="color: var(--text-heading); margin-bottom: 8px;">${user.user_name}</h2>
                        <span class="badge ${currentRole.class}">${currentRole.label}</span>
                    </div>

                    <div class="info-group">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${user.email}</div>
                    </div>

                    <div class="info-group">
                        <div class="info-label">Current Team</div>
                        <div class="info-value">${user.team_name || 'No Team Assigned'}</div>
                    </div>

                    <div style="margin-top: 2rem; display: flex; gap: 10px; position: relative;">
                        <a href="/dashboard" style="text-decoration: none; flex: 1;">
                            <button type="button" class="secondary-btn" style="width: 100%;">Back to Dashboard</button>
                        </a>
                        ${manageDropdownHtml}
                    </div>
                </div>

                <script>
                    function toggleMenu(event, id) {
                        event.stopPropagation();
                        const menu = document.getElementById(id);
                        const isVisible = menu.style.display === 'block';
                        document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                        menu.style.display = isVisible ? 'none' : 'block';
                    }

                    function openRemoveModal() { document.getElementById('removeModal').style.display = 'flex'; }
                    function openTransferModal() { document.getElementById('transferModal').style.display = 'flex'; }
                    function closeModal(id) { document.getElementById(id).style.display = 'none'; }

                    document.addEventListener('click', () => { 
                        document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none'); 
                    });
                </script>
            </body>
        </html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
});

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
app.get('/create-team', isAuthenticated, (req, res) => {
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
      <form method="POST" action="${auth}/create-team">
        <h2>Create A New Team</h2>
        ${errorMessageHtml}
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
      <form method="POST" action="${auth}/join-team">
        <h2>Join Team</h2>
        ${errorMessageHtml}
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

export default app;