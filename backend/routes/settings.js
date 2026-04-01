import express from "express";
import { renderSettings } from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/", renderSettings);

export default router;
