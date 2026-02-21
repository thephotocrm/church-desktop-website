import { db } from "./db";
import { leaders, events, ministries, streamConfig, users, fundCategories, groups, groupMembers, members } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  // Ensure connect-pg-simple session table exists (createTableIfMissing breaks in bundled builds)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);

  const existingLeaders = await db.select().from(leaders);
  const existingEvents = await db.select().from(events);
  const existingMinistries = await db.select().from(ministries);

  if (existingLeaders.length === 0) {
  await db.insert(leaders).values([
    {
      name: "Pastor James Pacholek",
      title: "Senior Pastor",
      bio: "Pastor Pacholek has faithfully led First Pentecostal Church for over 15 years. His passion for preaching the uncompromising Word of God and his heart for the lost have been the driving force behind the church's growth. He holds a Master of Divinity and is a sought-after speaker at conferences across the nation.",
      imageUrl: "/images/pastor-main.png",
      orderIndex: 0,
    },
    {
      name: "Coming Soon",
      title: "Leadership Team",
      bio: "More information about our leadership team will be available soon.",
      imageUrl: "",
      orderIndex: 1,
    },
    {
      name: "Coming Soon",
      title: "Leadership Team",
      bio: "More information about our leadership team will be available soon.",
      imageUrl: "",
      orderIndex: 2,
    },
    {
      name: "Coming Soon",
      title: "Leadership Team",
      bio: "More information about our leadership team will be available soon.",
      imageUrl: "",
      orderIndex: 3,
    },
  ]);
  }

  if (existingEvents.length === 0) {
  await db.insert(events).values([
    {
      title: "Revival Week",
      description: "Join us for a powerful week of revival services featuring guest speakers, anointed worship, and corporate prayer. Come expecting miracles, healing, and a fresh outpouring of the Holy Spirit.",
      startDate: new Date("2026-03-10T19:00:00"),
      endDate: new Date("2026-03-14T21:00:00"),
      location: "Main Sanctuary",
      imageUrl: "/images/hero-worship.png",
      featured: true,
      category: "worship",
      status: "published",
    },
    {
      title: "Community Food Drive",
      description: "Help us serve our Dallas community by collecting and distributing food to families in need. Volunteers needed for sorting, packing, and delivery. Together we can make a difference.",
      startDate: new Date("2026-03-22T09:00:00"),
      endDate: new Date("2026-03-22T14:00:00"),
      location: "Church Fellowship Hall",
      imageUrl: "/images/community-outreach.png",
      featured: true,
      category: "outreach",
      status: "published",
    },
    {
      title: "Youth Night: Fire & Faith",
      description: "A special evening for our young people ages 13-25 with dynamic worship, relevant teaching, games, and fellowship. Bring a friend and experience God in a powerful way.",
      startDate: new Date("2026-03-28T18:30:00"),
      endDate: new Date("2026-03-28T21:00:00"),
      location: "Youth Center",
      imageUrl: "/images/youth-ministry.png",
      featured: true,
      category: "youth",
      status: "published",
    },
    {
      title: "Women's Prayer Breakfast",
      description: "Ladies, join us for a morning of prayer, fellowship, and an encouraging word from Lady Sarah Johnson. A continental breakfast will be provided.",
      startDate: new Date("2026-04-05T08:30:00"),
      endDate: new Date("2026-04-05T10:00:00"),
      location: "Fellowship Hall",
      featured: false,
      category: "prayer",
      status: "published",
    },
    {
      title: "Easter Celebration Service",
      description: "Celebrate the resurrection of our Lord Jesus Christ with a special Easter service featuring our choir, drama team, and an inspiring message of hope and new life.",
      startDate: new Date("2026-04-05T10:00:00"),
      endDate: new Date("2026-04-05T12:00:00"),
      location: "Main Sanctuary",
      imageUrl: "/images/cross-glow.png",
      featured: true,
      category: "worship",
      status: "published",
    },
    {
      title: "Men's Fellowship Gathering",
      description: "A time for the men of FPC Dallas to come together for fellowship, accountability, and spiritual growth. Guest speaker and dinner provided.",
      startDate: new Date("2026-04-12T18:00:00"),
      endDate: new Date("2026-04-12T20:00:00"),
      location: "Fellowship Hall",
      featured: false,
      category: "fellowship",
      status: "published",
    },
  ]);
  }

  if (existingMinistries.length === 0) {
  await db.insert(ministries).values([
    {
      name: "Worship & Music Ministry",
      description: "Our worship team leads the congregation into the presence of God through Spirit-filled praise and worship. Whether you sing, play an instrument, or run sound, there's a place for you.",
      imageUrl: "/images/hero-worship.png",
      leader: "Brother James Thompson",
    },
    {
      name: "Youth Ministry",
      description: "Empowering the next generation with the gospel of Jesus Christ through dynamic teaching, mentorship, and community. For ages 13-25 with weekly meetings and special events.",
      imageUrl: "/images/youth-ministry.png",
      leader: "Minister Marcus Williams",
    },
    {
      name: "Women of Virtue",
      description: "A ministry dedicated to building up women in faith, purpose, and community. Monthly meetings, Bible studies, retreats, and outreach opportunities for women of all ages.",
      imageUrl: "/images/community-outreach.png",
      leader: "Lady Sarah Johnson",
    },
    {
      name: "Community Outreach",
      description: "Serving the Dallas community through food drives, clothing distributions, neighborhood clean-ups, and partnerships with local organizations to meet real needs.",
      imageUrl: "/images/community-outreach.png",
      leader: "Deacon Robert Harris",
    },
    {
      name: "Children's Ministry",
      description: "A safe, fun, and faith-filled environment where children learn about God's love through interactive lessons, games, crafts, and worship designed just for them. Ages 3-12.",
      leader: "Sister Angela Davis",
    },
    {
      name: "Prayer Warriors",
      description: "A dedicated team of intercessors who pray for the church, community, and world. Weekly prayer meetings and 24-hour prayer chains for urgent needs. Open to all who have a heart for prayer.",
      imageUrl: "/images/bible-podium.png",
      leader: "Mother Grace Williams",
    },
  ]);
  }

  const existingStreamConfig = await db.select().from(streamConfig);
  if (existingStreamConfig.length === 0) {
    await db.insert(streamConfig).values({
      isLive: false,
      title: "Sunday Worship Service",
      description: "Join us for Spirit-filled worship and the Word of God.",
    });
  }

  // Seed default admin user
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
    });
    console.log("Default admin user created (admin / admin123)");
  }

  // Seed fund categories
  const existingFunds = await db.select().from(fundCategories);
  if (existingFunds.length === 0) {
    await db.insert(fundCategories).values([
      { name: "Tithes", description: "Honor the Lord with your tithes", orderIndex: 0, isActive: true },
      { name: "Offerings", description: "General offerings to support church operations", orderIndex: 1, isActive: true },
      { name: "Building Fund", description: "Help us expand and maintain our facilities", orderIndex: 2, isActive: true },
      { name: "Missions", description: "Support missionaries and gospel outreach worldwide", orderIndex: 3, isActive: true },
    ]);
    console.log("Fund categories seeded");
  }

  // Seed default "All Saints" announcement group
  const [existingDefault] = await db.select().from(groups).where(eq(groups.isDefault, true));
  if (!existingDefault) {
    const [allSaintsGroup] = await db.insert(groups).values({
      name: "All Saints",
      description: "Church-wide announcements for all members",
      type: "announcement",
      isDefault: true,
    }).returning();

    // Auto-add all currently approved members
    const approvedMembers = await db.select().from(members).where(eq(members.status, "approved"));
    for (const member of approvedMembers) {
      await db.insert(groupMembers).values({
        groupId: allSaintsGroup.id,
        memberId: member.id,
      }).onConflictDoNothing();
    }
    console.log(`Default "All Saints" group created with ${approvedMembers.length} members`);
  }

  console.log("Database seeded successfully!");
}
