import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, HandHeart, BookOpen, Gift, CreditCard, Building2, Smartphone, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Give() {
  useSEO({ title: "Give Online", description: "Support the mission of First Pentecostal Church of Dallas. Give online securely and make an eternal impact." });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-give-hero">
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

      <section className="py-20 bg-background" data-testid="section-give-options">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Ways to Give</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Support Our <span className="text-gold">Mission</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Every gift, no matter the size, makes a difference. Choose the giving method that works best for you.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: CreditCard, title: "Online Giving", desc: "Give securely through our online giving platform. Set up one-time or recurring donations with your debit or credit card.", button: "Give Now", primary: true },
                { icon: Smartphone, title: "Text to Give", desc: "Simply text 'GIVE' followed by your amount to (214) 555-GIVE. Quick, easy, and secure from your phone.", button: "Learn More", primary: false },
                { icon: Building2, title: "In Person", desc: "Drop your tithes and offerings in the offering boxes located at the entrance of our sanctuary during any service.", button: "Visit Us", primary: false },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className={`p-8 text-center h-full flex flex-col ${item.primary ? "border-gold/30" : ""}`}>
                    <div className="w-14 h-14 rounded-md bg-accent flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6 flex-1">{item.desc}</p>
                    {item.primary ? (
                      <Button className="bg-gold text-white border-gold font-body w-full" data-testid="button-give-now">
                        {item.button}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button variant="outline" className="font-body w-full" data-testid={`button-give-${i}`}>
                        {item.button}
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-give-impact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
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
                  <Card className="p-6 text-center h-full hover-elevate" data-testid={`card-impact-${i}`}>
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

      <section className="py-20 bg-background" data-testid="section-give-scripture">
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

      <section className="py-16 bg-navy" data-testid="section-give-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Questions About Giving?
              </h2>
              <p className="text-white/70 font-body mb-8">
                We're here to help. Reach out to our office for any questions about tithes, offerings, or special gifts.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-give-contact">
                  Contact Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
