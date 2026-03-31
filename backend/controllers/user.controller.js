import pool from "../db.js";
import { withLayout } from "../views/layout.js";
import { dashboardPage, profilePage } from "../views/user.view.js";
import { ROLES } from "../utils/constants.js";

/**
 * Renders the user dashboard page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const renderDashboard = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // 0. Sync Session with DB
        // Fetch the latest team and role directly from the account table
        const userSync = await pool.query("SELECT team_id, role FROM user_account WHERE id = $1", [
            userId,
        ]);

        if (userSync.rows.length > 0) {
            const { team_id, role } = userSync.rows[0];
            req.session.team_id = team_id;
            req.session.role = role;
        }

        if (req.session.team_id === null) {
            req.session.team = null;
        }

        // Now use the freshly updated session values
        const teamId = req.session.team_id;

        // 1. Fetch Notifications
        const notifs = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE",
            [userId]
        );

        // 2. Fetch Members (only if they have a team)
        let members = [];
        if (teamId) {
            const memberRes = await pool.query(
                "SELECT id, user_name, role FROM user_account WHERE team_id = $1 ORDER BY role DESC",
                [teamId]
            );
            members = memberRes.rows;
        }

        // 3. Fetch Subteams
        let subteams = [];
        if (teamId) {
            const subRes = await pool.query("SELECT * FROM subteam WHERE team_id = $1", [teamId]);
            subteams = subRes.rows;
        }

        const pageData = {
            user: req.session,
            notifications: notifs.rows,
            members,
            subteams,
            error: req.query.error,
        };
        res.send(withLayout("Dashboard", dashboardPage(pageData), req));
    } catch (err) {
        res.status(500).json({ error: "Failed to load dashboard", details: err.message });
    }
};

/**
 * Renders the profile page for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const renderProfile = async (req, res) => {
    const error = req.query.error;
    const targetUserId = req.query.user_id;

    try {
        const userResult = await pool.query(
            `SELECT u.id, u.user_name, u.email, u.role, t.name as team_name 
             FROM user_account u 
             LEFT JOIN team t ON u.team_id = t.id 
             WHERE u.id = $1`,
            [targetUserId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = userResult.rows[0];
        const sessionUser = {
            id: req.session.user_id,
            role: req.session.role,
        };

        const content = profilePage(user, sessionUser, error, ROLES);
        res.send(withLayout(`${user.user_name}'s Profile`, content, req));
    } catch (err) {
        res.status(500).json({ error: "Failed to load profile", details: err.message });
    }
};
