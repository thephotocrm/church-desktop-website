# API Reference

> **Keep this file up to date.** Whenever an API endpoint is added, changed, or removed, update this document to match.

All endpoints are prefixed with `/api`. Authentication is one of:

| Auth label | Meaning |
|---|---|
| **Public** | No authentication required |
| **Optional member** | Member JWT accepted but not required |
| **Member JWT** | Requires valid member JWT (`Authorization: Bearer <token>`) |
| **Approved member** | Member JWT + member status must be `approved` |
| **Admin session** | Requires admin session cookie (passport) |

---

## Auth

Source: `server/auth.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login with username & password; returns admin user and sets session cookie |
| POST | `/api/auth/logout` | Admin session | Destroy current session |
| GET | `/api/auth/me` | Admin session | Return current authenticated admin user |

---

## Stream

Source: `server/routes.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stream/status` | Public | Auto-detected live/offline status, HLS URL, title, thumbnail |
| PATCH | `/api/stream/config` | Admin session | Update stream title, description, or thumbnail URL |
| GET | `/api/stream/hls/*` | Public | Reverse-proxy to MediaMTX HLS server (avoids mixed-content) |
| POST | `/api/stream/webhook` | Webhook secret | MediaMTX webhook — triggers restream start/stop on `ready`/`not_ready` events |

**`PATCH /api/stream/config`** request body (all optional):
```json
{ "title": "string", "description": "string", "thumbnailUrl": "string" }
```

---

## Events

Source: `server/routes/eventRoutes.ts` — mounted at `/api/events`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | Public | List published events (filterable) |
| GET | `/api/events/my-events` | Approved member | Events from groups the member belongs to |
| GET | `/api/events/group/:groupId` | Approved member | Published events for a specific group |
| GET | `/api/events/admin/all` | Admin session | All events (including drafts/cancelled) with group & RSVP data |
| POST | `/api/events/admin` | Admin session | Create a new event |
| PATCH | `/api/events/admin/:id` | Admin session | Update an event |
| DELETE | `/api/events/admin/:id` | Admin session | Delete an event |
| PUT | `/api/events/admin/:id/groups` | Admin session | Set group associations for an event |
| GET | `/api/events/:id` | Optional member | Single event detail with RSVP count and group info |
| POST | `/api/events/:id/rsvp` | Approved member | RSVP to an event (`attending`, `maybe`, `declined`) |
| DELETE | `/api/events/:id/rsvp` | Approved member | Cancel RSVP |
| GET | `/api/events/:id/ical` | Public | Download `.ics` calendar file for a published event |

**`GET /api/events`** query params: `startDate`, `endDate`, `category`, `featured`, `limit`, `offset`

**`POST /api/events/admin`** request body:
```json
{
  "title": "string", "description": "string", "startDate": "ISO8601",
  "endDate": "ISO8601", "location": "string", "category": "string",
  "status": "published|draft", "featured": true,
  "recurrencePattern": "string", "recurrenceEndDate": "ISO8601",
  "groupIds": ["uuid"]
}
```

---

## Members

Source: `server/routes/memberRoutes.ts` — mounted at `/api/members`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/members/register` | Public | Register a new member; returns member + JWT pair |
| POST | `/api/members/login` | Public | Login with email & password; returns member + JWT pair |
| POST | `/api/members/refresh` | Public | Exchange refresh token for new access + refresh tokens |
| GET | `/api/members/me` | Member JWT | Get current member profile |
| PATCH | `/api/members/me` | Member JWT | Update own profile (name, phone, photo, privacy flags) |
| GET | `/api/members/me/groups` | Member JWT | List groups the member belongs to |
| GET | `/api/members/directory` | Approved member | Member directory (respects privacy flags) |
| GET | `/api/members/admin/pending` | Admin session | List pending member registrations |
| PATCH | `/api/members/admin/:id/approve` | Admin session | Approve a member (auto-adds to default group) |
| PATCH | `/api/members/admin/:id/reject` | Admin session | Reject a member |
| GET | `/api/members/admin/all` | Admin session | All approved members with roles & group-admin assignments |
| PATCH | `/api/members/admin/:id/role` | Admin session | Update member role, title, and group-admin assignments |

**`POST /api/members/register`** request body:
```json
{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "phone": "string" }
```

**`PATCH /api/members/me`** request body (all optional):
```json
{ "firstName": "string", "lastName": "string", "phone": "string", "photoUrl": "string", "hidePhone": true, "hideEmail": true }
```

**`PATCH /api/members/admin/:id/role`** request body:
```json
{ "role": "admin|group_admin|member", "title": "string|null", "groupAdminIds": ["uuid"] }
```

---

## Groups

Source: `server/routes/groupRoutes.ts` — mounted at `/api/groups`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/groups` | Approved member | List all groups |
| POST | `/api/groups/:id/join` | Approved member | Join a group |
| DELETE | `/api/groups/:id/leave` | Approved member | Leave a group (cannot leave default group) |
| GET | `/api/groups/:id/members` | Approved member | List members of a group |
| GET | `/api/groups/:id/messages` | Approved member | Paginated message history (`?limit=&before=`) |
| POST | `/api/groups/:id/messages` | Approved member | Send a message (announcement groups: admin only) |
| GET | `/api/groups/admin` | Admin session | List all groups (admin view) |
| POST | `/api/groups/admin` | Admin session | Create a new group |
| PATCH | `/api/groups/admin/:id` | Admin session | Update group name/description |
| DELETE | `/api/groups/admin/:id` | Admin session | Delete a group (cannot delete default group) |

**`POST /api/groups/admin`** request body:
```json
{ "name": "string", "description": "string" }
```

---

## Prayer Requests

Source: `server/routes/prayerRoutes.ts` — mounted at `/api/prayer-requests`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/prayer-requests` | Optional member | List public active prayer requests |
| GET | `/api/prayer-requests/:id` | Optional member | Get a single prayer request |
| POST | `/api/prayer-requests` | Optional member | Submit a prayer request |
| PATCH | `/api/prayer-requests/:id` | Member JWT | Update own prayer request |
| DELETE | `/api/prayer-requests/:id` | Member JWT | Delete own prayer request |
| POST | `/api/prayer-requests/:id/pray` | Public | Increment prayer count |
| GET | `/api/prayer-requests/group/:groupId` | Approved member | Prayer requests for a specific group |
| GET | `/api/prayer-requests/admin/all` | Admin session | All prayer requests (filterable by status) |
| PATCH | `/api/prayer-requests/admin/:id` | Admin session | Update prayer request status (`active`, `answered`, `archived`) |

**`GET /api/prayer-requests`** query params: `since`, `status`, `limit`, `offset`

**`POST /api/prayer-requests`** request body:
```json
{ "title": "string", "body": "string", "isAnonymous": false, "isPublic": true, "groupId": "uuid|null", "authorName": "string (required if not logged in)" }
```

---

## Giving

Source: `server/routes/givingRoutes.ts` — mounted at `/api/giving`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/giving/config` | Public | Stripe publishable key |
| GET | `/api/giving/funds` | Public | List active fund categories |
| POST | `/api/giving/checkout-session` | Optional member | Create a Stripe Checkout session (one-time or recurring) |
| POST | `/api/giving/charge-saved` | Member JWT | Charge a saved payment method |
| GET | `/api/giving/payment-methods` | Member JWT | List saved payment methods (cards) |
| DELETE | `/api/giving/payment-methods/:id` | Member JWT | Remove a saved payment method |
| GET | `/api/giving/history` | Member JWT | Donation history for current member |
| POST | `/api/giving/webhook` | Stripe signature | Stripe webhook handler (checkout, payment intent, invoice events) |
| POST | `/api/giving/admin/funds` | Admin session | Create a fund category (+ Stripe Product) |
| PATCH | `/api/giving/admin/funds/:id` | Admin session | Update a fund category |
| GET | `/api/giving/admin/donations` | Admin session | List all donations |

**`POST /api/giving/checkout-session`** request body:
```json
{ "amountCents": 1000, "fundCategoryId": "uuid", "type": "one_time|recurring", "frequency": "weekly|monthly", "successUrl": "string", "cancelUrl": "string" }
```

**`POST /api/giving/charge-saved`** request body:
```json
{ "paymentMethodId": "string", "amountCents": 1000, "fundCategoryId": "uuid" }
```

---

## Platform (Admin)

Source: `server/routes/platformRoutes.ts` — mounted at `/api/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/platform-configs` | Admin session | Get platform configs (stream keys are masked) |
| PATCH | `/api/admin/platform-configs/:platform` | Admin session | Update platform config (`youtube` or `facebook`); encrypts keys |
| GET | `/api/admin/restream-status` | Admin session | Per-platform restream status |

**`PATCH /api/admin/platform-configs/:platform`** request body (all optional):
```json
{ "enabled": true, "streamKey": "string", "rtmpUrl": "string", "channelId": "string", "apiKey": "string", "channelUrl": "string" }
```

---

## YouTube

Source: `server/routes/youtubeRoutes.ts` — mounted at `/api/youtube`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/youtube/past-streams` | Public | Past live streams (cached 30 min, falls back to DB cache on API errors) |

**`GET /api/youtube/past-streams`** query params: `page` (YouTube page token), `limit` (max 50, default 12)

---

## General / Misc

Source: `server/routes.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaders` | Public | List all church leaders |
| GET | `/api/ministries` | Public | List all ministries |
| POST | `/api/contact` | Public | Submit a contact form |
| GET | `/api/social-links` | Public | YouTube & Facebook channel URLs |
| GET | `/api/config` | Public | Client config (Stripe publishable key) |
