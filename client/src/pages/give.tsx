import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GivingForm } from "@/components/giving-form";
import { SavedPaymentMethods } from "@/components/saved-payment-methods";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, BookOpen, HandHeart, Gift, Smartphone, Building2, CheckCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Give() {
  useSEO({ title: "Give Online", description: "Support the mission of First Pentecostal Church of Dallas. Give online securely and make an eternal impact." });
  const [location] = useLocation();
  const { member, exchangeCode } = useMemberAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Exchange one-time auth code from mobile app
    const code = params.get("code");
    if (code && !member) {
      exchangeCode(code).catch(() => {
        // Code invalid/expired — user can still give as guest
      }).finally(() => {
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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/cross-glow.png" alt="Cross" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Generosity Changes Everything
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Give Online
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Your generosity fuels the mission of God and transforms lives in our community and beyond.
          </motion.p>
        </motion.div>
      </section>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-green-500/10 border-b border-green-500/20">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 dark:text-green-400 font-semibold">
              Thank you for your generous donation! Your giving makes a difference.
            </p>
          </div>
        </div>
      )}

      {/* Giving Form Section */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Give Securely</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Support Our <span className="text-gold">Mission</span>
              </h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div variants={fadeUp}>
                <GivingForm />
              </motion.div>
              <motion.div variants={fadeUp} className="space-y-6">
                <SavedPaymentMethods />
                {/* Other giving methods */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Other Ways to Give</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Smartphone className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium">Text to Give</p>
                        <p className="text-muted-foreground text-xs">Text 'GIVE' to (214) 555-GIVE</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium">In Person</p>
                        <p className="text-muted-foreground text-xs">Drop in the offering box at any service</p>
                      </div>
                    </div>
                  </div>
                </Card>
                {member && (
                  <Link href="/giving-history">
                    <Button variant="outline" className="w-full font-body">
                      View Donation History
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Your Impact</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Where Your <span className="text-gold">Giving Goes</span>
              </h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Heart, title: "Community Outreach", desc: "Feeding families, supporting shelters, and meeting needs in our local community.", pct: "30%" },
                { icon: BookOpen, title: "Ministry & Teaching", desc: "Bible studies, discipleship programs, and Sunday school materials.", pct: "25%" },
                { icon: HandHeart, title: "Missions", desc: "Supporting missionaries and gospel outreach around the world.", pct: "20%" },
                { icon: Gift, title: "Operations", desc: "Maintaining our facilities and supporting our staff and programs.", pct: "25%" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 text-center h-full hover-elevate">
                    <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-gold font-body mb-2">{item.pct}</p>
                    <h3 className="text-base font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scripture */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <BookOpen className="w-10 h-10 text-gold mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl font-bold leading-relaxed italic mb-6">
                "Give, and it shall be given unto you; good measure, pressed down,
                and shaken together, and running over, shall men give into your
                bosom. For with the same measure that ye mete withal it shall be
                measured to you again."
              </blockquote>
              <p className="text-gold font-body text-lg font-semibold">Luke 6:38 KJV</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
