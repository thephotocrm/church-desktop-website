import { Router } from "express";
import { storage } from "../storage";
import { insertGroupSchema } from "@shared/schema";
import { requireApprovedMember } from "../memberAuth";
import { requireAuth } from "../auth";
import { broadcastToGroup } from "../websocket";

const router = Router();

// GET /api/groups
router.get("/", requireApprovedMember, async (_req, res) => {
  const allGroups = await storage.getGroups();
  res.json(allGroups);
});

// POST /api/groups/:id/join
router.post("/:id/join", requireApprovedMember, async (req, res) => {
  const group = await storage.getGroup((req.params.id as string));
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const already = await storage.isGroupMember((req.params.id as string), req.member!.memberId);
  if (already) {
    return res.status(409).json({ message: "Already a member of this group" });
  }

  const gm = await storage.addGroupMember((req.params.id as string), req.member!.memberId);
  res.status(201).json(gm);
});

// DELETE /api/groups/:id/leave
router.delete("/:id/leave", requireApprovedMember, async (req, res) => {
  const group = await storage.getGroup(req.params.id as string);
  if (group?.isDefault) {
    return res.status(403).json({ message: "Cannot leave the default group" });
  }
  await storage.removeGroupMember((req.params.id as string), req.member!.memberId);
  res.json({ message: "Left group" });
});

// GET /api/groups/:id/members
router.get("/:id/members", requireApprovedMember, async (req, res) => {
  const group = await storage.getGroup((req.params.id as string));
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  const members = await storage.getGroupMembers((req.params.id as string));
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

// GET /api/groups/:id/messages — paginated message history
router.get("/:id/messages", requireApprovedMember, async (req, res) => {
  const groupId = req.params.id as string;
  const group = await storage.getGroup(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const isMember = await storage.isGroupMember(groupId, req.member!.memberId);
  if (!isMember) {
    return res.status(403).json({ message: "Not a member of this group" });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;
  const messages = await storage.getMessages(groupId, limit, before);
  res.json(messages);
});

// POST /api/groups/:id/messages — send a message
router.post("/:id/messages", requireApprovedMember, async (req, res) => {
  const groupId = req.params.id as string;
  const group = await storage.getGroup(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  const isMember = await storage.isGroupMember(groupId, req.member!.memberId);
  if (!isMember) {
    return res.status(403).json({ message: "Not a member of this group" });
  }

  if (group.type === "announcement" && req.member!.role !== "admin") {
    // Check if member is a group admin for this specific group
    const gm = await storage.getGroupMember(groupId, req.member!.memberId);
    if (!gm || gm.role !== "admin") {
      return res.status(403).json({ message: "Only admins can post in announcement groups" });
    }
  }

  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: "Message content is required" });
  }

  const message = await storage.createMessage({
    groupId,
    memberId: req.member!.memberId,
    content: content.trim(),
  });

  broadcastToGroup(groupId, {
    type: "new_message",
    message,
  });

  res.status(201).json(message);
});

// ========== Admin group management ==========

// GET /api/groups/admin — list all groups for admin
router.get("/admin", requireAuth, async (_req, res) => {
  const allGroups = await storage.getGroups();
  res.json(allGroups);
});

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
  const group = await storage.getGroup((req.params.id as string));
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  const { name, description } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  const updated = await storage.updateGroup((req.params.id as string), updates);
  res.json(updated);
});

// DELETE /api/admin/groups/:id
router.delete("/admin/:id", requireAuth, async (req, res) => {
  const group = await storage.getGroup((req.params.id as string));
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  if (group.isDefault) {
    return res.status(403).json({ message: "Cannot delete the default group" });
  }
  await storage.deleteGroup((req.params.id as string));
  res.json({ message: "Group deleted" });
});

export default router;
