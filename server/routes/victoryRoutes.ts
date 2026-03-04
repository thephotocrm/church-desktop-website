import { Router } from "express";
import { storage } from "../storage";
import { requireApprovedMember, optionalMember } from "../memberAuth";
import { requireAuth } from "../auth";

const router = Router();

// GET /api/victory-reports — public, active + isPublic
router.get("/", async (req, res) => {
  const { since, limit, offset } = req.query;
  const reports = await storage.getVictoryReports({
    since: since as string | undefined,
    status: "active",
    isPublic: true,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  });

  const sanitized = reports.map((r) => ({
    ...r,
    authorName: r.isAnonymous ? null : r.authorName,
    memberId: r.isAnonymous ? null : r.memberId,
  }));

  res.json(sanitized);
});

// POST /api/victory-reports — requireMember (mobile app)
router.post("/", requireApprovedMember, async (req, res) => {
  const { title, body, isAnonymous } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required" });
  }

  const member = await storage.getMember(req.member!.memberId);

  const report = await storage.createVictoryReport({
    memberId: req.member!.memberId,
    authorName: member ? `${member.firstName} ${member.lastName}` : "Anonymous",
    isAnonymous: isAnonymous || false,
    title,
    body,
    isPublic: true,
    status: "active",
  });

  res.status(201).json(report);
});

// POST /api/victory-reports/kiosk — public (no auth), kiosk guest submissions
router.post("/kiosk", async (req, res) => {
  const { title, body, authorName, isAnonymous } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required" });
  }

  if (!isAnonymous && !authorName) {
    return res.status(400).json({ message: "Author name is required for non-anonymous submissions" });
  }

  const report = await storage.createVictoryReport({
    memberId: null,
    authorName: isAnonymous ? "Anonymous" : authorName,
    isAnonymous: isAnonymous || false,
    title,
    body,
    isPublic: true,
    status: "active",
  });

  res.status(201).json(report);
});

// GET /api/victory-reports/admin/all — requireAuth, admin list
router.get("/admin/all", requireAuth, async (req, res) => {
  const { status } = req.query;
  const reports = await storage.getVictoryReports({
    status: status as string | undefined,
    limit: 100,
  });
  res.json(reports);
});

// PATCH /api/victory-reports/admin/:id — requireAuth, status update
router.patch("/admin/:id", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!status || !["active", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const updated = await storage.updateVictoryReport(req.params.id as string, { status });
  res.json(updated);
});

export default router;
