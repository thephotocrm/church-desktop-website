import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const RETRY_OPTS = { retry: 3, retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000), staleTime: 5 * 60_000, refetchOnReconnect: true as const };

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
const SCROLL_SPEED_PX_PER_SEC = 50;
const NO_SCROLL_HOLD_SECONDS = 8;
const EMPTY_STATE_HOLD_SECONDS = 6;
const END_PAUSE_MS = 1500;

export default function PrayerDisplay() {
  const [activeSection, setActiveSection] = useState<Section>("prayers");
  const [visible, setVisible] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const scrollStartRef = useRef<number | null>(null);
  const scrollActiveRef = useRef(false);

  const { data: requests, isError: reqError } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/prayer-requests", "display"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-requests?since=7d&status=active&limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
    ...RETRY_OPTS,
  });

  const { data: victoryReports, isError: vicError } = useQuery<VictoryReport[]>({
    queryKey: ["/api/victory-reports", "display"],
    queryFn: async () => {
      const res = await fetch("/api/victory-reports");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
    ...RETRY_OPTS,
  });

  const { data: prayerLogs, isError: logError } = useQuery<PrayerLog[]>({
    queryKey: ["/api/prayer-logs", "display"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-logs");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
    ...RETRY_OPTS,
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
      return SECTION_ORDER[(idx + 1) % SECTION_ORDER.length];
    },
    []
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

  const isDataLoaded = useCallback(
    (section: Section): boolean => {
      switch (section) {
        case "prayers": return requests !== undefined;
        case "victories": return victoryReports !== undefined;
        case "warriors": return prayerLogs !== undefined;
      }
    },
    [requests, victoryReports, prayerLogs]
  );

  // Measure content and start scrolling when section changes
  useEffect(() => {
    if (!isDataLoaded(activeSection)) return;

    const count = getItemCount(activeSection);

    if (count === 0) {
      const timer = setTimeout(advanceSection, EMPTY_STATE_HOLD_SECONDS * 1000);
      return () => clearTimeout(timer);
    }

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
  }, [activeSection, getItemCount, isDataLoaded, advanceSection, startScrollAnimation, stopScrollAnimation, requests, victoryReports, prayerLogs]);


  // Periodic full-page reload every 6 hours to prevent memory buildup
  useEffect(() => {
    const timer = setTimeout(() => window.location.reload(), SIX_HOURS);
    return () => clearTimeout(timer);
  }, []);

  const sectionTitle = {
    prayers: "Prayer Requests",
    victories: "Victory Reports",
    warriors: "Prayer Warriors Today",
  }[activeSection];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none overflow-hidden">
      {/* Header */}
      <div className="pt-10 pb-4 text-center shrink-0">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-widest uppercase text-white/60">
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
          {/* Prayer Requests */}
          {activeSection === "prayers" && requests && requests.length > 0 && (
            <div ref={contentRef} className="max-w-3xl mx-auto">
              {requests.map((prayer) => (
                <div
                  key={prayer.id}
                  className="min-h-[40vh] flex items-center justify-center"
                >
                  <div className="text-center px-4 py-8">
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-8">
                      {prayer.title}
                    </h2>
                    <p className="text-2xl md:text-3xl lg:text-4xl text-white/70 leading-relaxed mb-8">
                      {prayer.body}
                    </p>
                    <div className="text-lg md:text-xl text-white/40 space-x-6">
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

          {/* Victory Reports */}
          {activeSection === "victories" && victoryReports && victoryReports.length > 0 && (
            <div ref={contentRef} className="max-w-3xl mx-auto">
              {victoryReports.map((victory) => (
                <div
                  key={victory.id}
                  className="min-h-[40vh] flex items-center justify-center"
                >
                  <div className="text-center px-4 py-8">
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-8">
                      {victory.title}
                    </h2>
                    <p className="text-2xl md:text-3xl lg:text-4xl text-white/70 leading-relaxed mb-8">
                      {victory.body}
                    </p>
                    <div className="text-lg md:text-xl text-white/40 space-x-6">
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

          {/* Prayer Warriors - vertical scroll list */}
          {activeSection === "warriors" && uniqueWarriors.length > 0 && (
            <div ref={contentRef} className="max-w-3xl mx-auto">
              {uniqueWarriors.map((w) => (
                <div
                  key={w.memberId}
                  className="min-h-[40vh] flex items-center justify-center"
                >
                  <div className="text-center px-4 py-8">
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight mb-8">
                      {w.member.firstName} {w.member.lastName}
                    </h2>
                    <div className="text-lg md:text-xl text-white/40">
                      <span>Prayed {timeAgo(w.loggedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty states */}
          {activeSection === "prayers" && requests && requests.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white/30 text-center">
                No prayer requests at this time
              </p>
            </div>
          )}
          {activeSection === "victories" && victoryReports && victoryReports.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white/30 text-center">
                No victory reports at this time
              </p>
            </div>
          )}
          {activeSection === "warriors" && prayerLogs && uniqueWarriors.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white/30 text-center">
                No prayer warriors at this time
              </p>
            </div>
          )}

          {/* Loading / error state */}
          {activeSection === "prayers" && !requests && (
            <p className="text-white/30 text-lg text-center">
              {reqError ? "Reconnecting..." : "Loading..."}
            </p>
          )}
          {activeSection === "victories" && !victoryReports && (
            <p className="text-white/30 text-lg text-center">
              {vicError ? "Reconnecting..." : "Loading..."}
            </p>
          )}
          {activeSection === "warriors" && !prayerLogs && (
            <p className="text-white/30 text-lg text-center">
              {logError ? "Reconnecting..." : "Loading..."}
            </p>
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
