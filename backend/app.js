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

app.get('/signup', (req, res) => {
  res.send(`<html><body><form method=\"POST\" action=\"/auth/signup\">
      <h2> Sign Up </h2>
      <Label>Username:</Label> <input name=\"user_name\" />
      <Label>Email:</Label> <input name=\"email\" />
      <Label>Password:</Label> <input type=\"password\" name=\"password\">
      <input type=\"submit\" /></form>
      <form method=\"GET\" action=\"/login\">
      <button type=\"submit\"> Login </button></html>`);
});

app.get('/create-team', isAuthenticated, (req, res) => {
  res.send(`<html><body><form method=\"POST\" action=\"/auth/create-team\">
      <h2> Create A New Team </h2>
      <Label>Team Name:</Label> <input name=\"team_name\" />
      <input type=\"submit\" /></form></html>`);
});

app.get('/join-team', isAuthenticated, (req, res) => {
  res.send(`<html><body><form method=\"POST\" action=\"/auth/join-team\">
      <h2> Join Team </h2>
      <Label>Team Name:</Label> <input name=\"team_name\" />
      <input type=\"submit\" /></form></html>`);
});

app.get('/login', (req, res) => {
  res.send(`<html><body><form method=\"POST\" action=\"/auth/login\">
    <h2> Log In </h2>
    <Label>Email:</Label> <input name=\"email\" />
    <Label>Password:</Label> <input type=\"password\" name=\"password\"> 
    <input type=\"submit\" /></form>
    <form action=\"/email\" method=\"GET\">
    <button type=\"submit\">Reset Password</button></form>
    <form action=\"/signup\" method=\"GET\">
    <button type=\"submit\">Signup</button>
    </form>
    <form action=\"/auth/logout\" method=\"POST\">
    <button type=\"submit\">Log Out</button>
    </form></html>
    `);
});

app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    let memberListHtml = '';
    let approvalMessage = '';
    let isApproved = false;

    // 1. Fetch current user's approval status and team info from DB
    const userCheck = await pool.query(
      `SELECT is_approved, team_id FROM user_account WHERE id = $1`,
      [req.session.user_id]
    );
    
    isApproved = userCheck.rows[0]?.is_approved;

    // 2. Only fetch teammates if the user has a team AND is approved
    if (req.session.team && isApproved) {
      const membersResult = await pool.query(
        `SELECT user_name FROM user_account 
         WHERE team_id = (SELECT id FROM team WHERE name = $1) 
         AND is_approved = TRUE`,
        [req.session.team]
      );
      memberListHtml = membersResult.rows.map(m => `<li>${m.user_name}</li>`).join('');
    } else if (req.session.team && !isApproved && (userCheck.rows[0].team_id != null)) {
      // Message for users waiting for the lead to click "Accept"
      approvalMessage = `<p style="color: orange; font-weight: bold;">⏳ Waiting for team approval...</p>`;
      memberListHtml = ' ';
    } 

    // 3. Build the HTML
    let html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; display: flex; margin: 0; background: #f9f9f9; }
          .main-content { flex: 1; padding: 30px; }
          .sidebar { 
            width: 260px; background: #fff; border-left: 1px solid #ccc; 
            padding: 20px; height: 100vh; 
          }
          .team-title { font-weight: bold; color: #2c3e50; margin-bottom: 10px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
          ul { padding-left: 20px; color: #555; }
          form { margin-bottom: 8px; }
          button { cursor: pointer; padding: 6px 12px; }
        </style>
      </head>
      <body>
        <div class="main-content">
          <h2> Welcome, ${req.session.user_name} to VLAD </h2>
          ${approvalMessage} `;

    // Create/Join Logic
    if (!req.session.team || (userCheck.rows[0].team_id === null)) {
      html += `
        <form action="/create-team" method="GET"><button type="submit">Create Team</button></form>
        <form action="/join-team" method="GET"><button type="submit">Join Team</button></form>`;
    } else if (isApproved){
      html += `<p><strong>You are a member of Team: ${req.session.team}</strong></p>`;
    }

    // Admin Logic
    if (req.session.admin) {
      html += `<form action="/team-requests" method="GET"><button type="submit">Manage Team</button></form>`;
    }

    // Utility Buttons
    html += `
          <form action="/email" method="GET"><button type="submit">Reset Password</button></form>
          <form action="/health" method="GET"><button type="submit">Health</button></form>
          <form action="/auth/logout" method="POST"><button type="submit">Log Out</button></form>
        </div>

        <div class="sidebar">
          <div class="team-title">
            ${req.session.team ? 'Team: ' + req.session.team : 'No Team Joined'}
          </div>
          <h4>Members</h4>
          <ul>
            ${memberListHtml || '<li>No members yet</li>'}
          </ul>
        </div>
      </body>
    </html>`;

    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

app.get('/manage-team', isAdmin, async (req, res) => {
  
});

app.get('/team-requests', isAdmin, async (req, res) => {
  try {
    //Fetch the data
    const requests = await pool.query(
      `SELECT id, user_name, email 
          FROM user_account 
          WHERE team_id = (SELECT id FROM team WHERE lead_id = $1) 
          AND is_approved = FALSE`,
      [req.session.user_id]
    );

    //Build the list items string first
    let listItems = "";

    if (requests.rows.length === 0) {
      listItems = "<p>No pending requests.</p>";
    } else {
      for (let user of requests.rows) {
        listItems += `
            <li>
                <strong>${user.user_name}</strong> (${user.email})
                <form action="/admin/approve-member" method="POST" style="display:inline;">
                    <input type="hidden" name="user_id" value="${user.id}" />
                    <button type="submit">Accept</button>
                </form>
                <form action="/admin/reject-member" method="POST" style="display:inline;">
                    <input type="hidden" name="user_id" value="${user.id}" />
                    <button type="submit">Reject</button>
                </form>
            </li>`;
      }
    }

    //Send the full HTML block
    res.send(`
      <html><body>
      <h2>Team Join Requests</h2>
      <ul>${listItems}</ul>
      <hr><a href="/dashboard"> 
      <button type="button">Back to Dashboard</button>
      </a></body></html>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("<html><body><h3>Error loading requests.</h3></body></html>");
  }
});

app.get('/email', (req, res) => {
  res.send("<html><body><form method=\"POST\" action=\"/email/send\"><h2>Reset Password</h2><input name=\"to\" /><input type=\"submit\" /></form></html>");
});

app.get('/reset-password', (req, res) => {
  const tokenFromEmail = req.query.token;
  res.send(`<html><body><form method="POST" action="/reset-password"><h3>Reset Your Password</h3><input type="hidden" name="token" value="${tokenFromEmail}" /><label>New Password:</label><input type="password" name="newPassword" required /><input type="submit" value="Update Password" /></form></body></html>`);
});

app.get('/reset-confirmation', (req, res) => {
  res.send("<html><body><h3>Your password has been successfully reset.</h3></body></html>");
});

export default app;