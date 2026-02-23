import { Router } from 'express';
import { requireActive } from '../middleware/auth.js';

export const usersRouter = Router();

// GET /api/users/me
usersRouter.get('/me', async (req, res) => {
  // TODO: Phase 1 - get current user profile
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/users/me
usersRouter.patch('/me', requireActive, async (req, res) => {
  // TODO: Phase 1 - update own profile
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/users/directory
usersRouter.get('/directory', requireActive, async (req, res) => {
  // TODO: Phase 2 - scoped member directory
  res.status(501).json({ error: 'Not implemented' });
});
