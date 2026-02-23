import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, Lock, Loader2, Heart } from "lucide-react";

interface FundCategory {
  id: string;
  name: string;
  description: string | null;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

// Mobile app color palette
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

export default function GiveConfirm() {
  const [, navigate] = useLocation();
  const { member, exchangeCode, isLoading: authLoading } = useMemberAuth();
  const { toast } = useToast();

  const [params] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      amount: p.get("amount") || "",
      fund: p.get("fund") || "",
      type: p.get("type") || "one_time",
      frequency: p.get("frequency") || "monthly",
      code: p.get("code") || "",
      success: p.get("success") === "true",
      canceled: p.get("canceled") === "true",
    };
  });

  const [exchangingCode, setExchangingCode] = useState(!!params.code);
  const [fundId, setFundId] = useState("");
  const [loading, setLoading] = useState(false);
  const [chargingCard, setChargingCard] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(params.success);

  // Read saved params from sessionStorage on success return
  const [savedParams] = useState(() => {
    if (params.success) {
      try {
        const stored = sessionStorage.getItem("giveConfirmParams");
        if (stored) {
          sessionStorage.removeItem("giveConfirmParams");
          return JSON.parse(stored) as { amount: string; fund: string; type: string; frequency: string };
        }
      } catch {}
    }
    return null;
  });

  const displayAmount = savedParams?.amount || params.amount;
  const displayFund = savedParams?.fund || params.fund;
  const displayType = savedParams?.type || params.type;
  const displayFrequency = savedParams?.frequency || params.frequency;

  // Redirect if missing required params (unless returning from Stripe)
  useEffect(() => {
    if (!params.success && !params.canceled && (!params.amount || !params.fund)) {
      navigate("/give");
    }
  }, []);

  // Handle canceled return
  useEffect(() => {
    if (params.canceled) {
      toast({ title: "Donation canceled", variant: "destructive" });
      const stored = sessionStorage.getItem("giveConfirmParams");
      if (stored) {
        const restored = JSON.parse(stored);
        const retryParams = new URLSearchParams(restored);
        navigate(`/give/confirm?${retryParams.toString()}`);
      } else {
        navigate("/give");
      }
    }
  }, []);

  // Clean URL after reading params
  useEffect(() => {
    if (params.success) {
      window.history.replaceState({}, "", "/give/confirm");
    }
  }, []);

  // Exchange auth code from mobile app
  useEffect(() => {
    if (params.code && !member) {
      exchangeCode(params.code)
        .catch(() => {})
        .finally(() => {
          setExchangingCode(false);
          const clean = new URLSearchParams(window.location.search);
          clean.delete("code");
          window.history.replaceState({}, "", `/give/confirm?${clean.toString()}`);
        });
    } else {
      setExchangingCode(false);
    }
  }, []);

  // Resolve fund name to ID
  const { data: funds } = useQuery<FundCategory[]>({
    queryKey: ["/api/giving/funds"],
  });

  useEffect(() => {
    if (params.fund && funds?.length && !fundId) {
      const match = funds.find(
        (f) => f.name.toLowerCase() === params.fund.toLowerCase()
      );
      if (match) setFundId(match.id);
    }
  }, [funds, params.fund]);

  // Fetch saved payment methods
  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/giving/payment-methods"],
    enabled: !!member,
  });

  const amountNum = parseFloat(params.amount);
  const amountCents = Math.round(amountNum * 100);
  const isRecurring = displayType === "recurring";

  // Format amount parts for split display
  const amountWhole = Math.floor(amountNum || 0).toString();
  const amountDecimal = ".00";

  // Charge saved card (one-time only)
  const handleChargeSaved = async (paymentMethodId: string) => {
    if (!fundId) {
      toast({ title: "Fund not found. Please try Stripe Checkout instead.", variant: "destructive" });
      return;
    }
    setChargingCard(paymentMethodId);
    try {
      await apiRequest("POST", "/api/giving/charge-saved", {
        paymentMethodId,
        amountCents,
        fundCategoryId: fundId,
      });
      setShowSuccess(true);
    } catch (err: any) {
      const msg = err.message || "Payment failed";
      if (msg.includes("requires_action") || msg.includes("3D Secure")) {
        toast({ title: "This card requires additional verification. Please use Stripe Checkout instead.", variant: "destructive" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    } finally {
      setChargingCard(null);
    }
  };

  // Stripe Checkout
  const handleCheckout = async () => {
    if (!fundId) {
      toast({ title: "Fund not found. Please wait or try again.", variant: "destructive" });
      return;
    }
    setLoading(true);

    sessionStorage.setItem(
      "giveConfirmParams",
      JSON.stringify({ amount: params.amount, fund: params.fund, type: params.type, frequency: params.frequency })
    );

    try {
      const origin = window.location.origin;
      const res = await apiRequest("POST", "/api/giving/checkout-session", {
        amountCents,
        fundCategoryId: fundId,
        type: isRecurring ? "recurring" : "one_time",
        frequency: isRecurring ? params.frequency : undefined,
        successUrl: `${origin}/give/confirm?success=true`,
        cancelUrl: `${origin}/give/confirm?canceled=true`,
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to create payment session", variant: "destructive" });
      setLoading(false);
    }
  };

  // Build "Edit details" link
  const editLink = `/give?${new URLSearchParams({
    amount: params.amount,
    fund: params.fund,
    type: params.type,
    frequency: params.frequency,
  }).toString()}`;

  const isPageLoading = exchangingCode || authLoading;

  const showSavedCards = !isRecurring && paymentMethods && paymentMethods.length > 0;

  // Shared background with ambient glow
  const bgStyle: React.CSSProperties = {
    background: `
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,148,58,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 100%, rgba(168,116,31,0.08) 0%, transparent 60%),
      ${C.INK}
    `,
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-24" style={bgStyle}>
        <div className="text-center max-w-md mx-auto">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: C.GOLD_DIM }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: C.GOLD }} />
          </div>
          <p
            className="font-['Open_Sans'] text-[10px] font-bold uppercase tracking-[2.5px] mb-2"
            style={{ color: C.GOLD }}
          >
            FPC DALLAS
          </p>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white mb-3">
            Thank You!
          </h1>
          <p className="font-['Open_Sans'] text-sm mb-8" style={{ color: C.MUTED }}>
            Your generous gift has been received.
          </p>
          {(displayAmount || displayFund) && (
            <div
              className="rounded-[20px] p-6 mb-6"
              style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
            >
              {displayAmount && (
                <div className="flex items-baseline justify-center">
                  <span className="font-['Playfair_Display'] text-[30px]" style={{ color: C.GOLD }}>$</span>
                  <span className="font-['Playfair_Display'] text-[52px] font-bold text-white leading-none">
                    {Math.floor(parseFloat(displayAmount))}
                  </span>
                  <span className="font-['Playfair_Display'] text-[30px]" style={{ color: C.MUTED }}>.00</span>
                </div>
              )}
              {displayFund && (
                <p className="font-['Open_Sans'] text-sm mt-3" style={{ color: C.WARM_GRAY }}>{displayFund}</p>
              )}
              {displayType === "recurring" && (
                <p className="font-['Open_Sans'] text-xs mt-1 capitalize" style={{ color: C.MUTED }}>
                  {displayFrequency} recurring
                </p>
              )}
            </div>
          )}
          <p className="font-['Open_Sans'] text-sm" style={{ color: C.MUTED }}>You may close this window.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24" style={bgStyle}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: C.GOLD }} />
          <p className="font-['Open_Sans'] text-sm" style={{ color: C.MUTED }}>Preparing your gift...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-8" style={bgStyle}>
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="text-center pt-6 pb-2">
          <p
            className="font-['Open_Sans'] text-[10px] font-bold uppercase tracking-[2.5px] mb-2"
            style={{ color: C.GOLD }}
          >
            FPC DALLAS
          </p>
          <h1 className="font-['Playfair_Display'] text-[18px] font-bold text-white">
            Confirm Your Gift
          </h1>
        </div>

        {/* Amount display */}
        <div className="text-center pt-10 pb-8">
          <p
            className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[2px] mb-4"
            style={{ color: C.MUTED }}
          >
            YOUR GIFT
          </p>
          <div className="flex items-baseline justify-center">
            <span
              className="font-['Playfair_Display'] text-[30px] font-normal"
              style={{ color: C.GOLD }}
            >
              $
            </span>
            <span className="font-['Playfair_Display'] text-[68px] font-bold text-white leading-none">
              {amountWhole}
            </span>
            <span
              className="font-['Playfair_Display'] text-[30px] font-normal"
              style={{ color: C.MUTED }}
            >
              {amountDecimal}
            </span>
          </div>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          <span
            className="font-['Open_Sans'] text-[12px] font-semibold px-4 py-[7px] rounded-full"
            style={{
              background: C.GOLD_DIM,
              border: `1px solid ${C.GOLD}`,
              color: C.GOLD_LIGHT,
            }}
          >
            {params.fund}
          </span>
          <span
            className="font-['Open_Sans'] text-[12px] font-semibold px-4 py-[7px] rounded-full capitalize"
            style={{
              background: C.GOLD_DIM,
              border: `1px solid ${C.GOLD}`,
              color: C.GOLD_LIGHT,
            }}
          >
            {isRecurring ? `${params.frequency} recurring` : "One-time"}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-6 my-7" style={{ borderTop: `1px solid ${C.BORDER}` }} />

        {/* Saved cards (one-time only) */}
        {showSavedCards && (
          <>
            <div
              className="rounded-[20px] px-5 py-[18px] mb-4"
              style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
            >
              <p
                className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[1.5px] mb-4"
                style={{ color: C.WARM_GRAY }}
              >
                Saved Cards
              </p>
              <div className="space-y-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleChargeSaved(m.id)}
                    disabled={!!chargingCard}
                    className="w-full flex items-center justify-between py-3 transition-opacity disabled:opacity-50"
                    style={{ borderBottom: `1px solid ${C.BORDER}` }}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" style={{ color: C.GOLD }} />
                      <span className="text-white font-['Open_Sans'] text-[14px] capitalize">
                        {m.brand} •••• {m.last4}
                      </span>
                    </div>
                    {chargingCard === m.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.GOLD }} />
                    ) : (
                      <span
                        className="font-['Open_Sans'] text-[13px] font-semibold"
                        style={{ color: C.GOLD }}
                      >
                        Pay
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* "or" divider */}
            <div className="flex items-center gap-3 my-5 mx-2">
              <div className="flex-1" style={{ borderTop: `1px solid ${C.BORDER}` }} />
              <span
                className="font-['Open_Sans'] text-[10px] uppercase tracking-[1.5px]"
                style={{ color: C.WARM_GRAY }}
              >
                or
              </span>
              <div className="flex-1" style={{ borderTop: `1px solid ${C.BORDER}` }} />
            </div>
          </>
        )}

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || !fundId}
          className="w-full py-5 rounded-[22px] font-['Open_Sans'] text-[17px] font-bold flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #D4A04A, #A8741F)",
            color: C.INK,
            boxShadow: "0 8px 24px rgba(168,116,31,0.45)",
          }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Heart className="w-5 h-5" />
              Proceed to Checkout
            </>
          )}
        </button>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span
              className="font-['Open_Sans'] text-[11px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Encrypted & secure
            </span>
          </div>
          <a
            href={editLink}
            className="font-['Open_Sans'] text-[11.5px] font-semibold hover:underline"
            style={{ color: C.GOLD }}
          >
            Edit details →
          </a>
        </div>
      </div>
    </div>
  );
}
