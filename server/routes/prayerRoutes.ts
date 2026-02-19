import { Router } from "express";
import { storage } from "../storage";
import { optionalMember, requireMember, requireApprovedMember } from "../memberAuth";
import { requireAuth } from "../auth";

const router = Router();

// GET /api/prayer-requests
router.get("/", optionalMember, async (req, res) => {
  const { since, status, limit, offset } = req.query;
  const requests = await storage.getPrayerRequests({
    since: since as string | undefined,
    status: (status as string) || "active",
    isPublic: true,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  });

  // Strip author info from anonymous requests for public view
  const sanitized = requests.map((r) => ({
    ...r,
    authorName: r.isAnonymous ? null : r.authorName,
    memberId: r.isAnonymous ? null : r.memberId,
  }));

  res.json(sanitized);
});

// GET /api/prayer-requests/:id
router.get("/:id", optionalMember, async (req, res) => {
  const request = await storage.getPrayerRequest(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Prayer request not found" });
  }

  // Strip author info if anonymous
  if (request.isAnonymous) {
    res.json({ ...request, authorName: null, memberId: null });
  } else {
    res.json(request);
  }
});

// POST /api/prayer-requests
router.post("/", optionalMember, async (req, res) => {
  const { title, body, isAnonymous, isPublic, groupId, authorName } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required" });
  }

  // If not logged in, require authorName
  if (!req.member && !authorName) {
    return res.status(400).json({ message: "Author name is required for anonymous submissions" });
  }

  const member = req.member ? await storage.getMember(req.member.memberId) : null;

  const request = await storage.createPrayerRequest({
    memberId: req.member?.memberId || null,
    authorName: authorName || (member ? `${member.firstName} ${member.lastName}` : "Anonymous"),
    isAnonymous: isAnonymous || false,
    title,
    body,
    groupId: groupId || null,
    isPublic: isPublic !== false,
    status: "active",
  });

  res.status(201).json(request);
});

// PATCH /api/prayer-requests/:id
router.patch("/:id", requireMember, async (req, res) => {
  const request = await storage.getPrayerRequest(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Prayer request not found" });
  }
  if (request.memberId !== req.member!.memberId) {
    return res.status(403).json({ message: "Not authorized to edit this prayer request" });
  }

  const { title, body, isAnonymous, isPublic } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (body !== undefined) updates.body = body;
  if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;
  if (isPublic !== undefined) updates.isPublic = isPublic;

  const updated = await storage.updatePrayerRequest(req.params.id, updates);
  res.json(updated);
});

// DELETE /api/prayer-requests/:id
router.delete("/:id", requireMember, async (req, res) => {
  const request = await storage.getPrayerRequest(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Prayer request not found" });
  }
  if (request.memberId !== req.member!.memberId) {
    return res.status(403).json({ message: "Not authorized to delete this prayer request" });
  }

  await storage.deletePrayerRequest(req.params.id);
  res.json({ message: "Prayer request deleted" });
});

// POST /api/prayer-requests/:id/pray
router.post("/:id/pray", async (req, res) => {
  const request = await storage.getPrayerRequest(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Prayer request not found" });
  }
  const updated = await storage.incrementPrayerCount(req.params.id);
  res.json({ prayerCount: updated.prayerCount });
});

// GET /api/groups/:id/prayer-requests (group prayer requests)
router.get("/group/:groupId", requireApprovedMember, async (req, res) => {
  const isMember = await storage.isGroupMember(req.params.groupId, req.member!.memberId);
  if (!isMember) {
    return res.status(403).json({ message: "Not a member of this group" });
  }

  const requests = await storage.getPrayerRequests({
    groupId: req.params.groupId,
    status: "active",
  });
  res.json(requests);
});

// ========== Admin ==========

// GET /api/admin/prayer-requests
router.get("/admin/all", requireAuth, async (req, res) => {
  const { status } = req.query;
  const requests = await storage.getPrayerRequests({
    status: status as string | undefined,
    limit: 100,
  });
  res.json(requests);
});

// PATCH /api/admin/prayer-requests/:id
router.patch("/admin/:id", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!status || !["active", "answered", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const updated = await storage.updatePrayerRequest(req.params.id, { status });
  res.json(updated);
});

export default router;
