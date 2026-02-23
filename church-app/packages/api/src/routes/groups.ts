import { Router } from 'express';
import { requireActive, requireRole } from '../middleware/auth.js';

export const groupsRouter = Router();

// GET /api/groups
groupsRouter.get('/', requireActive, async (req, res) => {
  // TODO: Phase 2 - list groups user belongs to
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/groups/:id
groupsRouter.get('/:id', requireActive, async (req, res) => {
  // TODO: Phase 2 - get group details
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/groups
groupsRouter.post('/', requireRole('super_admin', 'admin', 'pastor'), async (req, res) => {
  // TODO: Phase 2 - create group
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/groups/:id/members
groupsRouter.post('/:id/members', requireActive, async (req, res) => {
  // TODO: Phase 2 - add member to group
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/groups/:id/members/:userId
groupsRouter.delete('/:id/members/:userId', requireActive, async (req, res) => {
  // TODO: Phase 2 - remove member from group
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/groups/:id/messages
groupsRouter.get('/:id/messages', requireActive, async (req, res) => {
  // TODO: Phase 3 - get group chat messages
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/groups/:id/messages
groupsRouter.post('/:id/messages', requireActive, async (req, res) => {
  // TODO: Phase 3 - send group chat message
  res.status(501).json({ error: 'Not implemented' });
});
