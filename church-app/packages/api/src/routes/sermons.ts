import { Router } from 'express';
import { authenticate, requireActive, requireRole } from '../middleware/auth.js';

export const sermonsRouter = Router();

// GET /api/sermons (public)
sermonsRouter.get('/', async (req, res) => {
  // TODO: Phase 1 - list sermons (paginated)
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/sermons/:id (public)
sermonsRouter.get('/:id', async (req, res) => {
  // TODO: Phase 1 - get single sermon
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/sermons
sermonsRouter.post('/', authenticate, requireRole('super_admin', 'admin', 'pastor'), async (req, res) => {
  // TODO: Phase 1 - create sermon
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/sermons/:id
sermonsRouter.patch('/:id', authenticate, requireRole('super_admin', 'admin', 'pastor'), async (req, res) => {
  // TODO: Phase 1 - update sermon
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/sermons/:id
sermonsRouter.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  // TODO: Phase 1 - delete sermon
  res.status(501).json({ error: 'Not implemented' });
});
