import bcrypt from "bcrypt";
import pool from "../db.js";
import nodeCron from "node-cron";
import { withLayout } from "../views/layout.js";
import { signupPage, loginPage, createTeamPage, joinTeamPage } from "../views/auth.view.js";
import { ROLES, EMAIL_REGEX, SALT_ROUNDS, PASSWORD_REGEX } from "../utils/constants.js";

/**
 * Renders the Signup Page (GET)
 */
export const renderSignup = (req, res) => {
    const error = req.query.error;
    const content = signupPage(error);
    res.send(withLayout("Sign Up", content, req));
};

/**
 * Renders the Login Page (GET)
 */
export const renderLogin = (req, res) => {
    const error = req.query.error;
    const content = loginPage(error);
    res.send(withLayout("Log In", content, req));
};

/**
 * Renders the Create Team Page (GET)
 */
export const renderCreateTeam = (req, res) => {
    const error = req.query.error;
    const content = createTeamPage(error);
    res.send(withLayout("Create Team", content, req));
};

/**
 * Renders the Join Team Page (GET)
 */
export const renderJoinTeam = (req, res) => {
    const error = req.query.error;
    const content = joinTeamPage(error);
    res.send(withLayout("Join Team", content, req));
};

/**
 * Handles new user registration.
 * 1. Validates password length, match, and complexity.
 * 2. Checks for existing email in the database.
 * 3. Hashes password and inserts user with PENDING (0) role.
 * 4. Initializes session data and redirects to dashboard.
 * @param {Object} req - Express request object. Expects req.body: {user_name, email, password, confirmPassword}.
 * @param {Object} res - Express response object.
 */
