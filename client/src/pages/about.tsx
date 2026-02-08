import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Heart, BookOpen, Users, Globe, Flame, HandHeart } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function About() {
  useSEO({ title: "About Us", description: "Learn about First Pentecostal Church of Dallas - our story, vision, mission, and core values that guide everything we do." });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-about-hero">
        <div className="absolute inset-0">
          <img src="/images/hero-worship.png" alt="Worship" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Who We Are
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            About Our Church
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            A Spirit-filled family rooted in faith, love, and the power of God
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-our-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp}>
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                Built on a Foundation of <span className="text-gold">Faith</span>
              </h2>
              <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                <p>
                  First Pentecostal Church of Dallas was founded over two decades ago
                  with a simple yet powerful vision: to create a place where people
                  from all walks of life could encounter the living God and be
                  transformed by His Spirit.
                </p>
                <p>
                  What began as a small prayer meeting in a living room has grown
                  into a vibrant congregation of hundreds of believers who are
                  passionate about worshipping God, serving our community, and
                  sharing the gospel with the world.
                </p>
                <p>
                  Today, our church stands as a beacon of hope in the Dallas
                  community, committed to preaching the full gospel of Jesus Christ
                  with signs and wonders following. We are a church that believes in
                  the power of prayer, the authority of Scripture, and the
                  life-changing baptism of the Holy Spirit.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <img
                src="/images/community-outreach.png"
                alt="Community outreach"
                className="w-full rounded-md object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-vision">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Our Vision & Mission</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">What Drives Us</h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div variants={fadeUp}>
                <Card className="p-8 h-full">
                  <div className="w-14 h-14 rounded-md bg-accent flex items-center justify-center mb-5">
                    <Flame className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    To be a Spirit-empowered church that transforms lives and
                    communities through the gospel of Jesus Christ, raising up
                    a generation of passionate believers who carry the fire of
                    revival wherever they go.
                  </p>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="p-8 h-full">
                  <div className="w-14 h-14 rounded-md bg-accent flex items-center justify-center mb-5">
                    <Globe className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    To worship God with all our hearts, win the lost to Christ,
                    disciple believers into spiritual maturity, equip the saints
                    for the work of ministry, and demonstrate the love of God
                    through compassionate outreach.
                  </p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-values">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Core Values</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">What We Stand For</h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Flame, title: "Spirit-Led Worship", desc: "We pursue the presence of God through passionate, Spirit-filled worship that transforms hearts and minds." },
                { icon: BookOpen, title: "Biblical Authority", desc: "The Bible is our foundation. We believe in the inerrant, inspired Word of God as our guide for all faith and practice." },
                { icon: Heart, title: "Authentic Community", desc: "We foster genuine relationships where people can be real, be loved, and grow together in Christ." },
                { icon: Users, title: "Discipleship", desc: "We are committed to helping every believer grow into spiritual maturity through intentional discipleship and teaching." },
                { icon: HandHeart, title: "Compassionate Outreach", desc: "We demonstrate the love of Christ by serving our neighbors and reaching the hurting in our community and beyond." },
                { icon: Globe, title: "Global Missions", desc: "We support missionaries and missions efforts around the world, carrying the gospel to every nation." },
              ].map((value, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 h-full hover-elevate">
                    <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mb-4">
                      <value.icon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">{value.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden" data-testid="section-about-cta">
        <div className="absolute inset-0 bg-navy" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
              Come Experience the <span className="text-gold">Difference</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mb-8">
              We'd love to meet you and your family. Visit us this Sunday and discover what God has in store for you.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-about-connect">
                  Plan Your Visit
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
