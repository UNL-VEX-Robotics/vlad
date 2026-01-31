import bcrypt from 'bcrypt';
import pool from '../db.js';

const SALT_ROUNDS = 12;
const EMAIL_REGEX = '\w*@(?:\w*.)+';  

export async function signup(req, res) {
  const { user_name, email, password, team_name } = req.body;

  // Check if all fields are filled in
  if (!user_name || !email || !password || !team_name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Check if email is valid
  email = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test((email))) {
    return res.status(400).json({ error: 'Invalid email.'})
  }

  try {
    // Get team id using team name
    const teamResult = await pool.query(
      'SELECT id FROM team WHERE name = $1',
      [team_name]
    );
    if (teamResult.rows.length === 0) {
      return res.status(400).json({ error: 'Team not found' });
    }
    const team_id = teamResult.rows[0].id;

    // Ensure user doesn't already exist
    const existingUser = await pool.query(
      'SELECT id FROM user_account WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `
      INSERT INTO user_account (user_name, email, password_hash, team_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_name, email
      `,
      [user_name, email, passwordHash, team_id]
    );

    res.status(201).json({
      message: 'User created',
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function checkPassword(plainPassword, hashedPassword) {
    try {
        // bcrypt.compare returns a boolean (true/false)
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        
        if (!isMatch) {
          return false;
        }
    } catch (err) {
        return false;
    }

    return true;
}

export async function login(req, res){
  const { email, password } = req.body;

  // Check if all fields are filled in
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Ensure user doesn't already exist
    const userResult = await pool.query(
      'SELECT id, user_name, password_hash FROM user_account WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Ensure that the password is correct
    if (!await checkPassword(password, user.password_hash)){
      return res.status(400).json({ error: 'Invalid credentials'})
    }

    req.session.user = user;

    res.status(200).json({
      message: 'Login Successful',
      user: { id: user.id, user_name: user.user_name },
    });
  }
  catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
