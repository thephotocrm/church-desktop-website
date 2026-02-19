import { Router } from "express";
import { storage } from "../storage";
import { insertGroupSchema } from "@shared/schema";
import { requireApprovedMember } from "../memberAuth";
import { requireAuth } from "../auth";

const router = Router();

// GET /api/groups
router.get("/", requireApprovedMember, async (_req, res) => {
  const allGroups = await storage.getGroups();
  res.json(allGroups);
});

// POST /api/groups/:id/join
router.post("/:id/join", requireApprovedMember, async (req, res) => {
  const group = await storage.getGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const already = await storage.isGroupMember(req.params.id, req.member!.memberId);
  if (already) {
    return res.status(409).json({ message: "Already a member of this group" });
  }

  const gm = await storage.addGroupMember(req.params.id, req.member!.memberId);
  res.status(201).json(gm);
});

// DELETE /api/groups/:id/leave
router.delete("/:id/leave", requireApprovedMember, async (req, res) => {
  await storage.removeGroupMember(req.params.id, req.member!.memberId);
  res.json({ message: "Left group" });
});

// GET /api/groups/:id/members
router.get("/:id/members", requireApprovedMember, async (req, res) => {
  const group = await storage.getGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  const members = await storage.getGroupMembers(req.params.id);
  res.json(members.map((gm) => ({
    ...gm,
    member: gm.member ? {
      id: gm.member.id,
      firstName: gm.member.firstName,
      lastName: gm.member.lastName,
      photoUrl: gm.member.photoUrl,
    } : null,
  })));
});

// ========== Admin group management ==========

// POST /api/admin/groups
router.post("/admin", requireAuth, async (req, res) => {
  const parsed = insertGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
  }
  const group = await storage.createGroup(parsed.data);
  res.status(201).json(group);
});

// PATCH /api/admin/groups/:id
router.patch("/admin/:id", requireAuth, async (req, res) => {
  const group = await storage.getGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  const { name, description } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  const updated = await storage.updateGroup(req.params.id, updates);
  res.json(updated);
});

// DELETE /api/admin/groups/:id
router.delete("/admin/:id", requireAuth, async (req, res) => {
  const group = await storage.getGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  await storage.deleteGroup(req.params.id);
  res.json({ message: "Group deleted" });
});

export default router;
