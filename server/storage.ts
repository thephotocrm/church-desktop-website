import {
  type User, type InsertUser,
  type Contact, type InsertContact,
  type Event, type InsertEvent,
  type Leader, type InsertLeader,
  type Ministry, type InsertMinistry,
  type StreamConfig, type InsertStreamConfig,
  type Member, type InsertMember,
  type Group, type InsertGroup, type GroupMember,
  type Message, type InsertMessage,
  type PrayerRequest, type InsertPrayerRequest,
  type FundCategory, type InsertFundCategory,
  type Donation, type InsertDonation,
  type PlatformConfig, type InsertPlatformConfig,
  type YoutubeStreamCache, type InsertYoutubeStreamCache,
  type RestreamStatus, type InsertRestreamStatus,
  users, contactSubmissions, events, leaders, ministries, streamConfig,
  members, groups, groupMembers, messages, prayerRequests, fundCategories, donations,
  platformConfig, youtubeStreamCache, restreamStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and, gte, lt, desc, sql } from "drizzle-orm";

export interface PrayerRequestFilter {
  since?: string;
  groupId?: string;
  status?: string;
  isPublic?: boolean;
  memberId?: string;
  limit?: number;
  offset?: number;
}

export interface IStorage {
  // Users (admin)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Leaders
  getLeaders(): Promise<Leader[]>;
  createLeader(leader: InsertLeader): Promise<Leader>;

  // Ministries
  getMinistries(): Promise<Ministry[]>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;

  // Stream Config
  getStreamConfig(): Promise<StreamConfig | undefined>;
  updateStreamConfig(config: Partial<InsertStreamConfig>): Promise<StreamConfig>;

  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember & { role?: string; status?: string }): Promise<Member>;
  updateMember(id: string, data: Partial<Member>): Promise<Member>;
  getMembers(): Promise<Member[]>;
  getPendingMembers(): Promise<Member[]>;
  approveMember(id: string): Promise<Member>;
  rejectMember(id: string): Promise<Member>;

  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<(GroupMember & { member?: Member })[]>;
  addGroupMember(groupId: string, memberId: string): Promise<GroupMember>;
  removeGroupMember(groupId: string, memberId: string): Promise<void>;
  getMemberGroups(memberId: string): Promise<Group[]>;
  isGroupMember(groupId: string, memberId: string): Promise<boolean>;
  getDefaultGroup(): Promise<Group | undefined>;

  // Messages
  getMessages(groupId: string, limit?: number, before?: string): Promise<(Message & { sender?: { id: string; firstName: string; lastName: string; photoUrl: string | null } })[]>;
  createMessage(message: InsertMessage): Promise<Message & { sender?: { id: string; firstName: string; lastName: string; photoUrl: string | null } }>;

  // Prayer Requests
  getPrayerRequests(filter: PrayerRequestFilter): Promise<PrayerRequest[]>;
  getPrayerRequest(id: string): Promise<PrayerRequest | undefined>;
  createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: string, data: Partial<InsertPrayerRequest>): Promise<PrayerRequest>;
  deletePrayerRequest(id: string): Promise<void>;
  incrementPrayerCount(id: string): Promise<PrayerRequest>;

  // Fund Categories
  getFundCategories(activeOnly?: boolean): Promise<FundCategory[]>;
  getFundCategory(id: string): Promise<FundCategory | undefined>;
  createFundCategory(category: InsertFundCategory): Promise<FundCategory>;
  updateFundCategory(id: string, data: Partial<InsertFundCategory>): Promise<FundCategory>;

  // Donations
  getDonations(): Promise<Donation[]>;
  getDonation(id: string): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, data: Partial<Donation>): Promise<Donation>;
  getDonationByStripePaymentIntent(paymentIntentId: string): Promise<Donation | undefined>;
  getDonationByStripeSubscription(subscriptionId: string): Promise<Donation | undefined>;
  getDonationByStripeCheckoutSession(sessionId: string): Promise<Donation | undefined>;
  getMemberDonationHistory(memberId: string): Promise<Donation[]>;

  // Platform Config
  getPlatformConfigs(): Promise<PlatformConfig[]>;
  getPlatformConfig(platform: string): Promise<PlatformConfig | undefined>;
  upsertPlatformConfig(platform: string, data: Partial<InsertPlatformConfig>): Promise<PlatformConfig>;

  // YouTube Stream Cache
  getCachedStreams(limit?: number): Promise<YoutubeStreamCache[]>;
  getCachedStream(videoId: string): Promise<YoutubeStreamCache | undefined>;
  upsertStreamCache(data: InsertYoutubeStreamCache): Promise<YoutubeStreamCache>;
  getStreamCacheAge(): Promise<number | null>; // ms since last cache

  // Restream Status
  getRestreamStatuses(): Promise<RestreamStatus[]>;
  getRestreamStatus(platform: string): Promise<RestreamStatus | undefined>;
  upsertRestreamStatus(platform: string, data: Partial<InsertRestreamStatus>): Promise<RestreamStatus>;
}

