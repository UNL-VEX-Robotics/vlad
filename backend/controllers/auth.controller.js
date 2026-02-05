import bcrypt from 'bcrypt';
import pool from '../db.js';


const SALT_ROUNDS = 12;
const EMAIL_REGEX = /\w*@(?:\w*.)+/;  

// User Signup
export async function signup(req, res) {
  const { user_name, email, password } = req.body;

  // Check if all fields are filled in
  if (!user_name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Check if email is valid
  const clean_email = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test((clean_email))) {
    return res.status(400).json({ error: 'Invalid email.'})
  }

  try {
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
      INSERT INTO user_account (user_name, email, password_hash, team_id, is_approved)
      VALUES ($1, $2, $3, NULL, FALSE)
      RETURNING id, user_name, email
      `,
      [user_name, email, passwordHash]
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
        res.status(400).json({ error: 'Invalid credentials'})
    }
}

// User login function
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

    //Ensure that the password is correct
    if (await checkPassword(password, user.password_hash, res)){
      res.status(200).json({
        message: 'Login Successful',
        user: { id: user.id, user_name: user.user_name },
      });
    }
    else {
      res.status(400).json({ error: 'Invalid credentials'})
    }
  }
  catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Create a new team
export async function createTeam(req, res) {
  const client = await pool.connect();
  const { team_name, user_id } = req.body;
  try {
    
    //Check if team already exists
    const teamResult = await pool.query(
      'SELECT id FROM team WHERE name = $1',
      [team_name]
    );
    if (teamResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Team already exists' });
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
    res.status(201).json({message: "Team created", team: result.rows[0]});
  }
  catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
  finally {
    client.release();
  }
}


// Allows a user to request to join a team after being rejected or removed from a team
export async function teamRequest(req, res) {
  const { team_name, user_id } = req.body;
  try {
    const teamResult = await pool.query(
      "SELECT id FROM team WHERE name = $1",
      [team_name]
    );
    if (teamResult.rows.length === 0) {
      return res.status(400).json({ error: 'Team not found' });
    }
    const team_id = teamResult.rows[0].id;
    await pool.query(
      "UPDATE user_account SET team_id = $1 WHERE id = $2",
      [team_id, user_id]
    );
    res.status(200).json({ message: 'Team request submitted' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
