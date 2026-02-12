import express from 'express';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple'

import bodyParser from "body-parser";

const app = express();
const PostgresStore = pgSession(session);
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

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
    if (req.session && req.session.user_id){
        return next();
    }
    else{
      res.redirect('/login');
    }
};

app.use('/auth', authRoutes);

app.use('/email', emailRoutes);

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
    </form></html>
    `);
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  let html = `<html><body><form method=\"POST\"><h2> Welcome, ${req.session.user_name} to VLAD <h2></form>`
  if (!req.session.team){
    html += `<form action=\"/create-team\" method=\"GET\"><button type=\"submit\">Create Team</button></form></html><form action=\"/join-team\" method=\"GET\"><button type=\"submit\">Join Team</button></form></html>`
  }
  else {
      html += `<form><Label> You are a member of Team: ${req.session.team}</Label></form>`  
  }

  html += `<form action=\"/email\" method=\"GET\">
    <button type=\"submit\">Reset Password</button>
    </form></html>
    <form action=\"/health\" method=\"GET\">
    <button type=\"submit\">Health</button>
    </form></html>
    <form action=\"/auth/logout\" method=\"POST\">
    <button type=\"submit\">Log Out</button>
    </form></html>`

  res.send(html);
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