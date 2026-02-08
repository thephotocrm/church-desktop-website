import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, BookOpen, Users, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import type { Leader } from "@shared/schema";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function LeaderSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-72 w-full" />
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-28 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

export default function Leadership() {
  useSEO({ title: "Our Leadership", description: "Meet the dedicated pastors and leaders who shepherd the congregation at First Pentecostal Church of Dallas." });

  const { data: leaders, isLoading } = useQuery<Leader[]>({
    queryKey: ["/api/leaders"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-leadership-hero">
        <div className="absolute inset-0">
          <img src="/images/hero-sanctuary.png" alt="Sanctuary" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Our Team
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Church Leadership
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Meet the dedicated leaders who shepherd our congregation with love and integrity
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-leaders">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Servant Leaders</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Led by <span className="text-gold">God's Calling</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto">
                Our leadership team is committed to serving God and this congregation
                with humility, wisdom, and a deep love for His people.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <LeaderSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {leaders && leaders.length > 0 && (
                  <div className="mb-16">
                    <motion.div variants={fadeUp} className="max-w-4xl mx-auto">
                      <Card className="overflow-hidden" data-testid={`card-leader-${leaders[0].id}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="h-80 md:h-full">
                            <img
                              src={leaders[0].imageUrl || "/images/pastor-main.png"}
                              alt={leaders[0].name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="p-8 md:p-10 flex flex-col justify-center">
                            <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest mb-2">
                              {leaders[0].title}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">{leaders[0].name}</h3>
                            <p className="text-muted-foreground font-body leading-relaxed">
                              {leaders[0].bio}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {leaders?.slice(1).map((leader) => (
                    <motion.div key={leader.id} variants={fadeUp}>
                      <Card className="overflow-hidden hover-elevate" data-testid={`card-leader-${leader.id}`}>
                        <div className="h-72 overflow-hidden">
                          <img
                            src={leader.imageUrl || "/images/pastor-main.png"}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-bold mb-1">{leader.name}</h3>
                          <p className="text-gold font-body text-sm font-semibold mb-3">{leader.title}</p>
                          <p className="text-muted-foreground font-body text-sm leading-relaxed line-clamp-3">
                            {leader.bio}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-leadership-philosophy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">How We Lead</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Our Leadership <span className="text-gold">Philosophy</span>
              </h2>
              <p className="text-muted-foreground font-body mt-4 max-w-2xl mx-auto leading-relaxed">
                Biblical leadership is not about authority — it's about service. Our leaders follow
                the example of Christ, who came not to be served, but to serve.
              </p>
              <div className="w-16 h-1 bg-gold mx-auto mt-6 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: "Shepherding Hearts",
                  description:
                    "Our leaders are committed to caring for every member of our congregation, providing spiritual guidance, prayer support, and genuine pastoral care.",
                },
                {
                  icon: BookOpen,
                  title: "Biblical Accountability",
                  description:
                    "We hold ourselves accountable to the Word of God and to one another, maintaining integrity and transparency in all areas of ministry and leadership.",
                },
                {
                  icon: Users,
                  title: "Equipping the Saints",
                  description:
                    "We believe in raising up the next generation of leaders by mentoring, teaching, and empowering every believer to fulfill their God-given purpose.",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 md:p-8 h-full hover-elevate text-center" data-testid={`card-philosophy-${i}`}>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
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

      <section className="py-16 bg-navy" data-testid="section-leadership-verse">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.blockquote variants={fadeUp} className="text-xl md:text-2xl text-white leading-relaxed italic mb-6">
              "And I will give you pastors according to mine heart, which shall
              feed you with knowledge and understanding."
            </motion.blockquote>
            <motion.p variants={fadeUp} className="text-gold font-body text-lg font-semibold">
              Jeremiah 3:15 KJV
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-leadership-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Connect With Our <span className="text-gold">Pastors</span>
              </h2>
              <p className="text-muted-foreground font-body mb-8 max-w-xl mx-auto">
                Our pastors are here for you. Whether you need prayer, counseling, or simply
                want to say hello, we'd love to hear from you.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-leadership-connect">
                  Reach Out Today
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
