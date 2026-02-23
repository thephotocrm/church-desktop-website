import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GivingForm } from "@/components/giving-form";
import { SavedPaymentMethods } from "@/components/saved-payment-methods";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, BookOpen, HandHeart, Gift, Smartphone, Building2, CheckCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";

const C = {
  INK: "#1A1714",
  INK2: "#231E1A",
  GOLD: "#C9943A",
  GOLD_LIGHT: "#E8B860",
  GOLD_DIM: "rgba(201,148,58,0.18)",
  WARM_GRAY: "#8C8078",
  BORDER: "rgba(255,255,255,0.07)",
  MUTED: "rgba(255,255,255,0.35)",
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const bgStyle: React.CSSProperties = {
  background: `
    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,148,58,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 100%, rgba(168,116,31,0.08) 0%, transparent 60%),
    ${C.INK}
  `,
};

export default function Give() {
  useSEO({ title: "Give Online", description: "Support the mission of First Pentecostal Church of Dallas. Give online securely and make an eternal impact." });
  const [location] = useLocation();
  const { member, exchangeCode } = useMemberAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialValues] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      amount: p.get("amount") || undefined,
      fund: p.get("fund") || undefined,
      type: p.get("type") || undefined,
      frequency: p.get("frequency") || undefined,
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");
    if (code && !member) {
      exchangeCode(code).catch(() => {}).finally(() => {
        window.history.replaceState({}, "", "/give");
      });
      return;
    }

    if (params.get("success") === "true") {
      setShowSuccess(true);
      toast({ title: "Thank you for your generous donation!" });
      window.history.replaceState({}, "", "/give");
    }
    if (params.get("canceled") === "true") {
      toast({ title: "Donation canceled", variant: "destructive" });
      window.history.replaceState({}, "", "/give");
    }
  }, []);

  return (
    <div className="min-h-screen pt-24" style={bgStyle}>
      {/* Success Banner */}
      {showSuccess && (
        <div style={{ background: "rgba(34,197,94,0.08)", borderBottom: `1px solid rgba(34,197,94,0.15)` }}>
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: "#4ade80" }} />
            <p className="font-['Open_Sans'] font-semibold text-sm" style={{ color: "#4ade80" }}>
              Thank you for your generous donation! Your giving makes a difference.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center pt-4 pb-2 px-4">
        <p
          className="font-['Open_Sans'] text-[10px] font-bold uppercase tracking-[2.5px] mb-2"
          style={{ color: C.GOLD }}
        >
          FPC DALLAS
        </p>
        <h1 className="font-['Playfair_Display'] text-2xl md:text-4xl font-bold text-white">
          Give Online
        </h1>
        <p className="font-['Open_Sans'] text-sm mt-3 max-w-md mx-auto" style={{ color: C.MUTED }}>
          Your generosity fuels the mission of God and transforms lives.
        </p>
      </div>

      {/* Giving Form Section */}
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div variants={fadeUp}>
                <GivingForm initialValues={initialValues} />
              </motion.div>
              <motion.div variants={fadeUp} className="space-y-6">
                <SavedPaymentMethods />
                {/* Other giving methods */}
                <div
                  className="rounded-[20px] p-6"
                  style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
                >
                  <h3
                    className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[1.5px] mb-5"
                    style={{ color: C.WARM_GRAY }}
                  >
                    Other Ways to Give
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: C.GOLD_DIM }}
                      >
                        <Smartphone className="w-4 h-4" style={{ color: C.GOLD }} />
                      </div>
                      <div>
                        <p className="text-white font-['Open_Sans'] text-[14px] font-medium">Text to Give</p>
                        <p className="font-['Open_Sans'] text-[12px]" style={{ color: C.MUTED }}>
                          Text 'GIVE' to (214) 555-GIVE
                        </p>
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.BORDER}` }} />
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: C.GOLD_DIM }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: C.GOLD }} />
                      </div>
                      <div>
                        <p className="text-white font-['Open_Sans'] text-[14px] font-medium">In Person</p>
                        <p className="font-['Open_Sans'] text-[12px]" style={{ color: C.MUTED }}>
                          Drop in the offering box at any service
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {member && (
                  <Link href="/giving-history">
                    <button
                      className="w-full py-3 rounded-[16px] font-['Open_Sans'] text-[14px] font-semibold transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: `1px solid ${C.BORDER}`,
                        color: C.GOLD,
                      }}
                    >
                      View Donation History
                    </button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p
                className="font-['Open_Sans'] text-[11px] font-semibold uppercase tracking-[2px] mb-2"
                style={{ color: C.GOLD }}
              >
                Your Impact
              </p>
              <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-white">
                Where Your Giving Goes
              </h2>
              <div className="w-12 h-[2px] mx-auto mt-4 rounded-full" style={{ background: C.GOLD }} />
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Heart, title: "Community Outreach", desc: "Feeding families, supporting shelters, and meeting needs locally.", pct: "30%" },
                { icon: BookOpen, title: "Ministry & Teaching", desc: "Bible studies, discipleship, and Sunday school materials.", pct: "25%" },
                { icon: HandHeart, title: "Missions", desc: "Supporting missionaries and gospel outreach worldwide.", pct: "20%" },
                { icon: Gift, title: "Operations", desc: "Maintaining facilities and supporting staff and programs.", pct: "25%" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div
                    className="rounded-[20px] p-5 text-center h-full"
                    style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: C.GOLD_DIM }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: C.GOLD }} />
                    </div>
                    <p className="font-['Playfair_Display'] text-2xl font-bold mb-1" style={{ color: C.GOLD }}>{item.pct}</p>
                    <h3 className="text-white font-['Open_Sans'] text-[13px] font-bold mb-1">{item.title}</h3>
                    <p className="font-['Open_Sans'] text-[11px] leading-relaxed" style={{ color: C.MUTED }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scripture */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: C.GOLD_DIM }}
              >
                <BookOpen className="w-6 h-6" style={{ color: C.GOLD }} />
              </div>
              <blockquote className="font-['Playfair_Display'] text-lg md:text-xl font-bold leading-relaxed italic text-white mb-6">
                "Give, and it shall be given unto you; good measure, pressed down,
                and shaken together, and running over, shall men give into your
                bosom."
              </blockquote>
              <p className="font-['Open_Sans'] text-sm font-semibold" style={{ color: C.GOLD }}>
                Luke 6:38 KJV
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
