import express from "express";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/reset.js";
import adminRoutes from "./routes/admin.js";
import subteamRoutes from "./routes/subteam.js";
import userRoutes from "./routes/user.js";
import notificationRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import session from "express-session";
import SequelizeStoreConstructor from "connect-session-sequelize";
import bodyParser from "body-parser";

const app = express();
const SequelizeStore = SequelizeStoreConstructor(session.Store);
const sessionStore = new SequelizeStore({
    db: db.sequelize,
    tableName: "session",
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000,
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: parseInt(process.env.COOKIE_MAX_AGE),
            httpOnly: true,
            secure: false,
        },
    })
);

app.use(async (req, res, next) => {
    if (req.session && req.session.user_id) {
        try {
            // Fetch multiple updated fields from the DB
            const user = await db.user_account.findByPk(req.session.user_id, {
                attributes: ["role", "user_name", "team_id"],
            });

            if (user) {
                req.session.role = user.role;
                req.session.user_name = user.user_name; // Syncs name changes
                req.session.team_id = user.team_id; // Syncs team switches
            }
        } catch (err) {
            return res
                .status(500)
                .json({ error: "Failed to sync session data", details: err.message });
        }
    }
    next();
});

// --- ROUTES ---

const auth = "/auth";
app.use(auth, authRoutes);

const reset = "/reset";
app.use(reset, emailRoutes);

const admin = "/admin";
app.use(admin, adminRoutes);

const subteam = "/subteam";
app.use(subteam, subteamRoutes);

const notifications = "/notifications";
app.use(notifications, notificationRoutes);

const settings = "/settings";
app.use(settings, settingsRoutes);

app.use("/", userRoutes);

app.get("/health", async (req, res) => {
    try {
        await db.sequelize.authenticate();
        res.json({ status: "ok", db: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", db: "disconnected", details: err.message });
    }
});

// --- ROUTES ---

// Signup Page
app.get("/signup", (req, res) => res.redirect("/auth/signup"));

// Login Page
app.get("/login", (req, res) => res.redirect("/auth/login"));

// Main Dashboard Page
app.get("/", (req, res) => res.redirect("/dashboard"));

// Page with a profile for the specifed user
app.get("/profile", (req, res) => res.redirect("/profile"));

// Where the requests to join the team are located for admins
app.get("/team-requests", (req, res) => res.redirect("/admin/team-requests"));

// Team Creation Page
app.get("/create-team", (req, res) => res.redirect("/auth/create-team"));

// Page to request to join a team
app.get("/join-team", (req, res) => res.redirect("/auth/join-team"));

// Page to collect email before a reset password email is sent
app.get("/forgot-password", (req, res) => res.redirect("/reset/forgot-password"));

// Where you are sent after email is sent to user
app.get("/email-sent", (req, res) => res.redirect("/reset/email-sent"));

// Page where you reset your password accessed through link with specified token
app.get("/reset-password", (req, res) =>
    res.redirect(`/reset/reset-password?token=${req.query.token}`)
);

// Where you are sent after password is reset
app.get("/reset-confirmation", (req, res) => res.redirect("/reset/reset-confirmation"));

// Where team leads can create subteams for their team
app.get("/create-subteam", (req, res) => res.redirect("/subteam/create-subteam"));

// A notification hub that allows users to see all their notifications in one place and mark them as read
app.get("/notifications", (req, res) => res.redirect("/notifications/hub"));

// A settings page that allows the user to change various settings related to their account and the application
app.get("/settings", (req, res) => res.redirect("/settings"));

export default app;
