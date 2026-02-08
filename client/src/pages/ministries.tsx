import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, Heart, MessageCircle, HandHelping } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import type { Ministry } from "@shared/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function MinistrySkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-52 w-full" />
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

export default function Ministries() {
  useSEO({ title: "Ministries", description: "Discover ministries for every age and season of life at First Pentecostal Church of Dallas. Find your place to serve." });

  const { data: ministries, isLoading } = useQuery<Ministry[]>({
    queryKey: ["/api/ministries"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-ministries-hero">
        <div className="absolute inset-0">
          <img src="/images/youth-ministry.png" alt="Ministries" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Get Involved
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Our Ministries
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            From children to seniors, there's a ministry for everyone at FPC Dallas
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-ministries-list">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold">
                Find Your <span className="text-gold">Place</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Every member has gifts, talents, and a calling. Our ministries provide
                opportunities for you to grow, serve, and make an impact.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MinistrySkeleton key={i} />
                ))}
              </div>
            ) : ministries && ministries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ministries.map((ministry) => (
                  <motion.div key={ministry.id} variants={fadeUp}>
                    <Card className="overflow-hidden h-full hover-elevate" data-testid={`card-ministry-${ministry.id}`}>
                      {ministry.imageUrl ? (
                        <div className="h-52 overflow-hidden">
                          <img
                            src={ministry.imageUrl}
                            alt={ministry.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-52 bg-navy flex items-center justify-center">
                          <Users className="w-16 h-16 text-gold/30" />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2">{ministry.name}</h3>
                        <p className="text-muted-foreground font-body text-sm leading-relaxed mb-3">
                          {ministry.description}
                        </p>
                        {ministry.leader && (
                          <p className="text-sm font-body">
                            <span className="text-muted-foreground">Led by </span>
                            <span className="text-gold font-semibold">{ministry.leader}</span>
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Ministries Coming Soon</h3>
                <p className="text-muted-foreground font-body">Check back for ministry information.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-why-we-serve">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp}>
                <div className="rounded-xl overflow-hidden">
                  <img
                    src="/images/community-outreach.png"
                    alt="Church community serving together"
                    className="w-full h-80 object-cover"
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeUp}>
                <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">A Heart for Service</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                  Why We <span className="text-gold">Serve</span>
                </h2>
                <div className="w-16 h-1 bg-gold rounded-full mb-6" />
                <p className="text-muted-foreground font-body leading-relaxed mb-4">
                  At First Pentecostal Church, we believe that every believer is called to serve.
                  Service is not just something we do — it's an expression of God's love flowing
                  through us to bless others.
                </p>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Each ministry exists to meet real needs in our church and community. When you
                  serve, you discover your gifts, build meaningful relationships, and become part
                  of something bigger than yourself.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-how-to-get-involved">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Get Started</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                How to Get <span className="text-gold">Involved</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Not sure where to start? Here's a simple path to finding your place in ministry.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  step: "01",
                  title: "Pray",
                  description:
                    "Ask God to reveal your gifts and the area where He wants you to serve. He has a unique purpose for your life.",
                },
                {
                  icon: MessageCircle,
                  step: "02",
                  title: "Connect",
                  description:
                    "Talk to a pastor or ministry leader about your interests. We'll help you explore options that match your passions and schedule.",
                },
                {
                  icon: HandHelping,
                  step: "03",
                  title: "Serve",
                  description:
                    "Jump in and start serving! There's no experience required — just a willing heart. You'll be trained and supported every step of the way.",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 h-full hover-elevate text-center" data-testid={`card-step-${i}`}>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <span className="text-gold font-body text-xs font-bold uppercase tracking-widest">Step {item.step}</span>
                    <h3 className="text-xl font-bold mt-2 mb-3">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy" data-testid="section-ministries-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to <span className="text-gold">Serve?</span>
              </h2>
              <p className="text-white/70 font-body mb-8">
                We'd love to help you find the right ministry to get connected and start making a difference.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-ministries-connect">
                  Get Connected
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
