import express from "express";
import {
    renderSettings,
    renderChangeEmailPage,
    renderEmailUpdateSuccessPage,
    renderFinalizeEmailChangePage,
    renderVerificationSentPage,
    renderAccountSecuredPage,
    updateSettings,
    sendVerificationEmail,
    finalizeEmailChange,
    reportUnauthorizedEmailChange,
} from "../controllers/settings.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get /settings - Render the settings page
router.get("/", isAuthenticated, renderSettings);

// GET /settings/change-email - Render the change email page
router.get("/change-email", isAuthenticated, renderChangeEmailPage);

// GET /settings/verify-email - Render the verification sent page
router.get("/verify-email", isAuthenticated, renderVerificationSentPage);

// GET /settings/finalize-email-change?token=abc123 - Render the finalize email change page
router.get("/finalize-email-change", isAuthenticated, renderFinalizeEmailChangePage);

// GET /settings/email-update-success - Render the email update success page
router.get("/email-update-success", renderEmailUpdateSuccessPage);

// GET /settings/account-secured - Render the account secured page after reporting a security issue
router.get("/account-secured", renderAccountSecuredPage);

// POST /settings/update - Handle settings update from the form submission
router.post("/update", isAuthenticated, updateSettings);

// POST /settings/verify-email - Handle email verification request
router.post("/verify-email", isAuthenticated, sendVerificationEmail);

// POST /settings/finalize-email - Handle finalizing the email change with the token
router.post("/finalize-email", finalizeEmailChange);

// POST /settings/report-email-change - Handle reporting an unauthorized email change
router.post("/report-email-change", reportUnauthorizedEmailChange);

export default router;
