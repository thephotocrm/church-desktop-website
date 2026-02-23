import { Router } from 'express';

export const eventsRouter = Router();

// All event endpoints are served by the desktop website backend (fpcd.life).
// The mobile app calls those endpoints directly via apps/mobile/src/services/api.ts.
// This router is intentionally empty — no local stubs needed.
