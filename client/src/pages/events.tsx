import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, MapPin, Clock, ArrowRight, Share2, Globe, RefreshCw, Download, UserCheck } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "worship", label: "Worship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "prayer", label: "Prayer" },
  { value: "general", label: "General" },
];

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

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

interface MemberAuth {
  memberId: string;
  email: string;
  role: string;
}

export default function Events() {
  useSEO({ title: "Events", description: "Stay connected with upcoming events, gatherings, and programs at First Pentecostal Church of Dallas." });

  const [categoryFilter, setCategoryFilter] = useState("all");

  const queryUrl = categoryFilter === "all"
    ? "/api/events"
    : `/api/events?category=${categoryFilter}`;

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", categoryFilter],
    queryFn: async () => {
      const res = await fetch(queryUrl, {
        credentials: "include",
        headers: (() => {
          const h: Record<string, string> = {};
          const token = localStorage.getItem("fpc_access_token");
          if (token) h["Authorization"] = `Bearer ${token}`;
          return h;
        })(),
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  // Check if user is a logged-in member
  const { data: memberAuth } = useQuery<MemberAuth | null>({
    queryKey: ["/api/members/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const categoryColor: Record<string, string> = {
    worship: "bg-purple-500 hover:bg-purple-600",
    fellowship: "bg-blue-500 hover:bg-blue-600",
    outreach: "bg-green-500 hover:bg-green-600",
    youth: "bg-orange-500 hover:bg-orange-600",
    prayer: "bg-indigo-500 hover:bg-indigo-600",
    general: "bg-gray-500 hover:bg-gray-600",
  };

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

            {/* Category Filter */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mb-10">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={categoryFilter === cat.value ? "default" : "outline"}
                  className={`cursor-pointer text-sm px-4 py-1.5 ${
                    categoryFilter === cat.value
                      ? "bg-gold text-white border-gold"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </Badge>
              ))}
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
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={`${categoryColor[(event as any).category || "general"]} text-white border-0 text-xs capitalize`}>
                            {(event as any).category || "general"}
                          </Badge>
                          {event.featured && (
                            <Badge className="bg-gold text-white border-gold text-xs">Featured</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-body text-gold font-semibold">
                            <Calendar className="w-4 h-4" />
                            {formatEventDate(event.startDate as unknown as string)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {formatEventTime(event.startDate as unknown as string)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                        <p className="text-muted-foreground font-body text-sm leading-relaxed line-clamp-3">
                          {event.description}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-body text-muted-foreground">{event.location}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                          {memberAuth && (
                            <RsvpButton eventId={event.id} />
                          )}
                          <a href={`/api/events/${event.id}/ical`} download>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Add to Calendar
                            </Button>
                          </a>
                        </div>
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

function RsvpButton({ eventId }: { eventId: string }) {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (rsvpStatus === "attending") {
        await apiRequest("DELETE", `/api/events/${eventId}/rsvp`);
        return null;
      }
      const res = await apiRequest("POST", `/api/events/${eventId}/rsvp`, { status: "attending" });
      return res.json();
    },
    onSuccess: (data) => {
      setRsvpStatus(data ? "attending" : null);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  return (
    <Button
      size="sm"
      variant={rsvpStatus === "attending" ? "default" : "outline"}
      className={rsvpStatus === "attending" ? "bg-green-600 text-white hover:bg-green-700 text-xs" : "text-xs"}
      onClick={() => rsvpMutation.mutate()}
      disabled={rsvpMutation.isPending}
    >
      <UserCheck className="w-3.5 h-3.5 mr-1" />
      {rsvpStatus === "attending" ? "Attending" : "I'm Attending"}
    </Button>
  );
}
