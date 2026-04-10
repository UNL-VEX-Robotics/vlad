import db from "../db.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";
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
        const users = await db.user_account.findAll({
            attributes: ["id", "user_name", "email"],
            where: { role: 0 },
            include: [
                {
                    model: db.team,
                    as: "team",
                    where: { name: req.session.team },
                    attributes: [],
                },
            ],
        });

        const content = teamRequestsPage(users.map((u) => u.get({ plain: true })));
        res.send(withLayout("Team Requests", content, req));
    } catch (err) {
        logger.error("Error rendering team requests page:", err);
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
        await db.user_account.update({ role: ROLES.MEMBER }, { where: { id: user_id } });

        res.redirect("/admin/team-requests");
    } catch (err) {
        logger.error("Error accepting user request:", err);
        return res.redirect("/admin/team-requests?error=Server%20Error");
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
        await db.user_account.update({ team_id: null }, { where: { id: user_id } });
        await db.notifications.create({
            user_id: user_id,
            title: `Join Request Rejected: ${req.session.team}`,
            message: `Your request to join ${req.session.team} was rejected by the team lead.`,
            type: "rejection",
        });
        res.redirect("/admin/team-requests");
    } catch (err) {
        logger.error("Error rejecting user request to join team:", err);
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
        await db.user_account.update(
            { team_id: null, role: ROLES.PENDING },
            { where: { id: user_id } }
        );
        await db.notifications.create({
            user_id: user_id,
            title: `Removed from Team: ${req.session.team}`,
            message: reason,
            type: "removal",
        });
        return res.redirect("/dashboard");
    } catch (err) {
        logger.error("Error removing user from team:", {
            error: err,
            user: user_id,
            reason: reason,
            team: req.session.team,
        });
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

        const user = await db.user_account.findByPk(user_id);
        if (!user) {
            return res.redirect("/dashboard?error=User%20not%20found");
        }
        await user.update({ role: new_role });
        if (new_role === ROLES.OWNER) {
            await db.team.update({ lead_id: user_id }, { where: { id: user.team_id } });

            await db.user_account.update(
                { role: ROLES.ADMIN },
                { where: { id: req.session.user_id } }
            );
        }
        return res.redirect("/dashboard");
    } catch (err) {
        logger.error("Error changing user role:", err);
        return res.redirect("/dashboard?error=Failed%20to%20promote%20user");
    }
}
