import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { sermonsRouter } from './routes/sermons.js';
import { eventsRouter } from './routes/events.js';
import { groupsRouter } from './routes/groups.js';
import { announcementsRouter } from './routes/announcements.js';
import { givingRouter } from './routes/giving.js';
import { livestreamRouter } from './routes/livestream.js';
import { adminRouter } from './routes/admin.js';
import { authenticate, optionalAuth } from './middleware/auth.js';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authenticate, usersRouter);
app.use('/api/sermons', optionalAuth, sermonsRouter);
app.use('/api/events', optionalAuth, eventsRouter);
app.use('/api/groups', authenticate, groupsRouter);
app.use('/api/announcements', optionalAuth, announcementsRouter);
app.use('/api/giving', authenticate, givingRouter);
app.use('/api/livestream', optionalAuth, livestreamRouter);
app.use('/api/admin', authenticate, adminRouter);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
