import bcrypt from "bcrypt";
import db from "../db.js";
import nodeCron from "node-cron";
import { withLayout } from "../views/layout.js";
import { signupPage, loginPage, createTeamPage, joinTeamPage } from "../views/auth.view.js";
import { ROLES, EMAIL_REGEX, SALT_ROUNDS, PASSWORD_REGEX } from "../utils/constants.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

//TODO: Set up 2fa for users who want it. The only part currently implemented is the database and settings page with the yes or no toggle option
// but the actual generation of everything else needed for 2fa needs to be implemented. Start with just email based and possibly move
// onto SMS based or eventually app based in the future but the changes to other parts of the application are needed for these changes

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
        const existingUser = await db.user_account.findOne({ where: { email: clean_email } });
        if (existingUser) {
            return res.redirect("/auth/signup?error=User%20Already%20Exists");
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await db.user_account.create({
            user_name,
            email: clean_email,
            password_hash: passwordHash,
            role: ROLES.PENDING,
        });
        req.session.user_id = newUser.id;
        req.session.user_name = newUser.user_name;
        req.session.email = newUser.email;
        req.session.role = newUser.role;
        req.session.team = null;
        req.session.team_id = null;
        req.session.theme = "system";
        req.session.save((err) => {
            if (err) {
                logger.error("Error saving session after signup:", err);
                return res.redirect("/auth/signup?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch (err) {
        logger.error("Error during user signup:", err);
        return res.redirect("/auth/signup?error=Server%20Error");
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
        const user = await db.user_account.findOne({
            where: { email: clean_email },
            include: [
                {
                    model: db.team,
                    as: "team",
                    attributes: ["name"],
                },
            ],
        });

        if (!user) {
            return res.redirect("/auth/login?error=Invalid%20Credentials");
        }

        const user_settings = await db.user_settings.findOne({
            where: { user_id: user.id },
        });

        if (!user) {
            return res.redirect("/auth/login?error=Invalid%20Credentials");
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch && !user.require_password_reset) {
            req.session.team = user.team?.name || null;
            req.session.role = user.role;
            req.session.team_id = user.team_id;
            req.session.email = user.email;
            req.session.theme = user_settings.theme || "system";
            req.session.user_name = user.user_name;
            req.session.user_id = user.id;
            req.session.save((err) => {
                if (err) {
                    logger.error("Error saving session after login:", err);
                    return res.redirect("/auth/login?error=Server%20Error");
                }
                res.redirect("/dashboard");
            });
        } else if (isMatch && user.require_password_reset) {
            return res.redirect("/reset/forgot-password?error=Password%20Reset%20Required");
        } else {
            return res.redirect("/auth/login?error=Invalid%20Credentials");
        }
    } catch (err) {
        logger.error("Error during user login:", err);
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
            logger.error("Error destroying session during logout:", err);
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
    const { team_name } = req.body;
    const user_id = req.session.user_id;

    if (!team_name) {
        return res.redirect("/auth/create-team?error=Missing%20field");
    }

    try {
        const existingTeam = await db.team.findOne({ where: { name: team_name } });
        if (existingTeam) {
            return res.redirect("/auth/create-team?error=Team%20Already%20Exists");
        }

        await db.sequelize.transaction(async (t) => {
            const newTeam = await db.team.create(
                {
                    name: team_name,
                    lead_id: user_id,
                },
                { transaction: t }
            );

            await db.user_account.update(
                { team_id: newTeam.id, role: ROLES.OWNER },
                { where: { id: user_id }, transaction: t }
            );

            req.session.team_id = newTeam.id;
        });

        req.session.team = team_name;
        req.session.role = ROLES.OWNER;
        req.session.save((err) => {
            if (err) {
                logger.error("Error saving session after team creation:", err);
                return res.redirect("/auth/create-team?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch (err) {
        logger.error("Error during team creation:", err);
        return res.redirect("/auth/create-team?error=Server%20Error");
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
        const team = await db.team.findOne({ where: { name: team_name } });
        if (!team) {
            return res.redirect("/auth/join-team?error=Team%20Not%20Found");
        }
        await db.user_account.update({ team_id: team.id }, { where: { id: user_id } });
        req.session.team = team_name;
        req.session.team_id = team.id;
        req.session.save((err) => {
            if (err) {
                logger.error("Error saving session after team join request:", err);
                return res.redirect("/auth/join-team?error=Server%20Error");
            }
            res.redirect("/dashboard");
        });
    } catch (err) {
        logger.error("Error during team join request:", err);
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
            await db.session.destroy({
                where: {
                    expire: {
                        [Op.lt]: new Date(),
                    },
                },
            });
            logger.info("Expired sessions cleared successfully.");
        } catch (err) {
            logger.error("Error clearing expired sessions:", err);
        }
    },
    {
        scheduled: true,
        timezone: "America/Chicago",
    }
);
