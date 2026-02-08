import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Clock, MapPin, Heart, BookOpen, Users, Play, ArrowRight,
  Calendar, HandHeart, Flame, Sparkles
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import type { Event } from "@shared/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Home() {
  useSEO({
    title: "Welcome Home",
    description: "First Pentecostal Church of Dallas - A Spirit-filled community of believers committed to worshipping God, reaching the lost, and making disciples for Jesus Christ.",
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const featuredEvents = events?.filter(e => e.featured).slice(0, 3) || [];

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src="/images/hero-sanctuary.png"
            alt="Church sanctuary"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 font-body text-sm">
              <Flame className="w-4 h-4 text-gold" />
              Spirit-Filled Worship
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight text-shadow-lg mb-6"
          >
            Welcome to{" "}
            <span className="text-gold">First Pentecostal</span>
            <br />Church of Dallas
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/80 font-body max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Experience the power of the Holy Spirit in a community built on faith,
            love, and the uncompromising Word of God. Join us as we worship,
            grow, and serve together.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/connect">
              <Button size="lg" className="bg-gold text-white border-gold font-body text-base px-8" data-testid="button-hero-connect">
                Plan Your Visit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/live">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10 font-body text-base px-8" data-testid="button-hero-livestream">
                <Play className="w-4 h-4 mr-2" />
                Watch Live
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gold rounded-full"
            />
          </div>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-service-times">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Join Us</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">When We Gather</h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { day: "Sunday Morning", subtitle: "Church Service", time: "10:00 AM", desc: "A full worship and preaching service with anointed praise, prayer, and a powerful Word from the pulpit.", icon: Sparkles },
                { day: "Sunday Evening", subtitle: "Study & Fellowship", time: "6:00 PM", desc: "Connect Night — a time for Bible study, fellowship, and building lasting relationships in the body of Christ.", icon: Flame },
                { day: "Wednesday", subtitle: "Prayer & Bible Study", time: "7:00 PM", desc: "Midweek recharge with prayer, worship, and Bible study to carry you through the rest of the week.", icon: BookOpen },
              ].map((service, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-8 text-center hover-elevate">
                    <div className="w-14 h-14 rounded-md bg-accent flex items-center justify-center mx-auto mb-5">
                      <service.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{service.day}</h3>
                    <p className="text-sm font-semibold text-gold font-body uppercase tracking-wide mb-2">{service.subtitle}</p>
                    <p className="text-2xl font-bold text-gold font-body mb-2">{service.time}</p>
                    <p className="text-muted-foreground font-body text-sm">{service.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden" data-testid="section-welcome">
        <div className="absolute inset-0">
          <img
            src="/images/hero-worship.png"
            alt="Worship"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp}>
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Our Heart</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-6 leading-tight text-shadow">
                A Place Where You{" "}
                <span className="text-gold">Belong</span>
              </h2>
              <p className="text-white/80 font-body text-lg leading-relaxed mb-6">
                At First Pentecostal Church of Dallas, we believe in the transforming
                power of the Holy Spirit. Whether you're taking your first steps in
                faith or you've been walking with God for decades, there's a place
                for you here.
              </p>
              <p className="text-white/70 font-body leading-relaxed mb-8">
                Our doors are open to everyone. Come as you are and experience the
                life-changing presence of God in a community that truly cares about
                you and your family.
              </p>
              <Link href="/about">
                <Button className="bg-gold text-white border-gold font-body" data-testid="button-learn-more">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, label: "Spirit-Filled\nWorship", count: "20+" , sub: "Years of Ministry" },
                { icon: Users, label: "Growing\nCommunity", count: "500+", sub: "Members Strong" },
                { icon: HandHeart, label: "Outreach\nPrograms", count: "12", sub: "Active Ministries" },
                { icon: BookOpen, label: "Biblical\nTeaching", count: "100+", sub: "Weekly Attendees" },
              ].map((item, i) => (
                <Card key={i} className="p-6 bg-white/10 backdrop-blur-sm border-white/10 text-white text-center">
                  <item.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                  <p className="text-2xl font-bold text-gold mb-1 font-body">{item.count}</p>
                  <p className="text-sm text-white/70 font-body">{item.sub}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-pastor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeUp} className="order-2 lg:order-1">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">From Our Pastor</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                A Word From{" "}
                <span className="text-gold">Pastor Johnson</span>
              </h2>
              <blockquote className="text-lg font-body text-muted-foreground leading-relaxed italic mb-6 border-l-4 border-gold pl-6">
                "Our mission is simple: to love God with all our hearts, to love
                our neighbors as ourselves, and to share the good news of Jesus
                Christ with everyone we meet. At First Pentecostal Church, you'll
                find a family ready to welcome you home."
              </blockquote>
              <p className="font-bold text-lg">Pastor David Johnson</p>
              <p className="text-muted-foreground font-body text-sm">Senior Pastor</p>
              <Link href="/leadership">
                <Button variant="outline" className="mt-6 font-body" data-testid="button-meet-team">
                  Meet Our Leadership
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <img
                  src="/images/pastor-main.png"
                  alt="Pastor David Johnson"
                  className="w-72 md:w-80 rounded-md object-cover"
                />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-md bg-gold opacity-20 -z-10" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {featuredEvents.length > 0 && (
        <section className="py-20 bg-card" data-testid="section-events">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="text-center mb-14">
                <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">What's Happening</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2">Upcoming Events</h2>
                <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredEvents.map((event) => (
                  <motion.div key={event.id} variants={fadeUp}>
                    <Card className="overflow-hidden hover-elevate" data-testid={`card-event-${event.id}`}>
                      {event.imageUrl && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gold" />
                          <span className="text-sm font-body text-muted-foreground">{event.date} at {event.time}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                        <p className="text-muted-foreground font-body text-sm line-clamp-2">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-3">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-body text-muted-foreground">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="text-center mt-10">
                <Link href="/events">
                  <Button variant="outline" className="font-body" data-testid="button-all-events">
                    View All Events
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="py-20 relative overflow-hidden" data-testid="section-cta">
        <div className="absolute inset-0">
          <img
            src="/images/cross-glow.png"
            alt="Cross"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-white mb-6 text-shadow-lg">
              Ready to Take the{" "}
              <span className="text-gold">Next Step?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mb-10">
              Whether it's your first time visiting or you're ready to get involved,
              we'd love to connect with you and help you find your place here.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-cta-connect">
                  Connect With Us
                </Button>
              </Link>
              <Link href="/give">
                <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/10 font-body px-8" data-testid="button-cta-give">
                  <HandHeart className="w-4 h-4 mr-2" />
                  Support Our Mission
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
