import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const CYCLE_MS = 10_000;

export default function PrayerDisplay() {
  const [index, setIndex] = useState(0);

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

  const { data: requests } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/prayer-requests", "display"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-requests?since=7d&status=active&limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const count = requests?.length ?? 0;

  const advance = useCallback(() => {
    setIndex((prev) => (count > 0 ? (prev + 1) % count : 0));
  }, [count]);

  // Reset index when data changes and current index is out of bounds
  useEffect(() => {
    if (count > 0 && index >= count) setIndex(0);
  }, [count, index]);

  // Auto-cycle
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(advance, CYCLE_MS);
    return () => clearInterval(timer);
  }, [count, advance]);

  const current = requests?.[index];

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none overflow-hidden">
      {/* Header */}
      <div className="pt-10 pb-4 text-center">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white/60">
          Prayer Requests
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-32">
        {!requests ? (
          <p className="text-white/30 text-lg">Loading...</p>
        ) : count === 0 ? (
          <p className="text-white/30 text-lg">No prayer requests this week</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl w-full text-center space-y-8"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
                {current?.title}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed">
                {current?.body}
              </p>
              <div className="text-sm text-white/40 space-x-6">
                <span>
                  {current?.prayerCount ?? 0} {current?.prayerCount === 1 ? "person" : "people"} praying
                </span>
                <span>{current?.createdAt ? timeAgo(current.createdAt) : ""}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="pb-4 flex justify-center gap-2">
          {requests?.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === index ? "bg-white" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Prayer Warriors */}
      {uniqueWarriors.length > 0 && (
        <div className="pb-8 text-center px-8">
          <p className="text-white/40 text-sm tracking-widest uppercase mb-2">
            Joining in prayer today
          </p>
          <p className="text-white/60 text-base">
            {uniqueWarriors.map((l) => l.member.firstName).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
