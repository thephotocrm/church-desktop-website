import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

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

export default function KioskPage() {
  const [tab, setTab] = useState<"prayer" | "login" | "victory">("prayer");
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetToHome = useCallback(() => {
    setTab("prayer");
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

  useEffect(() => {
    const events = ["touchstart", "mousedown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, [handleActivity]);

  return (
    <div
      className="fixed inset-0 bg-gray-950 text-white flex flex-col overflow-hidden select-none"
      onTouchStart={handleActivity}
      onMouseDown={handleActivity}
    >
      {/* Tab Header */}
      <div className="flex gap-2 p-4 justify-center bg-gray-900/80 border-b border-white/10">
        {([
          ["prayer", "Prayer Request"],
          ["login", "Prayer Login"],
          ["victory", "Victory Report"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); handleActivity(); }}
            className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
              tab === key
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        {tab === "prayer" && <PrayerRequestForm />}
        {tab === "login" && <PrayerLoginSection />}
        {tab === "victory" && <VictoryReportForm />}
      </div>
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
          <p className="text-gray-400 text-xl">Thank you for sharing your prayer need.</p>
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
              isAnonymous ? "bg-amber-500" : "bg-gray-700"
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
          className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      )}

      <input
        type="text"
        placeholder="Prayer request title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <textarea
        placeholder="Describe your prayer need..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />

      <button
        onClick={() => submit.mutate()}
        disabled={!title || !body || (!isAnonymous && !name) || submit.isPending}
        className="w-full py-5 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20"
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
  });

  const { data: prayerLogs } = useQuery<PrayerLog[]>({
    queryKey: ["/api/prayer-logs"],
    queryFn: async () => {
      const res = await fetch("/api/prayer-logs");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
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
      }
    },
  });

  const filtered = members?.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q);
  });

  // Deduplicate prayer warriors by memberId
  const uniqueWarriors = prayerLogs
    ? Array.from(new Map(prayerLogs.map((l) => [l.memberId, l])).values())
    : [];

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">✨</div>
          <h2 className="text-3xl font-light">
            {success === "already" ? "You're already checked in!" : `Thank you, ${success}!`}
          </h2>
          <p className="text-gray-400 text-xl">
            {success === "already" ? "Come back later to check in again." : "You've joined the prayer warriors."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center mb-2">Tap Your Name to Join in Prayer</h2>

      <input
        type="text"
        placeholder="Search names..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-2">
        {filtered?.map((m) => (
          <button
            key={m.id}
            onClick={() => checkin.mutate(m.id)}
            disabled={checkin.isPending}
            className="px-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg font-medium hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95"
          >
            {m.firstName} {m.lastName}
          </button>
        ))}
        {filtered?.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No members found</p>
        )}
      </div>

      {/* Prayer Warriors Today */}
      {uniqueWarriors.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-xl font-semibold mb-4 text-amber-400">Prayer Warriors Today</h3>
          <div className="flex flex-wrap gap-3">
            {uniqueWarriors.map((l) => (
              <span
                key={l.id}
                className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-base"
              >
                {l.member.firstName} {l.member.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
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
          <p className="text-gray-400 text-xl">Thank you for sharing your testimony.</p>
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
              isAnonymous ? "bg-amber-500" : "bg-gray-700"
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
          className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      )}

      <input
        type="text"
        placeholder="Victory title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <textarea
        placeholder="Share your victory or testimony..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        className="w-full px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />

      <button
        onClick={() => submit.mutate()}
        disabled={!title || !body || (!isAnonymous && !name) || submit.isPending}
        className="w-full py-5 rounded-xl bg-amber-500 text-black text-xl font-bold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20"
      >
        {submit.isPending ? "Submitting..." : "Submit Victory Report"}
      </button>
    </div>
  );
}
