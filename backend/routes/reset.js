import express from "express";
import { sendResetPasswordEmail, resetPassword } from "../controllers/reset.controller.js";
import {
    renderForgotPassword,
    renderEmailSent,
    renderResetPassword,
    renderResetConfirmation,
} from "../controllers/reset.controller.js";

const router = express.Router();

// GET /reset/forgot-password
router.get("/forgot-password", renderForgotPassword);

// GET /reset/email-sent
router.get("/email-sent", renderEmailSent);

// GET /reset/reset-password
router.get("/reset-password", renderResetPassword);

// GET /reset/reset-confirmation
router.get("/reset-confirmation", renderResetConfirmation);

// POST /reset/send
router.post("/send", sendResetPasswordEmail);

// POST /reset/reset-password
router.post("/reset-password", resetPassword);

export default router;
