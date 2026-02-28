import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Users, MessageSquarePlus, Trophy, ArrowLeft, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay, isSameMonth } from "date-fns";
import type { Event } from "@shared/schema";

interface KioskMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface PrayerLog {
  id: string;
  memberId: string;
  loggedAt: string;
  member: { firstName: string; lastName: string };
}

const INACTIVITY_TIMEOUT = 30_000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const RETRY_OPTS = { retry: 3, retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000), staleTime: 5 * 60_000, refetchOnReconnect: true as const };

export default function KioskPage() {
  const [tab, setTab] = useState<"home" | "prayer" | "login" | "victory" | "events">("home");
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetToHome = useCallback(() => {
    setTab("home");
  }, []);

  // Auto-reset on inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        resetToHome();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastActivity, resetToHome]);

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Periodic full-page reload every 6 hours (when idle on home) to prevent memory buildup
  useEffect(() => {
    const timer = setInterval(() => {
      if (tab === "home" && Date.now() - lastActivity > 60_000) {
        window.location.reload();
      }
    }, SIX_HOURS);
    return () => clearInterval(timer);
  }, [tab, lastActivity]);

  useEffect(() => {
    const events = ["touchstart", "mousedown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, [handleActivity]);

  return (
    <div
      className="fixed inset-0 text-white flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0a0a0a 70%)" }}
      onTouchStart={handleActivity}
      onMouseDown={handleActivity}
    >
      {tab === "home" ? (
        /* ===== Welcome Screen ===== */
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-16">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 text-center">
            Welcome
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-12 text-center">
            Log in, share a request, or celebrate a victory
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {([
              {
                key: "login" as const,
                icon: Users,
                label: "Prayer Login",
                desc: "Check in as a prayer warrior",
              },
              {
                key: "prayer" as const,
                icon: MessageSquarePlus,
                label: "Submit Prayer Request",
                desc: "Share your prayer need with the community",
              },
              {
                key: "victory" as const,
                icon: Trophy,
                label: "Share a Victory",
                desc: "Celebrate what God has done",
              },
            ]).map((card) => (
              <button
                key={card.key}
                onClick={() => { setTab(card.key); handleActivity(); }}
                className="group flex flex-col items-center justify-center gap-4 min-h-[200px] md:min-h-[280px] rounded-2xl bg-white/10 border border-white/25 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-400/30 transition-all active:scale-95 p-8"
              >
                <card.icon className="w-16 h-16 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <span className="text-2xl font-bold text-white">{card.label}</span>
                <span className="text-lg text-gray-200 text-center">{card.desc}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setTab("events"); handleActivity(); }}
            className="mt-8 flex items-center justify-center gap-3 w-full max-w-md mx-auto px-6 py-4 rounded-xl bg-white/10 border border-white/25 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-400/30 transition-all active:scale-95"
          >
            <CalendarDays className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-semibold text-white">Upcoming Events</span>
          </button>

          <div className="mt-16 w-24 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        </div>
      ) : (
        /* ===== Sub-view ===== */
        <>
          <div className="p-4">
            <button
              onClick={() => { setTab("home"); handleActivity(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white hover:text-white transition-colors text-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Home
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            {tab === "prayer" && <PrayerRequestForm />}
            {tab === "login" && <PrayerLoginSection />}
            {tab === "victory" && <VictoryReportForm />}
            {tab === "events" && <UpcomingEventsView />}
          </div>
        </>
      )}
    </div>
  );
}

// ========== Prayer Request Form ==========
function PrayerRequestForm() {
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          authorName: isAnonymous ? "Anonymous" : name,
          isAnonymous,
          isPublic: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setName("");
      setTitle("");
      setBody("");
      setIsAnonymous(false);
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🙏</div>
          <h2 className="text-3xl font-light">Prayer Request Submitted</h2>
          <p className="text-gray-200 text-xl">Thank you for sharing your prayer need.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-8">Submit a Prayer Request</h2>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-14 h-8 rounded-full transition-colors relative ${
              isAnonymous ? "bg-amber-500" : "bg-gray-600"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
              isAnonymous ? "translate-x-7" : "translate-x-1"
            }`} />
          </div>
          <span className="text-lg">Anonymous</span>
        </label>
      </div>

      {!isAnonymous && (
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}

      <input
        type="text"
        placeholder="Prayer request title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      <textarea
        placeholder="Describe your prayer need..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
      />

      {submit.isError && (
        <p className="text-center text-red-400 text-lg">Something went wrong. Please try again.</p>
      )}

      <button
        onClick={() => submit.mutate()}
        disabled={!title || !body || (!isAnonymous && !name) || submit.isPending}
        className="w-full py-5 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-400/30"
      >
        {submit.isPending ? "Submitting..." : "Submit Prayer Request"}
      </button>
    </div>
  );
}

// ========== Prayer Login Section ==========
function PrayerLoginSection() {
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const { data: members } = useQuery<KioskMember[]>({
    queryKey: ["/api/members/kiosk"],
    queryFn: async () => {
      const res = await fetch("/api/members/kiosk");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    ...RETRY_OPTS,
  });

  const { data: prayerLogs } = useQuery<PrayerLog[]>({
    queryKey: ["/api/prayer-logs"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-logs");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
    ...RETRY_OPTS,
  });

  const checkin = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch("/api/prayer-logs/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const name = data.member?.firstName || "Friend";
      setSuccess(name);
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-logs"] });
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err: Error) => {
      if (err.message.includes("Already checked in")) {
        setSuccess("already");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSuccess("error");
        setTimeout(() => setSuccess(null), 3000);
      }
    },
  });

  const filtered = search.trim().length >= 2
    ? members?.filter((m) => {
        const q = search.toLowerCase();
        return m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q);
      })
    : [];

  // Deduplicate prayer warriors by memberId
  const uniqueWarriors = prayerLogs
    ? Array.from(new Map(prayerLogs.map((l) => [l.memberId, l])).values())
    : [];

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">{success === "error" ? "⚠️" : "✨"}</div>
          <h2 className="text-3xl font-light">
            {success === "already" ? "You're already checked in!" : success === "error" ? "Something went wrong" : `Thank you, ${success}!`}
          </h2>
          <p className="text-gray-200 text-xl">
            {success === "already" ? "Come back later to check in again." : success === "error" ? "Please try again in a moment." : "You've joined the prayer warriors."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-2">Type Your Name to Join in Prayer</h2>

      <input
        type="text"
        placeholder="Start typing your name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        autoFocus
      />

      {search.trim().length < 2 ? (
        <p className="text-center text-gray-400 text-lg py-8">Start typing to find your name</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-2">
          {filtered?.map((m) => (
            <button
              key={m.id}
              onClick={() => checkin.mutate(m.id)}
              disabled={checkin.isPending}
              className="px-4 py-4 rounded-xl bg-gray-800 border border-gray-500 text-lg font-medium hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95"
            >
              {m.firstName} {m.lastName}
            </button>
          ))}
          {filtered?.length === 0 && (
            <p className="col-span-full text-center text-gray-300 text-lg py-8">No members found</p>
          )}
        </div>
      )}

      {/* Prayer Warriors Today — Horizontal Marquee */}
      {uniqueWarriors.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/25">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <h3 className="text-2xl font-semibold mb-4 text-amber-400">Prayer Warriors Today</h3>
          <div className="overflow-hidden">
            <div
              className="whitespace-nowrap"
              style={{
                animation: `marquee ${Math.max(uniqueWarriors.length * 1.5, 8)}s linear infinite`,
              }}
            >
              {[0, 1].map((copy) => (
                <span key={copy}>
                  {uniqueWarriors.map((l) => (
                    <span
                      key={`${copy}-${l.id}`}
                      className="inline-block px-4 py-2 mx-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-lg"
                    >
                      {l.member.firstName} {l.member.lastName}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Upcoming Events View ==========
function UpcomingEventsView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    ...RETRY_OPTS,
  });

  const publishedEvents = useMemo(
    () => events?.filter((e) => e.status === "published") ?? [],
    [events],
  );

  const eventDates = useMemo(
    () => publishedEvents.map((e) => new Date(e.startDate)),
    [publishedEvents],
  );

  const eventsThisMonth = useMemo(
    () =>
      publishedEvents
        .filter((e) => isSameMonth(new Date(e.startDate), displayedMonth))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [publishedEvents, displayedMonth],
  );

  const formatEventDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const formatEventTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xl text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6">Upcoming Events</h2>

      {/* Big centered calendar */}
      <div className="flex justify-center mb-8">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          month={displayedMonth}
          onMonthChange={setDisplayedMonth}
          modifiers={{ hasEvent: eventDates }}
          modifiersClassNames={{ hasEvent: "has-event-dot" }}
          className="rounded-xl border border-gray-600 bg-gray-900 p-6 md:p-8 text-white"
          classNames={{
            months: "flex flex-col space-y-6",
            month: "space-y-6",
            caption: "flex justify-center pt-1 relative items-center text-white",
            caption_label: "text-xl md:text-2xl font-bold text-white",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-10 w-10 bg-transparent border border-gray-600 rounded-lg p-0 opacity-60 hover:opacity-100 hover:bg-gray-700 inline-flex items-center justify-center text-white",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-gray-400 rounded-md w-12 md:w-16 font-medium text-sm md:text-base",
            row: "flex w-full mt-2",
            cell: "h-12 w-12 md:h-16 md:w-16 text-center p-0 relative focus-within:relative focus-within:z-20",
            day: "h-12 w-12 md:h-16 md:w-16 p-0 font-normal text-base md:text-lg rounded-lg hover:bg-gray-700 inline-flex items-center justify-center text-gray-200 aria-selected:opacity-100 transition-colors",
            day_selected: "bg-amber-500 text-black hover:bg-amber-400 font-bold",
            day_today: "ring-2 ring-amber-400/60 text-amber-300 font-semibold",
            day_outside: "text-gray-600 opacity-50",
            day_disabled: "text-gray-600 opacity-30",
            day_hidden: "invisible",
          }}
        />
        <style>{`
          .has-event-dot { position: relative; }
          .has-event-dot::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #f59e0b;
          }
        `}</style>
      </div>

      {/* Events for this month */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-200">
          Events in {displayedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>

        {eventsThisMonth.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-lg">No events this month</p>
          </div>
        ) : (
          eventsThisMonth.map((event) => {
            const isSelected = isSameDay(new Date(event.startDate), selectedDate);
            return (
              <div
                key={event.id}
                onClick={() => setSelectedDate(new Date(event.startDate))}
                className={`rounded-xl bg-gray-900 border p-5 space-y-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "border-amber-400 ring-1 ring-amber-400/50"
                    : "border-gray-500 hover:border-gray-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  {event.category && (
                    <span className="shrink-0 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-sm">
                      {event.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-gray-300 text-base">
                  <span>{formatEventDate(event.startDate)}</span>
                  {!event.allDay && <span>{formatEventTime(event.startDate)}</span>}
                  {event.endDate && !event.allDay && (
                    <span>– {formatEventTime(event.endDate)}</span>
                  )}
                  {event.allDay && <span className="text-amber-300">All day</span>}
                </div>
                {event.location && (
                  <p className="text-gray-300 text-base">📍 {event.location}</p>
                )}
                {event.description && (
                  <p className="text-gray-400 text-base line-clamp-2">{event.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ========== Victory Report Form ==========
function VictoryReportForm() {
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/victory-reports/kiosk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          authorName: isAnonymous ? "Anonymous" : name,
          isAnonymous,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setName("");
      setTitle("");
      setBody("");
      setIsAnonymous(false);
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-light">Victory Report Submitted!</h2>
          <p className="text-gray-200 text-xl">Thank you for sharing your testimony.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-8">Share a Victory Report</h2>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-14 h-8 rounded-full transition-colors relative ${
              isAnonymous ? "bg-amber-500" : "bg-gray-600"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
              isAnonymous ? "translate-x-7" : "translate-x-1"
            }`} />
          </div>
          <span className="text-lg">Anonymous</span>
        </label>
      </div>

      {!isAnonymous && (
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}

      <input
        type="text"
        placeholder="Victory title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      <textarea
        placeholder="Share your victory or testimony..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-500 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
      />

      {submit.isError && (
        <p className="text-center text-red-400 text-lg">Something went wrong. Please try again.</p>
      )}

      <button
        onClick={() => submit.mutate()}
        disabled={!title || !body || (!isAnonymous && !name) || submit.isPending}
        className="w-full py-5 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-400/30"
      >
        {submit.isPending ? "Submitting..." : "Submit Victory Report"}
      </button>
    </div>
  );
}
