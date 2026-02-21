import { Router } from "express";
import { storage } from "../storage";
import { requireApprovedMember, optionalMember } from "../memberAuth";
import { requireAuth } from "../auth";
import { broadcastToGroup } from "../websocket";

const router = Router();

// ========== Public endpoints ==========

// GET /api/events — filtered listing (public, only published events)
router.get("/", async (req, res) => {
  const { startDate, endDate, category, featured, limit, offset } = req.query;
  const events = await storage.getEvents({
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    category: category as string | undefined,
    status: "published",
    featured: featured === "true" ? true : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });
  res.json(events);
});

// GET /api/events/my-events — events from groups the member belongs to
// (must be before /:id to avoid route conflict)
router.get("/my-events", requireApprovedMember, async (req, res) => {
  const { startDate, endDate, category } = req.query;
  const events = await storage.getMemberEvents(req.member!.memberId, {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    category: category as string | undefined,
  });
  res.json(events);
});

// GET /api/events/group/:groupId — events for a specific group
router.get("/group/:groupId", requireApprovedMember, async (req, res) => {
  const { startDate, endDate, category } = req.query;
  const events = await storage.getGroupEvents((req.params.groupId as string), {
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    category: category as string | undefined,
    status: "published",
  });
  res.json(events);
});

// ========== Admin endpoints ==========

// GET /api/events/admin/all — all events including drafts/cancelled
router.get("/admin/all", requireAuth, async (req, res) => {
  const events = await storage.getEvents();

  // Enrich with group associations and RSVP counts
  const enriched = await Promise.all(events.map(async (event) => {
    const groups = await storage.getEventGroups(event.id);
    const rsvpCount = await storage.getEventRsvpCount(event.id);
    return { ...event, groups, rsvpCount };
  }));

  res.json(enriched);
});

// POST /api/events/admin — create event
router.post("/admin", requireAuth, async (req, res) => {
  const { groupIds, ...eventData } = req.body;

  // Convert date strings to Date objects
  if (eventData.startDate && typeof eventData.startDate === "string") {
    eventData.startDate = new Date(eventData.startDate);
  }
  if (eventData.endDate && typeof eventData.endDate === "string") {
    eventData.endDate = new Date(eventData.endDate);
  }
  if (eventData.recurrenceEndDate && typeof eventData.recurrenceEndDate === "string") {
    eventData.recurrenceEndDate = new Date(eventData.recurrenceEndDate);
  }

  const event = await storage.createEvent(eventData);

  // Set group associations
  if (Array.isArray(groupIds) && groupIds.length > 0) {
    await storage.setEventGroups(event.id, groupIds);

    // Broadcast to associated groups
    for (const groupId of groupIds) {
      broadcastToGroup(groupId, {
        type: "new_event",
        event: { id: event.id, title: event.title, startDate: event.startDate, location: event.location },
      });
    }
  }

  const groups = await storage.getEventGroups(event.id);
  res.status(201).json({ ...event, groups });
});

// PATCH /api/events/admin/:id — update event
router.patch("/admin/:id", requireAuth, async (req, res) => {
  const existing = await storage.getEvent((req.params.id as string));
  if (!existing) {
    return res.status(404).json({ message: "Event not found" });
  }

  const { groupIds, ...updateData } = req.body;

  // Convert date strings to Date objects
  if (updateData.startDate && typeof updateData.startDate === "string") {
    updateData.startDate = new Date(updateData.startDate);
  }
  if (updateData.endDate && typeof updateData.endDate === "string") {
    updateData.endDate = new Date(updateData.endDate);
  }
  if (updateData.recurrenceEndDate && typeof updateData.recurrenceEndDate === "string") {
    updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
  }

  const event = await storage.updateEvent((req.params.id as string), updateData);

  // Update group associations if provided
  if (Array.isArray(groupIds)) {
    const oldGroups = await storage.getEventGroups(event.id);
    await storage.setEventGroups(event.id, groupIds);

    // Broadcast to newly associated groups
    const oldGroupIds = new Set(oldGroups.map(g => g.id));
    for (const groupId of groupIds) {
      if (!oldGroupIds.has(groupId)) {
        broadcastToGroup(groupId, {
          type: "new_event",
          event: { id: event.id, title: event.title, startDate: event.startDate, location: event.location },
        });
      }
    }
  }

  const groups = await storage.getEventGroups(event.id);
  const rsvpCount = await storage.getEventRsvpCount(event.id);
  res.json({ ...event, groups, rsvpCount });
});

// DELETE /api/events/admin/:id — delete event
router.delete("/admin/:id", requireAuth, async (req, res) => {
  const existing = await storage.getEvent((req.params.id as string));
  if (!existing) {
    return res.status(404).json({ message: "Event not found" });
  }
  await storage.deleteEvent((req.params.id as string));
  res.json({ message: "Event deleted" });
});

// PUT /api/events/admin/:id/groups — set group associations
router.put("/admin/:id/groups", requireAuth, async (req, res) => {
  const existing = await storage.getEvent((req.params.id as string));
  if (!existing) {
    return res.status(404).json({ message: "Event not found" });
  }

  const { groupIds } = req.body;
  if (!Array.isArray(groupIds)) {
    return res.status(400).json({ message: "groupIds must be an array" });
  }

  await storage.setEventGroups((req.params.id as string), groupIds);
  const groups = await storage.getEventGroups((req.params.id as string));
  res.json({ groups });
});

// ========== Member endpoints ==========

// GET /api/events/:id — single event detail with RSVP count
router.get("/:id", optionalMember, async (req, res) => {
  const event = await storage.getEvent((req.params.id as string));
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  // Don't show non-published events to non-admin users
  if (event.status !== "published" && !req.isAuthenticated?.()) {
    return res.status(404).json({ message: "Event not found" });
  }

  const rsvpCount = await storage.getEventRsvpCount(event.id);
  const groups = await storage.getEventGroups(event.id);

  let myRsvp = undefined;
  if (req.member) {
    myRsvp = await storage.getMemberRsvp(event.id, req.member.memberId);
  }

  res.json({ ...event, rsvpCount, groups, myRsvp });
});

// POST /api/events/:id/rsvp — RSVP to an event
router.post("/:id/rsvp", requireApprovedMember, async (req, res) => {
  const event = await storage.getEvent((req.params.id as string));
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  const { status } = req.body;
  if (!["attending", "maybe", "declined"].includes(status)) {
    return res.status(400).json({ message: "Status must be attending, maybe, or declined" });
  }

  const rsvp = await storage.upsertEventRsvp(event.id, req.member!.memberId, status);
  res.json(rsvp);
});

// DELETE /api/events/:id/rsvp — cancel RSVP
router.delete("/:id/rsvp", requireApprovedMember, async (req, res) => {
  const event = await storage.getEvent((req.params.id as string));
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  await storage.deleteEventRsvp(event.id, req.member!.memberId);
  res.json({ message: "RSVP cancelled" });
});

// GET /api/events/:id/ical — download .ics file
router.get("/:id/ical", async (req, res) => {
  const event = await storage.getEvent((req.params.id as string));
  if (!event || event.status !== "published") {
    return res.status(404).json({ message: "Event not found" });
  }

  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const uid = `${event.id}@fpc-dallas`;
  const dtStart = formatICalDate(event.startDate);
  const dtEnd = event.endDate ? formatICalDate(event.endDate) : formatICalDate(new Date(event.startDate.getTime() + 60 * 60 * 1000));

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FPC Dallas//Events//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
    event.location ? `LOCATION:${event.location.replace(/,/g, "\\,")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`);
  res.send(ical);
});

export default router;
