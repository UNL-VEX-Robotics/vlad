import pool from '../db.js';

/*
TODO: test all admin functions 
    Tested functions:
        rejectUserRequest
        acceptUserRequest
    Untested:
        makeUserOwner
    Unused:
        getTeamUsers
*/

// Get all users on the admin's team (for admin dashboard view) (could be moved to another file later for wider use)
export async function getTeamUsers(req, res) {
    try {
        const adminTeamId = req.admin.team_id;
        const result = await pool.query(
            "SELECT id, user_name, email, FROM user_account WHERE team_id = $1 AND is_approved = TRUE",
            [adminTeamId]
        );
        res.status(200).json({ success: true, users: result.rows });
    }
    catch (err) {
        console.error("Error fetching team users:", err);
        res.status(500).json({ success: false, message: "Failed to fetch team users" });
    }
}

// Accepts a user signup request by setting is_approved to true
export async function acceptUserRequest(req, res) {
    const { user_id } = req.body;
    try {
        const result = await pool.query(
            "UPDATE user_account SET is_approved = TRUE WHERE id = $1 RETURNING id, user_name, email, is_approved",
            [user_id]
        );

        res.redirect('/team-requests');

        // res.status(200).json({
        //     success: true,
        //     message: "User approved successfully",
        //     data: result.rows[0]
        // });
    } catch (error) {
        console.error("Error approving user:", error);
        return res.redirect('/team-requests?error=Server%20Error');
        //res.status(500).json({ success: false, message: "Failed to approve user" });
    }
}

// Rejects a user signup request (for admin dashboard view)
export async function rejectUserRequest(req, res) {
    const { user_id } = req.body;
    try {
        // Dont want to delete user completely, but let them reapply to another team later need to decide how to handle this
        const result = await pool.query(
            "UPDATE user_account SET team_id = NULL WHERE id = $1 RETURNING id, user_name, email, team_id",
            [user_id]
        );
        res.redirect('/team-requests');
        // res.status(200).json({
        //     success: true,
        //     message: "User rejected successfully",
        //     data: result.rows[0]
        // });
    }
    catch (error) {
        console.error("Error rejecting user:", error);
        return res.redirect('/team-requests?error=Server%20Error');
        //res.status(500).json({ success: false, message: "Failed to reject user" });
    }
}

// Promote a user to team owner
export async function makeUserOwner(req, res) {
    const { user_id } = req.params;
    try {

        const userExists = await pool.query(
            "SELECT id FROM user_account WHERE id = $1",
            [user_id]
        );

        if (userExists.rows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const result = await pool.query(
            "UPDATE team SET lead_id = $1 WHERE id = (SELECT team_id FROM user_account WHERE id = $1) RETURNING id, lead_id",
            [user_id]
        );
        res.status(200).json({ success: true, message: "User promoted to team owner", data: result.rows[0] });
    }
    catch (error) {
        console.error("Error promoting user to owner:", error);
        res.status(500).json({ success: false, message: "Failed to promote user to owner" });
    }
}

