import db from "../db.js";
import logger from "../utils/logger.js";

/**
 * Renders the create subteam page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const renderCreateSubteam = (req, res) => {
    const error = req.query.error;
    const primaryTeam = req.session.team;
    res.render('subteam/create_subteam', {
        title: "Create Subteam",
        team: primaryTeam,
        error: error
    });
};

/**
 * Creates a new subteam under the user's current team.
 * 1. Validates that a subteam name was provided.
 * 2. Checks for name collisions within the same parent team.
 * 3. Inserts the subteam and assigns the creator (session user) as the subteam lead.
 * @param {Object} req - Express request object. Expects req.body.subteamName and req.session.team_id.
 * @param {Object} res - Express response object. Redirects to dashboard on success.
 */
export async function createSubteam(req, res) {
    const { subteamName } = req.body;

    if (!subteamName) {
        return res.redirect("/subteam/create-subteam?error=Missing%20field");
    }

    try {
        const existingSubteam = await db.subteam.findOne({
            where: {
                team_id: req.session.team_id,
                name: subteamName,
            },
        });

        if (existingSubteam) {
            return res.redirect("/subteam/create-subteam?error=Subteam%20already%20exists");
        }

        await db.subteam.create({
            name: subteamName,
            team_id: req.session.team_id,
            lead_id: req.session.user_id,
        });

        return res.redirect("/dashboard");
    } catch (err) {
        logger.error(`Error creating subteam: ${err}`);
        return res.redirect("/subteam/create-subteam?error=Server%20Error");
    }
}

/**
 * Deletes a subteam by its ID.
 * Note: Database constraints (CASCADE) should handle the removal of
 * associated projects and tasks.
 * @param {Object} req - Express request object. Expects req.body.id (subteam ID).
 * @param {Object} res - Express response object.
 */
export async function deleteSubteam(req, res) {
    const subteamID = req.body.id;

    try {
        await db.subteam.destroy({
            where: { id: subteamID },
        });
        return res.redirect("/dashboard");
    } catch (err) {
        logger.error(`Error deleting subteam: ${err}`);
        return res.redirect("/dashboard?error=Server%20Error");
    }
}

/**
 * TODO: Make edit subteam page
 * Updates the name of an existing subteam.
 * 1. Validates the new name is provided.
 * 2. Ensures the new name isn't already used by another subteam in the same parent team.
 * 3. Updates the subteam record.
 * @param {Object} req - Express request object. Expects req.body: {subteamID, newSubteamName}.
 * @param {Object} res - Express response object.
 */
export async function editSubteam(req, res) {
    const { subteamID, newSubteamName } = req.body;

    if (!newSubteamName) {
        return res.redirect(`/edit-subteam?id=${subteamID}&error=Missing%20field`);
    }

    try {
        const collision = await db.subteam.findOne({
            where: {
                team_id: req.session.team_id,
                name: newSubteamName,
            },
        });
        if (collision) {
            return res.redirect(
                `/edit-subteam?id=${subteamID}&error=Subteam%20name%20already%20exists`
            );
        }

        await db.subteam.update({ name: newSubteamName }, { where: { id: subteamID } });
        return res.redirect("/dashboard");
    } catch (err) {
        logger.error(`Error editing subteam: ${err}`);
        return res.redirect(`/edit-subteam?id=${subteamID}&error=Server%20Error`);
    }
}
