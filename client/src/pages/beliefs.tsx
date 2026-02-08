import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Flame, Droplets, Heart, Shield, Crown, Cross, Users, ArrowRight, Sparkles, MessageCircle, Wind } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const beliefs = [
  {
    icon: BookOpen,
    title: "The Bible",
    description: "We believe the Bible is the inspired, infallible Word of God. It is the supreme authority in all matters of faith, doctrine, and Christian living. Every word is God-breathed and profitable for teaching, correction, and training in righteousness.",
    verse: "2 Timothy 3:16-17",
  },
  {
    icon: Crown,
    title: "One God",
    description: "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit. These three are one God, co-equal and co-eternal. God is the Creator of all things, infinitely perfect and eternally existing.",
    verse: "Deuteronomy 6:4; Matthew 28:19",
  },
  {
    icon: Cross,
    title: "Jesus Christ",
    description: "We believe in the deity of Jesus Christ, His virgin birth, His sinless life, His miracles, His atoning death on the cross, His bodily resurrection, His ascension to the right hand of the Father, and His imminent return in power and glory.",
    verse: "John 1:1-14; Philippians 2:5-11",
  },
  {
    icon: Flame,
    title: "The Holy Spirit",
    description: "We believe in the baptism of the Holy Spirit with the initial evidence of speaking in other tongues as the Spirit gives utterance. We believe the gifts of the Spirit are active today and available to every believer.",
    verse: "Acts 2:4; 1 Corinthians 12:1-11",
  },
  {
    icon: Heart,
    title: "Salvation",
    description: "We believe salvation is a gift of God's grace received through faith in Jesus Christ. It includes repentance from sin, faith toward God, water baptism by immersion in the name of Jesus Christ, and the receiving of the Holy Spirit.",
    verse: "Acts 2:38; Ephesians 2:8-9",
  },
  {
    icon: Droplets,
    title: "Water Baptism",
    description: "We believe in water baptism by immersion in the name of the Lord Jesus Christ for the remission of sins. Baptism is an outward expression of an inward transformation and an act of obedience to God's Word.",
    verse: "Acts 2:38; Romans 6:3-4",
  },
  {
    icon: Shield,
    title: "Holy Living",
    description: "We believe God calls every believer to live a holy and separated life. Through the power of the Holy Spirit, we can overcome sin and live in a way that honors God in every area of our lives.",
    verse: "1 Peter 1:15-16; Hebrews 12:14",
  },
  {
    icon: Users,
    title: "The Church",
    description: "We believe the Church is the body of Christ, made up of born-again believers from every nation, tribe, and tongue. The local church is ordained by God for worship, fellowship, discipleship, and evangelism.",
    verse: "Ephesians 1:22-23; Acts 2:42-47",
  },
];

export default function Beliefs() {
  useSEO({ title: "Our Beliefs", description: "Discover the foundational truths and statement of faith that guide First Pentecostal Church of Dallas." });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-beliefs-hero">
        <div className="absolute inset-0">
          <img src="/images/bible-podium.png" alt="Bible on podium" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            What We Believe
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Our Statement of Faith
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            The foundational truths that guide our church and shape our ministry
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-beliefs-content">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold">
                Grounded in <span className="text-gold">God's Word</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto leading-relaxed">
                Our beliefs are rooted in the unchanging truth of Scripture. These
                core doctrines define who we are and guide everything we do as a church.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="space-y-6">
              {beliefs.map((belief, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 hover-elevate" data-testid={`card-belief-${i}`}>
                    <div className="flex gap-6">
                      <div className="shrink-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-accent flex items-center justify-center">
                          <belief.icon className="w-6 h-6 md:w-7 md:h-7 text-accent-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2">{belief.title}</h3>
                        <p className="text-muted-foreground font-body leading-relaxed mb-3">
                          {belief.description}
                        </p>
                        <p className="text-gold font-body text-sm font-semibold italic">
                          {belief.verse}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-pentecostal-distinctives">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Our Identity</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                What Makes Us <span className="text-gold">Pentecostal</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto leading-relaxed">
                As an Apostolic Pentecostal church, we embrace the full gospel experience
                as described in the book of Acts.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Wind,
                  title: "Spirit Baptism",
                  description:
                    "We believe every believer can receive the baptism of the Holy Spirit, an empowering experience that equips us for service and deepens our relationship with God.",
                  verse: "Acts 1:8",
                },
                {
                  icon: MessageCircle,
                  title: "Speaking in Tongues",
                  description:
                    "We believe that speaking in other tongues as the Spirit gives utterance is the initial evidence of the Holy Spirit baptism, just as it was on the Day of Pentecost.",
                  verse: "Acts 2:4",
                },
                {
                  icon: Sparkles,
                  title: "Gifts of the Spirit",
                  description:
                    "We believe the spiritual gifts described in 1 Corinthians 12 are active and available to believers today, given by the Holy Spirit for the edification of the Church.",
                  verse: "1 Corinthians 12:7-11",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 h-full hover-elevate text-center" data-testid={`card-pentecostal-${i}`}>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <p className="text-gold font-body text-sm font-semibold italic">{item.verse}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy" data-testid="section-beliefs-scripture">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <BookOpen className="w-10 h-10 text-gold mx-auto mb-6" />
              <blockquote className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-6 italic">
                "For God so loved the world, that he gave his only begotten Son,
                that whosoever believeth in him should not perish, but have
                everlasting life."
              </blockquote>
              <p className="text-gold font-body text-lg font-semibold">John 3:16 KJV</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-beliefs-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Questions About Our <span className="text-gold">Beliefs?</span>
              </h2>
              <p className="text-muted-foreground font-body mb-8 max-w-xl mx-auto">
                We'd love to talk with you about what we believe and why. Reach out to us
                and let's have a conversation about faith.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-beliefs-connect">
                  Ask a Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