export class DatabaseStorage implements IStorage {
  // ========== Users ==========
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ========== Contacts ==========
  async createContact(contact: InsertContact): Promise<Contact> {
    const [result] = await db.insert(contactSubmissions).values(contact).returning();
    return result;
  }

  // ========== Events ==========
  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }

  // ========== Leaders ==========
  async getLeaders(): Promise<Leader[]> {
    return db.select().from(leaders).orderBy(asc(leaders.orderIndex));
  }

  async createLeader(leader: InsertLeader): Promise<Leader> {
    const [result] = await db.insert(leaders).values(leader).returning();
    return result;
  }

  // ========== Ministries ==========
  async getMinistries(): Promise<Ministry[]> {
    return db.select().from(ministries);
  }

  async createMinistry(ministry: InsertMinistry): Promise<Ministry> {
    const [result] = await db.insert(ministries).values(ministry).returning();
    return result;
  }

  // ========== Stream Config ==========
  async getStreamConfig(): Promise<StreamConfig | undefined> {
    const [config] = await db.select().from(streamConfig).limit(1);
    return config;
  }

  async updateStreamConfig(config: Partial<InsertStreamConfig>): Promise<StreamConfig> {
    const existing = await this.getStreamConfig();
    if (existing) {
      const [updated] = await db
        .update(streamConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(streamConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(streamConfig)
      .values({ ...config, updatedAt: new Date() })
      .returning();
    return created;
  }

  // ========== Members ==========
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member;
  }

  async createMember(member: InsertMember & { role?: string; status?: string }): Promise<Member> {
    const [result] = await db.insert(members).values(member).returning();
    return result;
  }

  async updateMember(id: string, data: Partial<Member>): Promise<Member> {
    const [result] = await db.update(members).set({ ...data, updatedAt: new Date() }).where(eq(members.id, id)).returning();
    return result;
  }

  async getMembers(): Promise<Member[]> {
    return db.select().from(members).where(eq(members.status, "approved")).orderBy(asc(members.firstName));
  }

  async getPendingMembers(): Promise<Member[]> {
    return db.select().from(members).where(eq(members.status, "pending")).orderBy(desc(members.createdAt));
  }

  async approveMember(id: string): Promise<Member> {
    const [result] = await db.update(members)
      .set({ status: "approved", role: "member", updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return result;
  }

  async rejectMember(id: string): Promise<Member> {
    const [result] = await db.update(members)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return result;
  }

  // ========== Groups ==========
  async getGroups(): Promise<Group[]> {
    return db.select().from(groups).orderBy(asc(groups.name));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [result] = await db.insert(groups).values(group).returning();
    return result;
  }

  async updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group> {
    const [result] = await db.update(groups).set(data).where(eq(groups.id, id)).returning();
    return result;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getGroupMembers(groupId: string): Promise<(GroupMember & { member?: Member })[]> {
    const rows = await db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(asc(groupMembers.joinedAt));

    const result = [];
    for (const row of rows) {
      const [member] = await db.select().from(members).where(eq(members.id, row.memberId));
      result.push({ ...row, member });
    }
    return result;
  }

  async addGroupMember(groupId: string, memberId: string): Promise<GroupMember> {
    const [result] = await db.insert(groupMembers).values({ groupId, memberId }).returning();
    return result;
  }

  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    await db.delete(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId))
    );
  }

  async getMemberGroups(memberId: string): Promise<Group[]> {
    const gms = await db.select().from(groupMembers).where(eq(groupMembers.memberId, memberId));
    if (gms.length === 0) return [];
    const result: Group[] = [];
    for (const gm of gms) {
      const [group] = await db.select().from(groups).where(eq(groups.id, gm.groupId));
      if (group) result.push(group);
    }
    return result;
  }

  async isGroupMember(groupId: string, memberId: string): Promise<boolean> {
    const [row] = await db.select().from(groupMembers).where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId))
    );
    return !!row;
  }

  async getDefaultGroup(): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.isDefault, true));
    return group;
  }

  // ========== Messages ==========
  async getMessages(groupId: string, limit = 50, before?: string): Promise<(Message & { sender?: { id: string; firstName: string; lastName: string; photoUrl: string | null } })[]> {
    const conditions = [eq(messages.groupId, groupId)];
    if (before) {
      const [ref] = await db.select({ createdAt: messages.createdAt }).from(messages).where(eq(messages.id, before));
      if (ref?.createdAt) {
        conditions.push(lt(messages.createdAt, ref.createdAt));
      }
    }

    const rows = await db.select().from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const result = [];
    for (const row of rows) {
      const [member] = await db.select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        photoUrl: members.photoUrl,
      }).from(members).where(eq(members.id, row.memberId));
      result.push({ ...row, sender: member || undefined });
    }
    return result.reverse();
  }

  async createMessage(message: InsertMessage): Promise<Message & { sender?: { id: string; firstName: string; lastName: string; photoUrl: string | null } }> {
    const [row] = await db.insert(messages).values(message).returning();
    const [member] = await db.select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      photoUrl: members.photoUrl,
    }).from(members).where(eq(members.id, row.memberId));
    return { ...row, sender: member || undefined };
  }

  // ========== Prayer Requests ==========
  async getPrayerRequests(filter: PrayerRequestFilter): Promise<PrayerRequest[]> {
    const conditions = [];

    if (filter.since) {
      let sinceDate: Date;
      const match = filter.since.match(/^(\d+)d$/);
      if (match) {
        sinceDate = new Date(Date.now() - parseInt(match[1]) * 24 * 60 * 60 * 1000);
      } else {
        sinceDate = new Date(filter.since);
      }
      if (!isNaN(sinceDate.getTime())) {
        conditions.push(gte(prayerRequests.createdAt, sinceDate));
      }
    }

    if (filter.groupId) {
      conditions.push(eq(prayerRequests.groupId, filter.groupId));
    }

    if (filter.status) {
      conditions.push(eq(prayerRequests.status, filter.status));
    }

    if (filter.isPublic !== undefined) {
      conditions.push(eq(prayerRequests.isPublic, filter.isPublic));
    }

    if (filter.memberId) {
      conditions.push(eq(prayerRequests.memberId, filter.memberId));
    }

    let query = db.select().from(prayerRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(prayerRequests.createdAt));

    if (filter.limit) {
      query = query.limit(filter.limit) as typeof query;
    }

    if (filter.offset) {
      query = query.offset(filter.offset) as typeof query;
    }

    return query;
  }

  async getPrayerRequest(id: string): Promise<PrayerRequest | undefined> {
    const [result] = await db.select().from(prayerRequests).where(eq(prayerRequests.id, id));
    return result;
  }

  async createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest> {
    const [result] = await db.insert(prayerRequests).values(request).returning();
    return result;
  }

  async updatePrayerRequest(id: string, data: Partial<InsertPrayerRequest>): Promise<PrayerRequest> {
    const [result] = await db.update(prayerRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prayerRequests.id, id))
      .returning();
    return result;
  }

  async deletePrayerRequest(id: string): Promise<void> {
    await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
  }

  async incrementPrayerCount(id: string): Promise<PrayerRequest> {
    const [result] = await db.update(prayerRequests)
      .set({ prayerCount: sql`${prayerRequests.prayerCount} + 1` })
      .where(eq(prayerRequests.id, id))
      .returning();
    return result;
  }

  // ========== Fund Categories ==========
  async getFundCategories(activeOnly = true): Promise<FundCategory[]> {
    if (activeOnly) {
      return db.select().from(fundCategories)
        .where(eq(fundCategories.isActive, true))
        .orderBy(asc(fundCategories.orderIndex));
    }
    return db.select().from(fundCategories).orderBy(asc(fundCategories.orderIndex));
  }

  async getFundCategory(id: string): Promise<FundCategory | undefined> {
    const [result] = await db.select().from(fundCategories).where(eq(fundCategories.id, id));
    return result;
  }

  async createFundCategory(category: InsertFundCategory): Promise<FundCategory> {
    const [result] = await db.insert(fundCategories).values(category).returning();
    return result;
  }

  async updateFundCategory(id: string, data: Partial<InsertFundCategory>): Promise<FundCategory> {
    const [result] = await db.update(fundCategories).set(data).where(eq(fundCategories.id, id)).returning();
    return result;
  }

  // ========== Donations ==========
  async getDonations(): Promise<Donation[]> {
    return db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonation(id: string): Promise<Donation | undefined> {
    const [result] = await db.select().from(donations).where(eq(donations.id, id));
    return result;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [result] = await db.insert(donations).values(donation).returning();
    return result;
  }

  async updateDonation(id: string, data: Partial<Donation>): Promise<Donation> {
    const [result] = await db.update(donations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();
    return result;
  }

  async getDonationByStripePaymentIntent(paymentIntentId: string): Promise<Donation | undefined> {
    const [result] = await db.select().from(donations)
      .where(eq(donations.stripePaymentIntentId, paymentIntentId));
    return result;
  }

  async getDonationByStripeSubscription(subscriptionId: string): Promise<Donation | undefined> {
    const [result] = await db.select().from(donations)
      .where(eq(donations.stripeSubscriptionId, subscriptionId));
    return result;
  }

  async getDonationByStripeCheckoutSession(sessionId: string): Promise<Donation | undefined> {
    const [result] = await db.select().from(donations)
      .where(eq(donations.stripeCheckoutSessionId, sessionId));
    return result;
  }

  async getMemberDonationHistory(memberId: string): Promise<Donation[]> {
    return db.select().from(donations)
      .where(eq(donations.memberId, memberId))
      .orderBy(desc(donations.createdAt));
  }

  // ========== Platform Config ==========
  async getPlatformConfigs(): Promise<PlatformConfig[]> {
    return db.select().from(platformConfig);
  }

  async getPlatformConfig(platform: string): Promise<PlatformConfig | undefined> {
    const [config] = await db.select().from(platformConfig).where(eq(platformConfig.platform, platform));
    return config;
  }

  async upsertPlatformConfig(platform: string, data: Partial<InsertPlatformConfig>): Promise<PlatformConfig> {
    const existing = await this.getPlatformConfig(platform);
    if (existing) {
      const [updated] = await db.update(platformConfig)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(platformConfig.platform, platform))
        .returning();
      return updated;
    }
    const [created] = await db.insert(platformConfig)
      .values({ ...data, platform, updatedAt: new Date() })
      .returning();
    return created;
  }

  // ========== YouTube Stream Cache ==========
  async getCachedStreams(limit = 50): Promise<YoutubeStreamCache[]> {
    return db.select().from(youtubeStreamCache)
      .orderBy(desc(youtubeStreamCache.publishedAt))
      .limit(limit);
  }

  async getCachedStream(videoId: string): Promise<YoutubeStreamCache | undefined> {
    const [stream] = await db.select().from(youtubeStreamCache)
      .where(eq(youtubeStreamCache.videoId, videoId));
    return stream;
  }

  async upsertStreamCache(data: InsertYoutubeStreamCache): Promise<YoutubeStreamCache> {
    const existing = await this.getCachedStream(data.videoId);
    if (existing) {
      const [updated] = await db.update(youtubeStreamCache)
        .set({ ...data, cachedAt: new Date() })
        .where(eq(youtubeStreamCache.videoId, data.videoId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(youtubeStreamCache)
      .values({ ...data, cachedAt: new Date() })
      .returning();
    return created;
  }

  async getStreamCacheAge(): Promise<number | null> {
    const [row] = await db.select({ cachedAt: youtubeStreamCache.cachedAt })
      .from(youtubeStreamCache)
      .orderBy(desc(youtubeStreamCache.cachedAt))
      .limit(1);
    if (!row?.cachedAt) return null;
    return Date.now() - row.cachedAt.getTime();
  }

  // ========== Restream Status ==========
  async getRestreamStatuses(): Promise<RestreamStatus[]> {
    return db.select().from(restreamStatus);
  }

  async getRestreamStatus(platform: string): Promise<RestreamStatus | undefined> {
    const [status] = await db.select().from(restreamStatus)
      .where(eq(restreamStatus.platform, platform));
    return status;
  }

  async upsertRestreamStatus(platform: string, data: Partial<InsertRestreamStatus>): Promise<RestreamStatus> {
    const existing = await this.getRestreamStatus(platform);
    if (existing) {
      const [updated] = await db.update(restreamStatus)
        .set(data)
        .where(eq(restreamStatus.platform, platform))
        .returning();
      return updated;
    }
    const [created] = await db.insert(restreamStatus)
      .values({ ...data, platform })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