export async function signup(req, res) {
    const { user_name, email, password, confirmPassword } = req.body;
    const clean_email = email.trim().toLowerCase();

    if (password.length < 8) {
        return res.redirect(
            "/auth/signup?error=Password%20must%20be%20at%20least%208%20characters"
        );
    }

    if (password !== confirmPassword) {
        return res.redirect("/auth/signup?error=Passwords%20do%20not%20match");
    }

    if (!PASSWORD_REGEX.test(password)) {
        return res.redirect("/auth/signup?error=Password%20does%20not%20requirements");
    }

    if (!user_name || !clean_email || !password) {
        return res.redirect("/auth/signup?error=Missing%20field");
    }

    if (!EMAIL_REGEX.test(clean_email)) {
        return res.redirect("/auth/signup?error=Invalid%20email");
    }

    try {
        const existingUser = await pool.query("SELECT id FROM user_account WHERE email = $1", [
            clean_email,
        ]);
        if (existingUser.rows.length > 0) {
            return res.redirect("/auth/signup?error=User%20Already%20Exists");
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            `
      INSERT INTO user_account (user_name, email, password_hash, team_id, role)
      VALUES ($1, $2, $3, NULL, $4)
      RETURNING id, user_name, email, role
      `,
            [user_name, clean_email, passwordHash, ROLES.PENDING]
        );
        req.session.user_id = result.rows[0].id;
        req.session.user_name = result.rows[0].user_name;
        req.session.email = result.rows[0].email;
        req.session.role = result.rows[0].role;
        req.session.team = null;
        req.session.team_id = null;
        req.session.save((err) => {
            if (err) {
                return res.redirect("/auth/signup?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch {
        return res.redirect("/auth/signup?error=Server%20Error");
    }
}

/**
 * Internal helper to verify plain text password against stored hash.
 * @param {string} plainPassword - User-provided password.
 * @param {string} hashedPassword - Hash from database.
 * @param {Object} res - Express response object.
 * @returns {Promise<boolean>} True if match, false otherwise.
 */
async function checkPassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch {
        return false;
    }
}

/**
 * Handles user authentication.
 * 1. Verifies user existence and password hash.
 * 2. Fetches associated team name if a team_id exists.
 * 3. Populates session with user_id, user_name, role, and team details.
 * @param {Object} req - Express request object. Expects req.body: {email, password}.
 * @param {Object} res - Express response object.
 */
export async function login(req, res) {
    const { email, password } = req.body;
    const clean_email = email.trim().toLowerCase();

    if (!clean_email || !password) {
        return res.redirect("/auth/login?error=Missing%20field");
    }

    try {
        const userResult = await pool.query(
            "SELECT id, user_name, password_hash, team_id, email, role FROM user_account WHERE email = $1",
            [clean_email]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.redirect("/auth/login?error=Invalid%20Credentials");
        }

        req.session.team = null;
        req.session.role = user.role;
        req.session.team_id = user.team_id;
        req.session.email = user.email;

        if (user.team_id !== null) {
            const team = await pool.query("SELECT name, lead_id FROM team WHERE id = $1", [
                user.team_id,
            ]);
            req.session.team = team.rows[0].name;
        }

        if (await checkPassword(password, user.password_hash, res)) {
            req.session.user_id = user.id;
            req.session.user_name = user.user_name;
            req.session.save((err) => {
                if (err) {
                    return res.redirect("/auth/login?error=Server%20Error");
                }
                res.redirect("/dashboard");
            });
        } else {
            return res.redirect("/auth/login?error=Invalid%20Credentials");
        }
    } catch {
        return res.redirect("/auth/login?error=Server%20Error");
    }
}

/**
 * Destroys the user session and clears the session cookie.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function logout(req, res) {
    await req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: "Failed to log out", details: err.message });
            return res.redirect("/dashboard?error=Server%20Error");
        }
        res.clearCookie("connect.sid");
        res.redirect("/auth/login?message=logged-out");
    });
}

/**
 * Creates a new team and assigns the creator as the OWNER.
 * Uses a SQL transaction (BEGIN/COMMIT) to ensure both the team is created
 * and the user is updated simultaneously.
 * @param {Object} req - Express request object. Expects req.body.team_name.
 * @param {Object} res - Express response object.
 */
export async function createTeam(req, res) {
    const client = await pool.connect();
    const { team_name } = req.body;
    const user_id = req.session.user_id;

    if (!team_name) {
        return res.redirect("/auth/create-team?error=Missing%20field");
    }

    try {
        const teamResult = await pool.query("SELECT id FROM team WHERE name = $1", [team_name]);
        if (teamResult.rows.length > 0) {
            return res.redirect("/auth/create-team?error=Team%20Already%20Exists");
        }

        await client.query("BEGIN");

        const result = await client.query(
            "INSERT INTO team (name, lead_id) VALUES ($1, $2) RETURNING id, name, lead_id",
            [team_name, user_id]
        );

        await client.query("UPDATE user_account SET team_id = $1, role = $2 WHERE id = $3", [
            result.rows[0].id,
            ROLES.OWNER,
            user_id,
        ]);

        await client.query("COMMIT");

        req.session.team = team_name;
        req.session.team_id = result.rows[0].id;
        req.session.role = ROLES.OWNER;
        req.session.save((err) => {
            if (err) {
                res.status(500).json({ error: "Failed to save session", details: err.message });
                return res.redirect("/auth/create-team?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch {
        await client.query("ROLLBACK");
        return res.redirect("/auth/create-team?error=Server%20Error");
    } finally {
        client.release();
    }
}

/**
 * Submits a request to join an existing team.
 * Sets the user's team_id but leaves role as PENDING (0) until approved by lead.
 * @param {Object} req - Express request object. Expects req.body.team_name.
 * @param {Object} res - Express response object.
 */
export async function teamRequest(req, res) {
    const { team_name } = req.body;
    const user_id = req.session.user_id;

    if (!team_name) {
        return res.redirect("/auth/join-team?error=Missing%20field");
    }

    try {
        const teamResult = await pool.query("SELECT id FROM team WHERE name = $1", [team_name]);
        if (teamResult.rows.length === 0) {
            return res.redirect("/auth/join-team?error=Team%20Not%20Found");
        }
        const team_id = teamResult.rows[0].id;
        await pool.query("UPDATE user_account SET team_id = $1 WHERE id = $2", [team_id, user_id]);
        req.session.team = team_name;
        req.session.team_id = team_id;
        req.session.save((err) => {
            if (err) {
                res.status(500).json({ error: "Failed to save session", details: err.message });
                return res.redirect("/auth/join-team?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch {
        return res.redirect("/auth/join-team?error=Server%20Error");
    }
}

/**
 * Deletes all expired sessions from the database. Scheduled to run dailty at 3:00 AM Central Time using node-cron.
 */
nodeCron.schedule(
    "0 3 * * *",
    async () => {
        try {
            await pool.query("DELETE FROM session WHERE expire < NOW()");
        } catch (err) {
            console.error("Error cleaning up sessions:", err);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);
