import { Router } from 'express';
import { loginLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  // TODO: Phase 1 - implement registration
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req, res) => {
  // TODO: Phase 1 - implement login
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/verify-email
authRouter.post('/verify-email', async (req, res) => {
  // TODO: Phase 1 - implement email verification
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req, res) => {
  // TODO: Phase 1 - implement forgot password
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  // TODO: Phase 1 - implement reset password
  res.status(501).json({ error: 'Not implemented' });
});
