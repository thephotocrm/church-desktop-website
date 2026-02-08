import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, MapPin, Clock, ArrowRight, Sun, Moon, BookOpen, Share2, Globe, RefreshCw } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import type { Event } from "@shared/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function EventSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-6">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

export default function Events() {
  useSEO({ title: "Events", description: "Stay connected with upcoming events, gatherings, and programs at First Pentecostal Church of Dallas." });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-events-hero">
        <div className="absolute inset-0">
          <img src="/images/community-outreach.png" alt="Events" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Stay Connected
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Upcoming Events
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Discover what's happening at First Pentecostal Church and get involved
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-events-list">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold">
                What's <span className="text-gold">Happening</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                From worship gatherings to community outreach, there's always something to be part of.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <EventSkeleton key={i} />
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <motion.div key={event.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "50px" }} variants={fadeUp}>
                    <Card className="overflow-hidden h-full hover-elevate" data-testid={`card-event-${event.id}`}>
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
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-body text-gold font-semibold">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                        <p className="text-muted-foreground font-body text-sm leading-relaxed">
                          {event.description}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-body text-muted-foreground">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Events Scheduled</h3>
                <p className="text-muted-foreground font-body">Check back soon for upcoming events and gatherings.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-weekly-services">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Every Week</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Weekly <span className="text-gold">Services</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Join us for worship, prayer, and the Word of God throughout the week.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Sun,
                  title: "Sunday Morning",
                  time: "10:00 AM",
                  description: "Our main worship gathering with praise, prayer, and an anointed message from God's Word.",
                },
                {
                  icon: Moon,
                  title: "Sunday Evening",
                  time: "6:00 PM",
                  description: "An intimate evening service focused on deeper teaching, testimony, and Spirit-led worship.",
                },
                {
                  icon: BookOpen,
                  title: "Wednesday Bible Study",
                  time: "7:00 PM",
                  description: "Midweek Bible study and prayer meeting to recharge your faith and grow in the Word.",
                },
              ].map((service, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 h-full hover-elevate text-center" data-testid={`card-service-${i}`}>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                      <service.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{service.title}</h3>
                    <p className="text-gold font-body text-sm font-semibold mb-3">{service.time}</p>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-stay-updated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Stay in the Loop</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Stay <span className="text-gold">Updated</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Never miss an event or announcement. Here's how to stay connected with what's happening.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Share2,
                  title: "Follow Us on Social Media",
                  description: "Stay connected through our social media channels for real-time updates, event reminders, and encouraging content.",
                },
                {
                  icon: Globe,
                  title: "Visit Our Connect Page",
                  description: "Fill out our connect form and we'll make sure you receive all the latest news and event information directly.",
                  link: "/connect",
                },
                {
                  icon: RefreshCw,
                  title: "Check Back Often",
                  description: "This events page is updated regularly with new gatherings, special services, and community outreach opportunities.",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 h-full hover-elevate text-center" data-testid={`card-updated-${i}`}>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy" data-testid="section-events-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Join Us <span className="text-gold">This Week</span>
              </h2>
              <p className="text-white/70 font-body mb-8">
                There's a place for you at First Pentecostal Church. Come experience the presence of God
                and the warmth of our church family.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-events-connect">
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
