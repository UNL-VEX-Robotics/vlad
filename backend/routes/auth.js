import express from 'express';
import { signup, login, createTeam, teamRequest, logout } from '../controllers/auth.controller.js';

const router = express.Router();

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/login
router.post('/login', login);

// POST /auth/create-team
router.post('/create-team', createTeam);

// POST /auth/join-team
router.post('/join-team', teamRequest);

// POST /auth/logout
router.post('/logout', logout);

export default router;