import express from "express";
import {
    signup,
    login,
    createTeam,
    teamRequest,
    logout,
    renderSignup,
    renderLogin,
    renderCreateTeam,
    renderJoinTeam,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /signup
router.get("/signup", renderSignup);

// GET /login
router.get("/login", renderLogin);

// GET Route to show the page
router.get("/create-team", isAuthenticated, renderCreateTeam);

// GET Route to show the page
router.get("/join-team", isAuthenticated, renderJoinTeam);

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/login
router.post("/login", login);

// POST /auth/create-team
router.post("/create-team", isAuthenticated, createTeam);

// POST /auth/join-team
router.post("/join-team", isAuthenticated, teamRequest);

// POST /auth/logout
router.post("/logout", logout);

export default router;
