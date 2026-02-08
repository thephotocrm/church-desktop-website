import {
  type User, type InsertUser,
  type Contact, type InsertContact,
  type Event, type InsertEvent,
  type Leader, type InsertLeader,
  type Ministry, type InsertMinistry,
  users, contactSubmissions, events, leaders, ministries,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContact(contact: InsertContact): Promise<Contact>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getLeaders(): Promise<Leader[]>;
  createLeader(leader: InsertLeader): Promise<Leader>;
  getMinistries(): Promise<Ministry[]>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;
}

export class DatabaseStorage implements IStorage {
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

  async createContact(contact: InsertContact): Promise<Contact> {
    const [result] = await db.insert(contactSubmissions).values(contact).returning();
    return result;
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }

  async getLeaders(): Promise<Leader[]> {
    return db.select().from(leaders).orderBy(asc(leaders.orderIndex));
  }

  async createLeader(leader: InsertLeader): Promise<Leader> {
    const [result] = await db.insert(leaders).values(leader).returning();
    return result;
  }

  async getMinistries(): Promise<Ministry[]> {
    return db.select().from(ministries);
  }

  async createMinistry(ministry: InsertMinistry): Promise<Ministry> {
    const [result] = await db.insert(ministries).values(ministry).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
