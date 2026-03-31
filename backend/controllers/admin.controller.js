import pool from "../db.js";
import { ROLES } from "../utils/constants.js";
import { withLayout } from "../views/layout.js";
import { teamRequestsPage } from "../views/admin.view.js";

/**
 * Renders the user Team Requests page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const renderTeamRequests = async (req, res) => {
    try {
        // Fetch users who are assigned to this team but still have role 0 (Pending)
        const requests = await pool.query(
            `SELECT u.id, u.user_name, u.email 
             FROM user_account u 
             JOIN team t ON u.team_id = t.id 
             WHERE t.name = $1 AND u.role = 0`,
            [req.session.team]
        );

        const content = teamRequestsPage(requests.rows);
        res.send(withLayout("Team Requests", content, req));
    } catch {
        res.status(500).send("Error loading requests");
    }
};

/**
 * Accepts a user join request.
 * Promotes a user from PENDING (0) to MEMBER (1).
 * @param {Object} req - Express request object. Expects req.body.user_id.
 * @param {Object} res - Express response object. Redirects to team requests.
 */
export async function acceptUserRequest(req, res) {
    const { user_id } = req.body;
    try {
        await pool.query(
            "UPDATE user_account SET role = $1 WHERE id = $2 RETURNING id, user_name, email, role",
            [ROLES.MEMBER, user_id]
        );

        res.redirect("/admin/team-requests");
    } catch {
        return res.redirect("/team-requests?error=Server%20Error");
    }
}

/**
 * Rejects a user join request.
 * Removes the team_id association from the user, allowing them to join a different team.
 * @param {Object} req - Express request object. Expects req.body.user_id.
 * @param {Object} res - Express response object. Redirects to team requests.
 */
export async function rejectUserRequest(req, res) {
    const { user_id } = req.body;
    try {
        await pool.query(
            "UPDATE user_account SET team_id = NULL WHERE id = $1 RETURNING id, user_name, email, team_id",
            [user_id]
        );
        await pool.query(
            "INSERT INTO notifications (user_id, title, message, type, created_at) VALUES ($1, $2, $3, $4, NOW())",
            [
                user_id,
                "Join Request Rejected: " + req.session.team,
                "Your request to join " +
                    req.session.team +
                    " was rejected by the team lead. You can try joining a different team or contact your team lead for more information.",
                "rejection",
            ]
        );
        res.redirect("/admin/team-requests");
    } catch {
        return res.redirect("/admin/team-requests?error=Server%20Error");
    }
}

/**
 * Removes a user from their current team.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function removeUserFromTeam(req, res) {
    const { user_id, reason } = req.body;
    try {
        if (req.session.role < ROLES.OWNER) {
            return res.redirect("/dashboard?error=Insufficient%20Permissions");
        }
        await pool.query("UPDATE user_account SET team_id = NULL, role = $1 WHERE id = $2", [
            ROLES.PENDING,
            user_id,
        ]);
        await pool.query(
            "INSERT INTO notifications (user_id, title, message, type, created_at) VALUES ($1, $2, $3, $4, NOW())",
            [user_id, "Removed from Team: " + req.session.team, reason, "removal"]
        );
        return res.redirect("/dashboard");
    } catch {
        return res.redirect("/dashboard?error=System%20Error");
    }
}

/**
 * Promotes or demotes a user to a specified role.
 * Handles role changes for MEMBER, LEAD, ADMIN, and OWNER.
 * Note: Promoting to OWNER will also update the team's lead_id and demote the current owner to ADMIN.
 * @param {Object} req - Express request object. Expects req.body.user_id and req.body.new_role.
 * @param {Object} res - Express response object.
 */
export async function changeUserRole(req, res) {
    const { user_id, new_role } = req.body;
    try {
        if (req.session.role < ROLES.ADMIN) {
            return res.redirect("/dashboard?error=Insufficient%20Permissions");
        }

        const result = await pool.query(
            "UPDATE user_account SET role = $1 WHERE id = $2 RETURNING id, user_name, email, role",
            [new_role, user_id]
        );
        if (new_role === ROLES.OWNER && result.rows.length > 0) {
            await pool.query(
                `UPDATE team SET lead_id = $1 WHERE id = (SELECT team_id FROM user_account WHERE id = $1)
                 UPDATE user_account SET role = $2 WHERE id = $3`,
                [user_id, ROLES.ADMIN, req.session.user_id]
            );
        }
        return res.redirect("/dashboard");
    } catch {
        return res.redirect("/dashboard?error=Failed%20to%20promote%20user");
    }
}
