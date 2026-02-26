import pool from '../db.js';

// Creates a new subteam under the user's team with the user who created the subteam as the lead
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

// Deletes a subteam by id and removes all projects and tasks associated with the subteam
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

// Edits a subteams name by id and new name, checks to make sure the new name is not already taken by another subteam under the same team before updating the name
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