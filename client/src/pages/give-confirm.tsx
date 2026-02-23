import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
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

const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#C9943A",
    colorBackground: "#231E1A",
    colorText: "#ffffff",
    colorTextSecondary: "#8C8078",
    borderRadius: "14px",
    fontFamily: "Open Sans, sans-serif",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.07)",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    ".Input:focus": { borderColor: "#C9943A" },
    ".Label": { color: "#8C8078" },
  },
};

// Shared background with ambient glow
const bgStyle: React.CSSProperties = {
  background: `
    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,148,58,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 100%, rgba(168,116,31,0.08) 0%, transparent 60%),
    ${C.INK}
  `,
};

// Inner checkout form component (must be inside <Elements>)
function CheckoutForm({ amount, onSuccess }: { amount: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast({ title: error.message || "Payment failed", variant: "destructive" });
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-5 rounded-[22px] font-['Open_Sans'] text-[17px] font-bold flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50 mt-6"
        style={{
          background: "linear-gradient(135deg, #D4A04A, #A8741F)",
          color: C.INK,
          boxShadow: "0 8px 24px rgba(168,116,31,0.45)",
        }}
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Heart className="w-5 h-5" />
            Give{amount ? ` $${amount}` : ""}
          </>
        )}
      </button>
    </form>
  );
}

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
    };
  });

  const [exchangingCode, setExchangingCode] = useState(!!params.code);
  const [fundId, setFundId] = useState("");
  const [chargingCard, setChargingCard] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Stripe state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  // Redirect if missing required params
  useEffect(() => {
    if (!params.amount || !params.fund) {
      navigate("/give");
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

  // Load Stripe publishable key
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (data.stripePublishableKey) {
          setStripePromise(loadStripe(data.stripePublishableKey));
        }
      } catch {}
    })();
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

  // Create PaymentIntent once we have a fundId
  useEffect(() => {
    if (!fundId || clientSecret) return;

    const amountNum = parseFloat(params.amount);
    if (!amountNum || amountNum < 1) return;

    (async () => {
      try {
        const res = await apiRequest("POST", "/api/giving/create-payment-intent", {
          amountCents: Math.round(amountNum * 100),
          fundCategoryId: fundId,
          type: params.type === "recurring" ? "recurring" : "one_time",
          frequency: params.type === "recurring" ? params.frequency : undefined,
        });
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setIntentError(err.message || "Failed to initialize payment");
        toast({ title: err.message || "Failed to initialize payment", variant: "destructive" });
      }
    })();
  }, [fundId]);

  // Fetch saved payment methods
  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/giving/payment-methods"],
    enabled: !!member,
  });

  const amountNum = parseFloat(params.amount);
  const amountCents = Math.round(amountNum * 100);
  const isRecurring = params.type === "recurring";

  // Format amount parts for split display
  const amountWhole = Math.floor(amountNum || 0).toString();
  const amountDecimal = ".00";

  // Charge saved card (one-time only)
  const handleChargeSaved = async (paymentMethodId: string) => {
    if (!fundId) {
      toast({ title: "Fund not found. Please try the payment form below.", variant: "destructive" });
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
        toast({ title: "This card requires additional verification. Please use the payment form below.", variant: "destructive" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    } finally {
      setChargingCard(null);
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    setShowSuccess(true);
  }, []);

  // Build "Edit details" link
  const editLink = `/give?${new URLSearchParams({
    amount: params.amount,
    fund: params.fund,
    type: params.type,
    frequency: params.frequency,
  }).toString()}`;

  const isPageLoading = exchangingCode || authLoading;

  const showSavedCards = !isRecurring && paymentMethods && paymentMethods.length > 0;

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
          {(params.amount || params.fund) && (
            <div
              className="rounded-[20px] p-6 mb-6"
              style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
            >
              {params.amount && (
                <div className="flex items-baseline justify-center">
                  <span className="font-['Playfair_Display'] text-[30px]" style={{ color: C.GOLD }}>$</span>
                  <span className="font-['Playfair_Display'] text-[52px] font-bold text-white leading-none">
                    {Math.floor(parseFloat(params.amount))}
                  </span>
                  <span className="font-['Playfair_Display'] text-[30px]" style={{ color: C.MUTED }}>.00</span>
                </div>
              )}
              {params.fund && (
                <p className="font-['Open_Sans'] text-sm mt-3" style={{ color: C.WARM_GRAY }}>{params.fund}</p>
              )}
              {isRecurring && (
                <p className="font-['Open_Sans'] text-xs mt-1 capitalize" style={{ color: C.MUTED }}>
                  {params.frequency} recurring
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
                        {m.brand} &bull;&bull;&bull;&bull; {m.last4}
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
                or pay with new card
              </span>
              <div className="flex-1" style={{ borderTop: `1px solid ${C.BORDER}` }} />
            </div>
          </>
        )}

        {/* Inline Payment Element */}
        {intentError ? (
          <div
            className="rounded-[20px] p-6 text-center"
            style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
          >
            <p className="font-['Open_Sans'] text-sm" style={{ color: "rgba(239,68,68,0.9)" }}>
              {intentError}
            </p>
            <button
              onClick={() => navigate("/give")}
              className="mt-4 font-['Open_Sans'] text-[13px] font-semibold hover:underline"
              style={{ color: C.GOLD }}
            >
              Go back
            </button>
          </div>
        ) : !stripePromise || !clientSecret ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.GOLD }} />
            <span className="ml-3 font-['Open_Sans'] text-sm" style={{ color: C.MUTED }}>
              Loading payment form...
            </span>
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: stripeAppearance,
            }}
          >
            <CheckoutForm amount={params.amount} onSuccess={handlePaymentSuccess} />
          </Elements>
        )}

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
            Edit details &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
