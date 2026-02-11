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
      <Label>Username:</Label> <input name=\"user_name\" />
      <Label>Email:</Label> <input name=\"email\" />
      <Label>Password:</Label> <input type=\"password\" name=\"password\">
      <input type=\"submit\" /></form></html>`);
});

app.get('/create-team', isAuthenticated, (req, res) => {
    res.send(`<html><body><form method=\"POST\" action=\"/auth/create-team\">
      <Label>${req.session.user_name}</Label>
      <Label>Team Name:</Label> <input name=\"team_name\" />
      <input type=\"submit\" /></form></html>`);
});

app.get('/join-team', isAuthenticated, (req, res) => {
    res.send(`<html><body><form method=\"POST\" action=\"/auth/join-team\">
      <Label>Team Name:</Label> <input name=\"team_name\" />
      <input type=\"submit\" /></form></html>`);
});

app.get('/login', (req, res) => {
   res.send(`<html><body><form method=\"POST\" action=\"/auth/login\">
    <Label>Email:</Label> <input name=\"email\" />
    <Label>Password:</Label> <input type=\"password\" name=\"password\"> 
    <input type=\"submit\" /></form></html>`);
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Could not log out");
    res.clearCookie('connect.sid'); // The default session cookie name
    res.send("Logged out successfully");
  });
});

app.post('/login', (request, response)=> {
  console.log(request.body);
  response.send("POSTED");
});


app.get('/email', isAuthenticated, (req, res) => {
  res.send("<html><body><form method=\"POST\" action=\"/email/send\"><input name=\"to\" /><input type=\"submit\" /></form></html>");
}); 

app.get('/reset-password', isAuthenticated, (req, res) => {
  const tokenFromEmail = req.query.token;
  res.send(`<html><body><form method="POST" action="/reset-password"><h3>Reset Your Password</h3><input type="hidden" name="token" value="${tokenFromEmail}" /><label>New Password:</label><input type="password" name="newPassword" required /><input type="submit" value="Update Password" /></form></body></html>`);
  });

  app.get('/reset-confirmation', (req, res) => {
    res.send("<html><body><h3>Your password has been successfully reset.</h3></body></html>");
  });

export default app;