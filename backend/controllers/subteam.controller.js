import pool from '../db.js';

/**
 * Creates a new subteam under the user's current team.
 * 1. Validates that a subteam name was provided.
 * 2. Checks for name collisions within the same parent team.
 * 3. Inserts the subteam and assigns the creator (session user) as the subteam lead.
 * @param {Object} req - Express request object. Expects req.body.subteamName and req.session.team_id.
 * @param {Object} res - Express response object. Redirects to dashboard on success.
 */
export async function createSubteam(req, res){
    const { subteamName } = req.body;

    if (!subteamName) {
        return res.redirect(`/create-subteam?error=Missing%20field`);
    }

    try{
        const existingSubteam = await pool.query(
            'SELECT id FROM subteam WHERE team_id = $1 AND name = $2',
            [req.session.team_id, subteamName]
        );

        if (existingSubteam.rows.length > 0) {
            return res.redirect('/create-subteam?error=Subteam%20already%20exists');
        }

        const result = await pool.query(
            `
            INSERT INTO subteam (name, team_id, lead_id)
            VALUES ($1, $2, $3)
            RETURNING id, name
            `,
            [subteamName, req.session.team_id, req.session.user_id]
        );
        return res.redirect('/dashboard');

    }
    catch(err) {
        console.error(err);
        return res.redirect('/create-subteam?error=Server%20Error');
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
        await pool.query(
            'DELETE FROM subteam WHERE id = $1',
            [subteamID]
        );
        return res.redirect('/dashboard');
    }
    catch(err) {
        console.error(err);
        return res.redirect('/dashboard?error=Server%20Error');
    }
}

/**
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
        const existingSubteam = await pool.query(
            'SELECT id FROM subteam WHERE team_id = $1 AND name = $2',
            [req.session.team_id, newSubteamName]
        );
        if (existingSubteam.rows.length > 0) {
            return res.redirect(`/edit-subteam?id=${subteamID}&error=Subteam%20name%20already%20exists`);
        }

        await pool.query(
            'UPDATE subteam SET name = $1 WHERE id = $2',
            [newSubteamName, subteamID]
        );
        return res.redirect('/dashboard');
    }
    catch(err) {
        console.error(err);
        return res.redirect(`/edit-subteam?id=${subteamID}&error=Server%20Error`);
    }
}