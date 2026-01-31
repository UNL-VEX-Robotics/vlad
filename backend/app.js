import express from 'express';
import session from 'express-session';

import pool from './db.js';
import authRoutes from './routes/auth.js';

import bodyParser from "body-parser";

const app = express();
app.use(session({
  secret: process.env.SESSION_SECRET, // Required for signing the cookie
  resave: false, // Forces the session to be saved back to the session store
  saveUninitialized: true, // Forces an "uninitialized" session to be saved to the store
  cookie: { maxAge: parseInt(process.env.COOKIE_MAX_AGE) } // Optional: cookie settings (e.g., 24-hour expiration)
}))

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/', (req, resp) => {
  req.session.view++;
  resp.send(`Local View Counter: ${req.session.view}`);
})

app.get('/login', (req, res) => {
   res.send("<html><body><form method=\"POST\"><input name=\"username\" /><input type=\"password\" name=\"password\"> <input type=\"submit\" /></form></html>");
});

app.post('/login', (request, response)=> {
  console.log(request.body);
  response.send("POSTED");
});

app.use('/auth', authRoutes);

export default app;