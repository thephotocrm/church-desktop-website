import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";

interface PrayerRequest {
  id: string;
  title: string;
  body: string;
  prayerCount: number | null;
  createdAt: string;
}

interface PrayerLog {
  id: string;
  memberId: string;
  loggedAt: string;
  member: { firstName: string; lastName: string };
}

interface VictoryReport {
  id: string;
  title: string;
  body: string;
  authorName: string | null;
  createdAt: string;
}

type Section = "prayers" | "victories" | "warriors";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

const SECTION_ORDER: Section[] = ["prayers", "victories", "warriors"];
const SCROLL_SPEED_PX_PER_SEC = 80;
const WARRIORS_HOLD_SECONDS = 10;
const NO_SCROLL_HOLD_SECONDS = 8;
const END_PAUSE_MS = 1500;

export default function PrayerDisplay() {
  const [activeSection, setActiveSection] = useState<Section>("prayers");
  const [visible, setVisible] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const scrollStartRef = useRef<number | null>(null);
  const scrollActiveRef = useRef(false);

  const { data: requests } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/prayer-requests", "display"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-requests?since=7d&status=active&limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const { data: victoryReports } = useQuery<VictoryReport[]>({
    queryKey: ["/api/victory-reports", "display"],
    queryFn: async () => {
      const res = await fetch("/api/victory-reports");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const { data: prayerLogs } = useQuery<PrayerLog[]>({
    queryKey: ["/api/prayer-logs", "display"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-logs");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const uniqueWarriors = prayerLogs
    ? Array.from(new Map(prayerLogs.map((l) => [l.memberId, l])).values())
    : [];

  const getItemCount = useCallback(
    (section: Section): number => {
      switch (section) {
        case "prayers":
          return requests?.length ?? 0;
        case "victories":
          return victoryReports?.length ?? 0;
        case "warriors":
          return uniqueWarriors.length;
      }
    },
    [requests, victoryReports, uniqueWarriors]
  );

  const getNextSection = useCallback(
    (current: Section): Section => {
      const idx = SECTION_ORDER.indexOf(current);
      for (let i = 1; i <= SECTION_ORDER.length; i++) {
        const next = SECTION_ORDER[(idx + i) % SECTION_ORDER.length];
        if (getItemCount(next) > 0) return next;
      }
      return current;
    },
    [getItemCount]
  );

  const stopScrollAnimation = useCallback(() => {
    scrollActiveRef.current = false;
    scrollStartRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const advanceSection = useCallback(() => {
    stopScrollAnimation();
    setVisible(false);
    setTimeout(() => {
      setActiveSection((prev) => getNextSection(prev));
      setVisible(true);
    }, 700);
  }, [getNextSection, stopScrollAnimation]);

  const startScrollAnimation = useCallback(
    (totalDistance: number) => {
      const viewport = viewportRef.current;
      if (!viewport || totalDistance <= 0) return;

      const duration = (totalDistance / SCROLL_SPEED_PX_PER_SEC) * 1000;
      scrollActiveRef.current = true;
      scrollStartRef.current = null;
      viewport.scrollTop = 0;

      const animate = (timestamp: number) => {
        if (!scrollActiveRef.current) return;

        if (scrollStartRef.current === null) {
          scrollStartRef.current = timestamp;
        }

        const elapsed = timestamp - scrollStartRef.current;
        const progress = Math.min(elapsed / duration, 1);
        viewport.scrollTop = progress * totalDistance;

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // Reached the end — pause then advance
          scrollActiveRef.current = false;
          setTimeout(advanceSection, END_PAUSE_MS);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    },
    [advanceSection]
  );

  // Measure content and start scrolling when section changes
  useEffect(() => {
    const count = getItemCount(activeSection);
    if (count === 0) {
      advanceSection();
      return;
    }

    // Warriors hold then advance (no scroll)
    if (activeSection === "warriors") {
      const timer = setTimeout(advanceSection, WARRIORS_HOLD_SECONDS * 1000);
      return () => clearTimeout(timer);
    }

    // Measure after a brief delay to let content render
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    const measureTimer = setTimeout(() => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;

      const viewportHeight = viewport.clientHeight;
      const contentHeight = content.scrollHeight;
      const overflow = contentHeight - viewportHeight;

      if (overflow > 0) {
        startScrollAnimation(overflow);
      } else {
        holdTimer = setTimeout(advanceSection, NO_SCROLL_HOLD_SECONDS * 1000);
      }
    }, 100);

    return () => {
      clearTimeout(measureTimer);
      if (holdTimer) clearTimeout(holdTimer);
      stopScrollAnimation();
    };
  }, [activeSection, getItemCount, advanceSection, startScrollAnimation, stopScrollAnimation, requests, victoryReports]);

  // Skip to first non-empty section on initial load
  useEffect(() => {
    if (getItemCount(activeSection) === 0) {
      const next = getNextSection(activeSection);
      if (next !== activeSection) {
        setActiveSection(next);
      }
    }
  }, [requests, victoryReports, prayerLogs]);

  const sectionTitle = {
    prayers: "Prayer Requests",
    victories: "Victory Reports",
    warriors: "Prayer Warriors Today",
  }[activeSection];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none overflow-hidden">
      {/* Header */}
      <div className="pt-10 pb-4 text-center shrink-0">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white/60">
          {sectionTitle}
        </h1>
      </div>

      {/* Content */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden px-8 md:px-16 lg:px-32"
      >
        <div
          className="w-full transition-opacity duration-700"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {/* Prayer Requests - vertical scroll list */}
          {activeSection === "prayers" && requests && requests.length > 0 && (
            <div ref={contentRef} className="max-w-3xl mx-auto">
              {requests.map((prayer) => (
                <div
                  key={prayer.id}
                  className="min-h-[80vh] flex items-center justify-center"
                >
                  <div className="text-center px-4 py-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
                      {prayer.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-6">
                      {prayer.body}
                    </p>
                    <div className="text-base text-white/40 space-x-6">
                      <span>
                        {prayer.prayerCount ?? 0}{" "}
                        {prayer.prayerCount === 1 ? "person" : "people"} praying
                      </span>
                      <span>{timeAgo(prayer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Victory Reports - vertical scroll list */}
          {activeSection === "victories" && victoryReports && victoryReports.length > 0 && (
            <div ref={contentRef} className="max-w-3xl mx-auto">
              {victoryReports.map((victory) => (
                <div
                  key={victory.id}
                  className="min-h-[80vh] flex items-center justify-center"
                >
                  <div className="text-center px-4 py-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-6">
                      {victory.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-6">
                      {victory.body}
                    </p>
                    <div className="text-base text-white/40 space-x-6">
                      {victory.authorName && (
                        <span>— {victory.authorName}</span>
                      )}
                      <span>{timeAgo(victory.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prayer Warriors - grid, hold then advance */}
          {activeSection === "warriors" && uniqueWarriors.length > 0 && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex flex-wrap justify-center gap-3">
                {uniqueWarriors.map((w) => (
                  <span
                    key={w.memberId}
                    className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-lg font-medium"
                  >
                    {w.member.firstName} {w.member.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Loading / empty state */}
          {activeSection === "prayers" && !requests && (
            <p className="text-white/30 text-lg text-center">Loading...</p>
          )}
          {activeSection === "victories" && !victoryReports && (
            <p className="text-white/30 text-lg text-center">Loading...</p>
          )}
          {activeSection === "warriors" && !prayerLogs && (
            <p className="text-white/30 text-lg text-center">Loading...</p>
          )}
        </div>
      </div>

      {/* Section indicator dots */}
      <div className="pb-8 flex justify-center gap-2 shrink-0">
        {SECTION_ORDER.map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              s === activeSection ? "bg-white/60" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
