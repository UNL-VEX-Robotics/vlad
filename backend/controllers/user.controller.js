import db from "../db.js";
import { Op } from "sequelize";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Renders the user dashboard page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const renderDashboard = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // Fetch the latest team and role directly from the account table
        const user = await db.user_account.findByPk(userId, {
            include: [
                {
                    model: db.notifications,
                    as: "notifications",
                    where: { is_read: false },
                    required: false,
                },
            ],
        });

        if (!user) return res.redirect("/auth/login");

        req.session.team_id = user.team_id;
        req.session.role = user.role;
        if (user.team_id === null) {
            req.session.team = null;
        }

        const teamId = user.team_id;
        let members = [];
        let subteams = [];
        let requests = [];

        if (teamId) {
            // Fetch members
            members = await db.user_account.findAll({
                where: {
                    team_id: teamId,
                    role: {
                        [Op.gt]: ROLES.PENDING,
                    },
                },
                attributes: ["id", "user_name", "role"],
                order: [["role", "DESC"]],
            });

            // Fetch pending members
            requests = await db.user_account.findAll({
                where: { team_id: teamId, role: ROLES.PENDING },
                attributes: ["id", "user_name", "role"],
                order: [["role", "DESC"]],
            });

            // Fetch subteams
            subteams = await db.subteam.findAll({
                where: { team_id: teamId },
            });
        }

        res.render("user/dashboard", {
            title: "Dashboard",
            user: req.session,
            notifications: user.notifications || [],
            members: members.map((m) => m.get({ plain: true })),
            subteams: subteams.map((s) => s.get({ plain: true })),
            ROLES: ROLES,
            requests: requests,
            error: req.query.error,
        });
    } catch (err) {
        logger.error(`Error rendering dashboard: ${err}`);
        return res.status(500).json({ error: "Failed to load dashboard", details: err.message });
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
        const user = await db.user_account.findByPk(targetUserId, {
            include: [
                {
                    model: db.team,
                    as: "team",
                    attributes: ["name"],
                },
            ],
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const userData = {
            ...user.get({ plain: true }),
            team_name: user.team?.name || null,
        };

        res.render("user/profile", {
            title: user.user_name + "'s Profile",
            profileUser: userData,
            ROLES: ROLES,
            error: error,
        });
    } catch (err) {
        logger.error(`Error rendering profile page: ${err}`);
        res.status(500).json({ error: "Failed to load profile", details: err.message });
    }
};
