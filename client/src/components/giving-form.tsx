import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowRight, ChevronDown } from "lucide-react";

interface FundCategory {
  id: string;
  name: string;
  description: string | null;
}

const presetAmounts = [10, 25, 50, 100];

const C = {
  INK: "#1A1714",
  INK2: "#231E1A",
  GOLD: "#C9943A",
  GOLD_LIGHT: "#E8B860",
  GOLD_DIM: "rgba(201,148,58,0.18)",
  WARM_GRAY: "#8C8078",
  BORDER: "rgba(255,255,255,0.07)",
  MUTED: "rgba(255,255,255,0.35)",
  MUTED2: "rgba(255,255,255,0.08)",
} as const;

interface GivingFormProps {
  initialValues?: { amount?: string; fund?: string; type?: string; frequency?: string };
}

export function GivingForm({ initialValues }: GivingFormProps) {
  const [, navigate] = useLocation();
  const { member } = useMemberAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState(initialValues?.amount || "");
  const [fundId, setFundId] = useState("");
  const [type, setType] = useState<"one_time" | "recurring">(
    initialValues?.type === "recurring" ? "recurring" : "one_time"
  );
  const [frequency, setFrequency] = useState<"weekly" | "monthly">(
    initialValues?.frequency === "weekly" ? "weekly" : "monthly"
  );

  const { data: funds } = useQuery<FundCategory[]>({
    queryKey: ["/api/giving/funds"],
  });

  useEffect(() => {
    if (initialValues?.fund && funds?.length && !fundId) {
      const match = funds.find(
        (f) => f.name.toLowerCase() === initialValues.fund!.toLowerCase()
      );
      if (match) setFundId(match.id);
    }
  }, [funds, initialValues?.fund]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1) {
      toast({ title: "Please enter a valid amount (minimum $1.00)", variant: "destructive" });
      return;
    }
    if (!fundId) {
      toast({ title: "Please select a fund", variant: "destructive" });
      return;
    }

    const selectedFundName = funds?.find((f) => f.id === fundId)?.name || "";
    const queryParams = new URLSearchParams({
      amount: String(amountNum),
      fund: selectedFundName,
      type,
      ...(type === "recurring" ? { frequency } : {}),
    });
    navigate(`/give/confirm?${queryParams.toString()}`);
  };

  const selectedFund = funds?.find((f) => f.id === fundId);

  return (
    <div
      className="rounded-[20px] p-6"
      style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: C.GOLD_DIM }}
        >
          <Heart className="w-4 h-4" style={{ color: C.GOLD }} />
        </div>
        <h3 className="text-white font-['Open_Sans'] text-[16px] font-bold">Make a Donation</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fund selector */}
        <div className="space-y-2">
          <label
            className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: C.WARM_GRAY }}
          >
            Select Fund
          </label>
          <div className="relative">
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full appearance-none rounded-[14px] px-4 py-3.5 font-['Open_Sans'] text-[14px] text-white outline-none focus:ring-1 transition-colors cursor-pointer"
              style={{
                background: C.MUTED2,
                border: `1px solid ${C.BORDER}`,
                color: fundId ? "white" : C.WARM_GRAY,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.GOLD)}
              onBlur={(e) => (e.target.style.borderColor = C.BORDER)}
            >
              <option value="" disabled>Choose a fund...</option>
              {funds?.map((fund) => (
                <option key={fund.id} value={fund.id} style={{ background: C.INK2, color: "white" }}>
                  {fund.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: C.WARM_GRAY }}
            />
          </div>
        </div>

        {/* Amount presets */}
        <div className="space-y-2">
          <label
            className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: C.WARM_GRAY }}
          >
            Amount
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {presetAmounts.map((preset) => {
              const isActive = amount === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  className="py-2.5 rounded-[12px] font-['Open_Sans'] text-[14px] font-semibold transition-all"
                  style={{
                    background: isActive ? C.GOLD_DIM : C.MUTED2,
                    border: `1px solid ${isActive ? C.GOLD : C.BORDER}`,
                    color: isActive ? C.GOLD_LIGHT : "rgba(255,255,255,0.6)",
                  }}
                  onClick={() => setAmount(String(preset))}
                >
                  ${preset}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 font-['Open_Sans'] text-[14px]"
              style={{ color: C.WARM_GRAY }}
            >
              $
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-[14px] pl-8 pr-4 py-3.5 font-['Open_Sans'] text-[14px] text-white outline-none focus:ring-1 transition-colors placeholder:text-[rgba(255,255,255,0.25)]"
              style={{
                background: C.MUTED2,
                border: `1px solid ${C.BORDER}`,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.GOLD)}
              onBlur={(e) => (e.target.style.borderColor = C.BORDER)}
            />
          </div>
        </div>

        {/* One-time vs Recurring */}
        <div className="space-y-2">
          <label
            className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[1.5px]"
            style={{ color: C.WARM_GRAY }}
          >
            Frequency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["one_time", "recurring"] as const).map((t) => {
              const isActive = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  className="py-3 rounded-[14px] font-['Open_Sans'] text-[13px] font-semibold transition-all"
                  style={{
                    background: isActive ? C.GOLD_DIM : C.MUTED2,
                    border: `1px solid ${isActive ? C.GOLD : C.BORDER}`,
                    color: isActive ? C.GOLD_LIGHT : "rgba(255,255,255,0.5)",
                  }}
                  onClick={() => setType(t)}
                >
                  {t === "one_time" ? "One-Time" : "Recurring"}
                </button>
              );
            })}
          </div>
          {type === "recurring" && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {(["weekly", "monthly"] as const).map((f) => {
                const isActive = frequency === f;
                return (
                  <button
                    key={f}
                    type="button"
                    className="py-2.5 rounded-[12px] font-['Open_Sans'] text-[12px] font-semibold capitalize transition-all"
                    style={{
                      background: isActive ? C.GOLD_DIM : C.MUTED2,
                      border: `1px solid ${isActive ? C.GOLD : C.BORDER}`,
                      color: isActive ? C.GOLD_LIGHT : "rgba(255,255,255,0.5)",
                    }}
                    onClick={() => setFrequency(f)}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!member && (
          <p className="font-['Open_Sans'] text-[12px]" style={{ color: C.MUTED }}>
            <a href="/member-login" className="font-semibold hover:underline" style={{ color: C.GOLD }}>Sign in</a>{" "}
            to save your payment method for future donations.
          </p>
        )}

        {/* CTA */}
        <button
          type="submit"
          className="w-full py-4 rounded-[18px] font-['Open_Sans'] text-[16px] font-bold flex items-center justify-center gap-2.5 transition-opacity"
          style={{
            background: "linear-gradient(135deg, #D4A04A, #A8741F)",
            color: C.INK,
            boxShadow: "0 8px 24px rgba(168,116,31,0.45)",
          }}
        >
          <Heart className="w-5 h-5" />
          Give{amount ? ` $${amount}` : ""}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
