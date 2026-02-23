import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// All admin routes require at least admin role
adminRouter.use(requireRole('super_admin', 'admin'));

// GET /api/admin/users/pending
adminRouter.get('/users/pending', async (req, res) => {
  // TODO: Phase 1 - list pending user approvals
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/admin/users/:id/approve
adminRouter.post('/users/:id/approve', async (req, res) => {
  // TODO: Phase 1 - approve user
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/admin/users/:id/suspend
adminRouter.post('/users/:id/suspend', async (req, res) => {
  // TODO: Phase 1 - suspend user
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req, res) => {
  // TODO: Phase 5 - change user global role
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/admin/audit-log
adminRouter.get('/audit-log', requireRole('super_admin'), async (req, res) => {
  // TODO: Phase 5 - view audit log
  res.status(501).json({ error: 'Not implemented' });
});
