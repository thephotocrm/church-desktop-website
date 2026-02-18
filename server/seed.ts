import { db } from "./db";
import { leaders, events, ministries, streamConfig } from "@shared/schema";

export async function seedDatabase() {
  const existingLeaders = await db.select().from(leaders);
  const existingEvents = await db.select().from(events);
  const existingMinistries = await db.select().from(ministries);

  if (existingLeaders.length > 0 && existingEvents.length > 0 && existingMinistries.length > 0) return;

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
      name: "Lady Sarah Johnson",
      title: "Co-Pastor & Women's Ministry",
      bio: "Lady Sarah serves alongside her husband with a special calling to minister to women and families. Her warmth, wisdom, and gift of hospitality make every person feel welcome. She leads the Women of Virtue ministry and oversees the church's hospitality team.",
      imageUrl: "/images/copastor.png",
      orderIndex: 1,
    },
    {
      name: "Minister Marcus Williams",
      title: "Youth Pastor",
      bio: "Minister Marcus brings energy and vision to the youth ministry at FPC Dallas. With a heart for the next generation, he creates innovative programs that engage young people with the gospel and equip them for a life of purpose and faith.",
      imageUrl: "/images/youth-pastor.png",
      orderIndex: 2,
    },
    {
      name: "Brother James Thompson",
      title: "Worship Leader",
      bio: "Brother James leads our worship team with excellence and anointing. A talented musician and songwriter, he creates an atmosphere where the congregation can freely worship and encounter the presence of God in every service.",
      imageUrl: "/images/worship-leader.png",
      orderIndex: 3,
    },
  ]);
  }

  if (existingEvents.length === 0) {
  await db.insert(events).values([
    {
      title: "Revival Week",
      description: "Join us for a powerful week of revival services featuring guest speakers, anointed worship, and corporate prayer. Come expecting miracles, healing, and a fresh outpouring of the Holy Spirit.",
      date: "March 10-14, 2026",
      time: "7:00 PM",
      location: "Main Sanctuary",
      imageUrl: "/images/hero-worship.png",
      featured: true,
    },
    {
      title: "Community Food Drive",
      description: "Help us serve our Dallas community by collecting and distributing food to families in need. Volunteers needed for sorting, packing, and delivery. Together we can make a difference.",
      date: "March 22, 2026",
      time: "9:00 AM",
      location: "Church Fellowship Hall",
      imageUrl: "/images/community-outreach.png",
      featured: true,
    },
    {
      title: "Youth Night: Fire & Faith",
      description: "A special evening for our young people ages 13-25 with dynamic worship, relevant teaching, games, and fellowship. Bring a friend and experience God in a powerful way.",
      date: "March 28, 2026",
      time: "6:30 PM",
      location: "Youth Center",
      imageUrl: "/images/youth-ministry.png",
      featured: true,
    },
    {
      title: "Women's Prayer Breakfast",
      description: "Ladies, join us for a morning of prayer, fellowship, and an encouraging word from Lady Sarah Johnson. A continental breakfast will be provided.",
      date: "April 5, 2026",
      time: "8:30 AM",
      location: "Fellowship Hall",
      featured: false,
    },
    {
      title: "Easter Celebration Service",
      description: "Celebrate the resurrection of our Lord Jesus Christ with a special Easter service featuring our choir, drama team, and an inspiring message of hope and new life.",
      date: "April 5, 2026",
      time: "10:00 AM",
      location: "Main Sanctuary",
      imageUrl: "/images/cross-glow.png",
      featured: true,
    },
    {
      title: "Men's Fellowship Gathering",
      description: "A time for the men of FPC Dallas to come together for fellowship, accountability, and spiritual growth. Guest speaker and dinner provided.",
      date: "April 12, 2026",
      time: "6:00 PM",
      location: "Fellowship Hall",
      featured: false,
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

  console.log("Database seeded successfully!");
}
