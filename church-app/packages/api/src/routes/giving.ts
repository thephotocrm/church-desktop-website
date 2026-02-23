import { Router } from 'express';
import { requireActive } from '../middleware/auth.js';

export const givingRouter = Router();

// POST /api/giving/checkout
givingRouter.post('/checkout', requireActive, async (req, res) => {
  // TODO: Phase 4 - create Stripe checkout session
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/giving/history
givingRouter.get('/history', requireActive, async (req, res) => {
  // TODO: Phase 4 - get donation history for current user
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/giving/webhook
// Note: this route is mounted without auth — Stripe signs it
givingRouter.post('/webhook', async (req, res) => {
  // TODO: Phase 4 - handle Stripe webhook
  res.status(501).json({ error: 'Not implemented' });
});
