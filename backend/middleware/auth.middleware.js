// Checks if a users has a session before they can access the specified page
export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user_id) {
        return next();
    } else {
        res.redirect("/login");
    }
};

// To check if the user has the correct permissions to access a page based on their role on the team
export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.session && req.session.role >= requiredRole) {
            next();
        } else {
            res.redirect("/dashboard?error=Insufficient%20Permissions");
        }
    };
};
