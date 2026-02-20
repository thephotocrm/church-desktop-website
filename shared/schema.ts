import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  prayerRequest: boolean("prayer_request").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
});

export const leaders = pgTable("leaders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url"),
  orderIndex: integer("order_index").default(0),
});

export const ministries = pgTable("ministries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  leader: text("leader"),
});

export const streamConfig = pgTable("stream_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isLive: boolean("is_live").notNull().default(false),
  title: text("title").notNull().default("Sunday Worship Service"),
  description: text("description"),
  hlsUrl: text("hls_url"),
  thumbnailUrl: text("thumbnail_url"),
  startedAt: timestamp("started_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export const insertLeaderSchema = createInsertSchema(leaders).omit({
  id: true,
});

export const insertMinistrySchema = createInsertSchema(ministries).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactSubmissions.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertLeader = z.infer<typeof insertLeaderSchema>;
export type Leader = typeof leaders.$inferSelect;
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type Ministry = typeof ministries.$inferSelect;

export const insertStreamConfigSchema = createInsertSchema(streamConfig).omit({
  id: true,
  updatedAt: true,
});
export const updateStreamConfigSchema = insertStreamConfigSchema.partial();
export type InsertStreamConfig = z.infer<typeof insertStreamConfigSchema>;
export type StreamConfig = typeof streamConfig.$inferSelect;

// ===================== Members =====================

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("guest"), // admin | member | guest
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  hidePhone: boolean("hide_phone").default(false),
  hideEmail: boolean("hide_email").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  role: true,
  status: true,
});

export const loginMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// ===================== Groups =====================

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("chat"), // "chat" | "announcement"
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  uniqueIndex("group_member_unique").on(table.groupId, table.memberId),
]);

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  isDefault: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;

// ===================== Messages =====================

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ===================== Prayer Requests =====================

export const prayerRequests = pgTable("prayer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  isAnonymous: boolean("is_anonymous").default(false),
  title: text("title").notNull(),
  body: text("body").notNull(),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").default(true),
  prayerCount: integer("prayer_count").default(0),
  status: text("status").notNull().default("active"), // active | answered | archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  prayerCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type PrayerRequest = typeof prayerRequests.$inferSelect;

// ===================== Fund Categories =====================

export const fundCategories = pgTable("fund_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  stripeProductId: text("stripe_product_id"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
});

export const insertFundCategorySchema = createInsertSchema(fundCategories).omit({
  id: true,
  stripeProductId: true,
});

export type InsertFundCategory = z.infer<typeof insertFundCategorySchema>;
export type FundCategory = typeof fundCategories.$inferSelect;

// ===================== Donations =====================

export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id, { onDelete: "set null" }),
  fundCategoryId: varchar("fund_category_id").references(() => fundCategories.id),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  type: text("type").notNull().default("one_time"), // one_time | recurring
  frequency: text("frequency"), // weekly | monthly | null
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  status: text("status").notNull().default("pending"), // pending | succeeded | failed | refunded
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

// ===================== Platform Config (Restreaming) =====================

export const platformConfig = pgTable("platform_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(), // "youtube" | "facebook"
  enabled: boolean("enabled").notNull().default(false),
  streamKey: text("stream_key"), // encrypted
  rtmpUrl: text("rtmp_url"), // base RTMP endpoint
  channelId: text("channel_id"), // YouTube channel ID
  apiKey: text("api_key"), // YouTube Data API key, encrypted
  channelUrl: text("channel_url"), // public channel URL
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfig).omit({
  id: true,
  updatedAt: true,
});
export const updatePlatformConfigSchema = insertPlatformConfigSchema.partial();
export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfig.$inferSelect;

// ===================== YouTube Stream Cache =====================

export const youtubeStreamCache = pgTable("youtube_stream_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at"),
  duration: text("duration"), // ISO 8601 duration
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export const insertYoutubeStreamCacheSchema = createInsertSchema(youtubeStreamCache).omit({
  id: true,
});
export type InsertYoutubeStreamCache = z.infer<typeof insertYoutubeStreamCacheSchema>;
export type YoutubeStreamCache = typeof youtubeStreamCache.$inferSelect;

// ===================== Restream Status =====================

export const restreamStatus = pgTable("restream_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(), // "youtube" | "facebook"
  status: text("status").notNull().default("idle"), // "idle" | "active" | "error"
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  stoppedAt: timestamp("stopped_at"),
});

export const insertRestreamStatusSchema = createInsertSchema(restreamStatus).omit({
  id: true,
});
export type InsertRestreamStatus = z.infer<typeof insertRestreamStatusSchema>;
export type RestreamStatus = typeof restreamStatus.$inferSelect;
