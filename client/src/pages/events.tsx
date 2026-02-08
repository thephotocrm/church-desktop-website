import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock } from "lucide-react";
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
            viewport={{ once: true, margin: "-100px" }}
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
                  <motion.div key={event.id} variants={fadeUp}>
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
    </div>
  );
}
