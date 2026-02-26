import { useQuery } from "@tanstack/react-query";

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

export default function PrayerDisplay() {
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
  const scrollDuration = Math.max(count * 8, 30);

  const warriorNames = uniqueWarriors.map((l) => l.member.firstName).join("   •   ");

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col cursor-none select-none overflow-hidden">
      <style>{`
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Header */}
      <div className="pt-10 pb-4 text-center">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white/60">
          Prayer Requests
        </h1>
      </div>

      {/* Content — Vertical Scrolling */}
      <div className="flex-1 overflow-hidden px-8 md:px-16 lg:px-32">
        {!requests ? (
          <p className="text-white/30 text-lg text-center mt-20">Loading...</p>
        ) : count === 0 ? (
          <p className="text-white/30 text-lg text-center mt-20">No prayer requests this week</p>
        ) : (
          <div
            className="flex flex-col"
            style={{
              animation: `scroll-up ${scrollDuration}s linear infinite`,
            }}
          >
            {/* Render list twice for seamless loop */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex flex-col">
                {requests.map((req) => (
                  <div
                    key={`${copy}-${req.id}`}
                    className="max-w-3xl mx-auto w-full text-center space-y-4 py-10"
                  >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight">
                      {req.title}
                    </h2>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed">
                      {req.body}
                    </p>
                    <div className="text-sm text-white/40 space-x-6">
                      <span>
                        {req.prayerCount ?? 0} {req.prayerCount === 1 ? "person" : "people"} praying
                      </span>
                      <span>{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prayer Warriors — Horizontal Marquee */}
      {uniqueWarriors.length > 0 && (
        <div className="pb-8 px-8">
          <p className="text-white/40 text-sm tracking-widest uppercase mb-2 text-center">
            Joining in prayer today
          </p>
          <div className="overflow-hidden">
            <div
              className="whitespace-nowrap text-white/60 text-base"
              style={{
                animation: `marquee ${Math.max(uniqueWarriors.length * 3, 15)}s linear infinite`,
              }}
            >
              <span>{warriorNames}   •   </span>
              <span>{warriorNames}   •   </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
