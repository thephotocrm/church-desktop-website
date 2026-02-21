import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { insertMemberSchema, loginMemberSchema } from "@shared/schema";
import { signAccessToken, signRefreshToken, verifyToken } from "../jwt";
import { requireMember, requireApprovedMember } from "../memberAuth";
import { requireAuth } from "../auth";

const router = Router();

// POST /api/members/register
router.post("/register", async (req, res) => {
  const parsed = insertMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const existing = await storage.getMemberByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  const member = await storage.createMember({
    ...parsed.data,
    password: hashedPassword,
  });

  const tokenPayload = { memberId: member.id, email: member.email, role: member.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.status(201).json({
    member: { ...member, password: undefined },
    accessToken,
    refreshToken,
  });
});

// POST /api/members/login
router.post("/login", async (req, res) => {
  const parsed = loginMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const member = await storage.getMemberByEmail(parsed.data.email);
  if (!member) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(parsed.data.password, member.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const tokenPayload = { memberId: member.id, email: member.email, role: member.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.json({
    member: { ...member, password: undefined },
    accessToken,
    refreshToken,
  });
});

// POST /api/members/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const payload = verifyToken(refreshToken);
    const member = await storage.getMember(payload.memberId);
    if (!member) {
      return res.status(401).json({ message: "Member not found" });
    }

    const tokenPayload = { memberId: member.id, email: member.email, role: member.role };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

// POST /api/members/auth-code — generate a one-time code for browser login
router.post("/auth-code", requireMember, async (req, res) => {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

  await storage.createAuthCode(req.member!.memberId, code, expiresAt);
  res.json({ code });
});

// POST /api/members/exchange-code — exchange a one-time code for JWT tokens
router.post("/exchange-code", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Code is required" });
  }

  const authCode = await storage.getAuthCodeByCode(code);
  if (!authCode) {
    return res.status(401).json({ message: "Invalid code" });
  }
  if (authCode.usedAt) {
    return res.status(401).json({ message: "Code already used" });
  }
  if (new Date() > authCode.expiresAt) {
    return res.status(401).json({ message: "Code expired" });
  }

  await storage.markAuthCodeUsed(authCode.id);

  const member = await storage.getMember(authCode.memberId);
  if (!member) {
    return res.status(401).json({ message: "Member not found" });
  }

  const tokenPayload = { memberId: member.id, email: member.email, role: member.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.json({
    member: { ...member, password: undefined },
    accessToken,
    refreshToken,
  });
});

// GET /api/members/me
router.get("/me", requireMember, async (req, res) => {
  const member = await storage.getMember(req.member!.memberId);
  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }
  res.json({ ...member, password: undefined });
});

// PATCH /api/members/me
router.patch("/me", requireMember, async (req, res) => {
  const { firstName, lastName, phone, photoUrl, hidePhone, hideEmail } = req.body;
  const updates: Record<string, unknown> = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (photoUrl !== undefined) updates.photoUrl = photoUrl;
  if (hidePhone !== undefined) updates.hidePhone = hidePhone;
  if (hideEmail !== undefined) updates.hideEmail = hideEmail;

  const member = await storage.updateMember(req.member!.memberId, updates);
  res.json({ ...member, password: undefined });
});

// GET /api/members/directory
router.get("/directory", requireApprovedMember, async (_req, res) => {
  const allMembers = await storage.getMembers();
  const filtered = allMembers.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.hidePhone ? null : m.phone,
    email: m.hideEmail ? null : m.email,
    photoUrl: m.photoUrl,
    role: m.role,
    title: m.title,
  }));
  res.json(filtered);
});

// GET /api/members/me/groups
router.get("/me/groups", requireMember, async (req, res) => {
  const groups = await storage.getMemberGroups(req.member!.memberId);
  res.json(groups);
});

// ========== Admin member management ==========

// GET /api/admin/members/pending
router.get("/admin/pending", requireAuth, async (_req, res) => {
  const pending = await storage.getPendingMembers();
  res.json(pending.map((m) => ({ ...m, password: undefined })));
});

// PATCH /api/admin/members/:id/approve
router.patch("/admin/:id/approve", requireAuth, async (req, res) => {
  const member = await storage.approveMember(req.params.id as string);

  // Auto-add to default group
  try {
    const defaultGroup = await storage.getDefaultGroup();
    if (defaultGroup) {
      const alreadyMember = await storage.isGroupMember(defaultGroup.id, member.id);
      if (!alreadyMember) {
        await storage.addGroupMember(defaultGroup.id, member.id);
      }
    }
  } catch (err) {
    console.error("Failed to add member to default group:", err);
  }

  res.json({ ...member, password: undefined });
});

// PATCH /api/admin/members/:id/reject
router.patch("/admin/:id/reject", requireAuth, async (req, res) => {
  const member = await storage.rejectMember(req.params.id as string);
  res.json({ ...member, password: undefined });
});

// GET /api/members/admin/all — all approved members with role, title, group admin assignments
router.get("/admin/all", requireAuth, async (_req, res) => {
  const allMembers = await storage.getMembers();
  const result = [];
  for (const m of allMembers) {
    const groupAdminIds = await storage.getMemberGroupAdminIds(m.id);
    result.push({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      photoUrl: m.photoUrl,
      role: m.role,
      title: m.title,
      groupAdminIds,
    });
  }
  res.json(result);
});

// PATCH /api/members/admin/:id/role — update role, title, group admin assignments
router.patch("/admin/:id/role", requireAuth, async (req, res) => {
  const { role, title, groupAdminIds } = req.body;
  const memberId = req.params.id as string;

  const member = await storage.getMember(memberId);
  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) {
    if (!["admin", "group_admin", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    updates.role = role;
  }
  if (title !== undefined) {
    updates.title = title || null;
  }

  if (Object.keys(updates).length > 0) {
    await storage.updateMember(memberId, updates);
  }

  // Handle group admin assignments
  if (Array.isArray(groupAdminIds)) {
    // Get all groups the member belongs to
    const memberGroups = await storage.getMemberGroups(memberId);
    const memberGroupIds = new Set(memberGroups.map(g => g.id));

    // For each group admin assignment, ensure membership and set role
    for (const groupId of groupAdminIds) {
      if (!memberGroupIds.has(groupId)) {
        await storage.addGroupMember(groupId, memberId);
      }
      await storage.setGroupMemberRole(groupId, memberId, "admin");
    }

    // Reset role to "member" for groups not in groupAdminIds
    const memberGroupIdArray = Array.from(memberGroupIds);
    for (const groupId of memberGroupIdArray) {
      if (!groupAdminIds.includes(groupId)) {
        await storage.setGroupMemberRole(groupId, memberId, "member");
      }
    }
  }

  const updated = await storage.getMember(memberId);
  const updatedGroupAdminIds = await storage.getMemberGroupAdminIds(memberId);
  res.json({ ...updated, password: undefined, groupAdminIds: updatedGroupAdminIds });
});

export default router;
