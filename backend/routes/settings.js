import express from "express";
import {
    renderSettings,
    renderChangeEmailPage,
    renderEmailUpdateSuccessPage,
    renderFinalizeEmailChangePage,
    renderVerificationSentPage,
    updateSettings,
    sendVerificationEmail,
} from "../controllers/settings.controller.js";

const router = express.Router();

// Get /settings - Render the settings page
router.get("/", renderSettings);

// GET /settings/change-email - Render the change email page
router.get("/change-email", renderChangeEmailPage);

// GET /settings/verify-email - Render the verification sent page
router.get("/verify-email", renderVerificationSentPage);

// GET /settings/finalize-email-change?token=abc123 - Render the finalize email change page
router.get("/finalize-email-change", renderFinalizeEmailChangePage);

// GET /settings/email-update-success - Render the email update success page
router.get("/email-update-success", renderEmailUpdateSuccessPage);

// POST /settings/update - Handle settings update from the form submission
router.post("/update", updateSettings);

// POST /settings/verify-email - Handle email verification request
router.post("/verify-email", sendVerificationEmail);

export default router;
