import bcrypt from 'bcrypt';
import pool from '../db.js';
import session from 'express-session';
import pgSession from 'connect-pg-simple'


const SALT_ROUNDS = 12;
const EMAIL_REGEX = /\w*@(?:\w*.)+/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// User Signup
export async function signup(req, res) {
  const { user_name, email, password, confirmPassword } = req.body;
  const clean_email = email.trim().toLowerCase();

  if (password.length < 8){
    return res.redirect(`/signup?error=Password%20must%20be%20at%20least%208%20characters`);
  }

  if (password !== confirmPassword) {
    // Redirect back with the error and the token (so they don't lose their place)
    return res.redirect(`/signup?error=Passwords%20do%20not%20match`);
  }

  if (!passwordRegex.test(password)){
    return res.redirect('/signup?error=Password%20does%20not%20requirements');
  }

  // Check if all fields are filled in
  if (!user_name || !clean_email || !password) {
    return res.redirect(`/signup?error=Missing%20field`);
    //return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Check if email is valid
  if (!EMAIL_REGEX.test((clean_email))) {
    return res.redirect(`/signup?error=Invalid%20email`);
    //return res.status(400).json({ error: 'Invalid email.' })
  }

  try {
    // Ensure user doesn't already exist
    const existingUser = await pool.query(
      'SELECT id FROM user_account WHERE email = $1',
      [clean_email]
    );
    if (existingUser.rows.length > 0) {
      return res.redirect('/signup?error=User%20Already%20Exists');
      //return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `
      INSERT INTO user_account (user_name, email, password_hash, team_id, is_approved)
      VALUES ($1, $2, $3, NULL, FALSE)
      RETURNING id, user_name, email
      `,
      [user_name, clean_email, passwordHash]
    );
    req.session.user_id = result.rows[0].id;
    req.session.user_name = result.rows[0].user_name;
    req.session.email = result.rows[0].email;
    res.redirect("/dashboard");
    // res.status(201).json({
    //   message: 'User created',
    //   user: result.rows[0],
    // });
  } catch (err) {
    console.error(err);
    return res.redirect('/signup?error=Server%20Error');
    //res.status(500).json({ error: 'Server error' });
  }
}

// Helper function to check the password
async function checkPassword(plainPassword, hashedPassword, res) {
  try {
    // bcrypt.compare returns a boolean (true/false)
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid credentials' })
  }
}

// User login function
export async function login(req, res) {
  const { email, password } = req.body;

  const clean_email = email.trim().toLowerCase();

  // Check if all fields are filled in

  if (!clean_email || !password) {
    return res.redirect(`/login?error=Missing%20field`);
    //return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Ensure user doesn't already exist
    const userResult = await pool.query(
      'SELECT id, user_name, password_hash, team_id FROM user_account WHERE email = $1',
      [clean_email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.redirect(`/login?error=Invalid%20Credentials`);
      //return res.status(400).json({ error: 'Invalid credentials' });
    }
    req.session.admin = false;
    req.session.team = null;
    req.session.team_id = user.team_id;
    if (user.team_id != null) {
      const team = await pool.query(
        'SELECT name, lead_id FROM team WHERE id = $1',
        [user.team_id]
      );
      req.session.team = team.rows[0].name;
      if (user.id === team.rows[0].lead_id) {
        req.session.admin = true;
      }
    }

    //Ensure that the password is correct
    if (await checkPassword(password, user.password_hash, res)) {
      req.session.user_id = user.id;
      req.session.user_name = user.user_name;
      req.session.save((err) => {
        if (err) {
          console.error("Session Save Error:", err);
          return res.redirect(`/login?error=Server%20Error`);
          //return res.status(500).send("Error saving session");
        }
        res.redirect('/dashboard');
      });
      // res.status(200).json({
      //   message: 'Login Successful',
      //   user: { id: user.id, user_name: user.user_name },
      // });
    }
    else {
      return res.redirect(`/login?error=Invalid%20Credentials`);
      //res.status(400).json({ error: 'Invalid credentials' })
    }
  }
  catch (err) {
    return res.redirect(`/login?error=Server%20Error`);
    //res.status(500).json({ error: 'Server error' });
  }
}

// User logout function
export async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.redirect('/dashboard?error=Server%20Error');
      //return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');

    res.redirect('/login?message=logged-out');
  });
}

// Create a new team
export async function createTeam(req, res) {
  const client = await pool.connect();
  const { team_name } = req.body;
  const user_id = req.session.user_id;
  
  if (!team_name) {
    return res.redirect(`/create-team?error=Missing%20field`);
  }

  try {

    //Check if team already exists
    const teamResult = await pool.query(
      'SELECT id FROM team WHERE name = $1',
      [team_name]
    );
    if (teamResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.redirect('/create-team?error=Team%20Already%20Exists');
      //return res.status(400).json({ error: 'Team already exists' });
    }

    client.query('BEGIN');

    const result = await pool.query(
      "INSERT INTO team (name, lead_id) VALUES ($1, $2) RETURNING id, name, lead_id",
      [team_name, user_id]
    );

    await pool.query(
      "UPDATE user_account SET team_id = $1, is_approved = TRUE WHERE id = $2",
      [result.rows[0].id, user_id]
    );

    await client.query('COMMIT');
    req.session.team = team_name;
    req.session.admin = true;
    res.redirect("/dashboard");
    //res.status(201).json({message: "Team created", team: result.rows[0]});
  }
  catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.redirect('/create-team?error=Server%20Error');
    //res.status(500).json({ error: 'Server error' });
  }
  finally {
    client.release();
  }
}

// Allows a user to request to join a team after being rejected or removed from a team
export async function teamRequest(req, res) {
  const { team_name } = req.body;
  const user_id = req.session.user_id;

  if (!team_name) {
    return res.redirect(`/join-team?error=Missing%20field`);
  }

  try {
    const teamResult = await pool.query(
      "SELECT id FROM team WHERE name = $1",
      [team_name]
    );
    if (teamResult.rows.length === 0) {
      return res.redirect('/join-team?error=Team%20Not%20Found');
      //return res.status(400).json({ error: 'Team not found' });
    }
    const team_id = teamResult.rows[0].id;
    await pool.query(
      "UPDATE user_account SET team_id = $1 WHERE id = $2",
      [team_id, user_id]
    );
    req.session.team = team_name;
    res.redirect("/dashboard");
    //res.status(200).json({ message: 'Team request submitted' });
  }
  catch (err) {
    console.error(err);
    return res.redirect('/join-team?error=Server%20Error');
    //res.status(500).json({ error: 'Server error' });
  }
}
