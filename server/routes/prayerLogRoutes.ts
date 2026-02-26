import { Router } from "express";
import { storage } from "../storage";
import { requireMember } from "../memberAuth";

const router = Router();

// GET /api/prayer-logs — public, returns last 24h logs with member first names
router.get("/", async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await storage.getPrayerLogs(since);
  res.json(logs);
});

// POST /api/prayer-logs/checkin — public (kiosk mode), accepts { memberId }
router.post("/checkin", async (req, res) => {
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({ message: "memberId is required" });
  }

  const member = await storage.getMember(memberId);
  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }

  // Prevent duplicate check-ins within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLogs = await storage.getPrayerLogs(oneHourAgo);
  const alreadyCheckedIn = recentLogs.some((log) => log.memberId === memberId);

  if (alreadyCheckedIn) {
    return res.status(409).json({ message: "Already checked in within the last hour" });
  }

  const log = await storage.createPrayerLog(memberId);
  res.status(201).json({ ...log, member: { firstName: member.firstName, lastName: member.lastName } });
});

// POST /api/prayer-logs/checkin/auth — requireMember (mobile mode)
router.post("/checkin/auth", requireMember, async (req, res) => {
  const memberId = req.member!.memberId;

  // Prevent duplicate check-ins within 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLogs = await storage.getPrayerLogs(oneHourAgo);
  const alreadyCheckedIn = recentLogs.some((log) => log.memberId === memberId);

  if (alreadyCheckedIn) {
    return res.status(409).json({ message: "Already checked in within the last hour" });
  }

  const member = await storage.getMember(memberId);
  const log = await storage.createPrayerLog(memberId);
  res.status(201).json({ ...log, member: { firstName: member?.firstName, lastName: member?.lastName } });
});

export default router;
