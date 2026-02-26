import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

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
const ITEM_DISPLAY_SECONDS = 6;
const WARRIORS_HOLD_SECONDS = 10;

export default function PrayerDisplay() {
  const [activeSection, setActiveSection] = useState<Section>("prayers");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

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

  // Advance to next section
  const advanceSection = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setActiveSection((prev) => getNextSection(prev));
      setCurrentIndex(0);
      setVisible(true);
    }, 700);
  }, [getNextSection]);

  // Item cycling within a section
  useEffect(() => {
    const count = getItemCount(activeSection);
    if (count === 0) {
      advanceSection();
      return;
    }

    // Warriors show all at once — hold then advance
    if (activeSection === "warriors") {
      const timer = setTimeout(advanceSection, WARRIORS_HOLD_SECONDS * 1000);
      return () => clearTimeout(timer);
    }

    // For prayers/victories, advance items one at a time
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= count) {
          advanceSection();
          return prev;
        }
        // Fade out briefly then show next
        setVisible(false);
        setTimeout(() => setVisible(true), 300);
        return next;
      });
    }, ITEM_DISPLAY_SECONDS * 1000);

    return () => clearInterval(timer);
  }, [activeSection, getItemCount, advanceSection]);

  // Reset index when section changes
  useEffect(() => {
    setCurrentIndex(0);
    setVisible(true);
  }, [activeSection]);

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

  const currentPrayer = requests?.[currentIndex];
  const currentVictory = victoryReports?.[currentIndex];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none overflow-hidden">
      {/* Header */}
      <div className="pt-10 pb-4 text-center">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white/60">
          {sectionTitle}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-32">
        <div
          className="w-full transition-opacity duration-700"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {/* Prayer Requests */}
          {activeSection === "prayers" && currentPrayer && (
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
                {currentPrayer.title}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed">
                {currentPrayer.body}
              </p>
              <div className="text-sm text-white/40 space-x-6">
                <span>
                  {currentPrayer.prayerCount ?? 0}{" "}
                  {currentPrayer.prayerCount === 1 ? "person" : "people"} praying
                </span>
                <span>{timeAgo(currentPrayer.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Victory Reports */}
          {activeSection === "victories" && currentVictory && (
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
                {currentVictory.title}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed">
                {currentVictory.body}
              </p>
              <div className="text-sm text-white/40 space-x-6">
                {currentVictory.authorName && (
                  <span>— {currentVictory.authorName}</span>
                )}
                <span>{timeAgo(currentVictory.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Prayer Warriors */}
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
      <div className="pb-8 flex justify-center gap-2">
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
