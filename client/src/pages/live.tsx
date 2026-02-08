import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Clock, Calendar, Radio, Bell, ArrowRight } from "lucide-react";
import { SiFacebook, SiYoutube } from "react-icons/si";
import { useSEO } from "@/hooks/use-seo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LiveStream() {
  useSEO({ title: "Live Stream", description: "Watch First Pentecostal Church of Dallas services live online. Join us for worship from anywhere in the world." });

  return (
    <div className="min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden" data-testid="section-live-hero">
        <div className="absolute inset-0">
          <img src="/images/hero-worship.png" alt="Live worship" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 backdrop-blur-sm border border-red-500/30 text-white font-body text-sm">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              Live Every Sunday
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mt-3 text-shadow-lg">
            Watch Live
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Can't make it in person? Join us online for Spirit-filled worship and the Word of God.
          </motion.p>
        </motion.div>
      </section>

      <section className="py-20 bg-background" data-testid="section-live-player">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Live Stream</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Join Our <span className="text-gold">Service</span>
              </h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-navy flex items-center justify-center">
                  <img
                    src="/images/hero-sanctuary.png"
                    alt="Live stream placeholder"
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mb-6 backdrop-blur-sm border border-gold/30">
                      <Play className="w-10 h-10 text-gold ml-1" />
                    </div>
                    <h3 className="text-white text-xl md:text-2xl font-bold mb-2 text-shadow">
                      Live Stream Starting Soon
                    </h3>
                    <p className="text-white/70 font-body text-sm mb-6">
                      Our next service will be streamed live
                    </p>
                    <div className="flex gap-3">
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                        <Button className="bg-red-600 text-white border-red-600 font-body" data-testid="button-youtube-live">
                          <SiYoutube className="w-4 h-4 mr-2" />
                          Watch on YouTube
                        </Button>
                      </a>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm font-body" data-testid="button-facebook-live">
                          <SiFacebook className="w-4 h-4 mr-2" />
                          Facebook Live
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-live-schedule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Schedule</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Live Stream <span className="text-gold">Times</span>
              </h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { day: "Sunday Morning", time: "10:00 AM CST", desc: "Worship Service", live: true },
                { day: "Sunday Evening", time: "6:00 PM CST", desc: "Evening Service", live: true },
                { day: "Wednesday", time: "7:00 PM CST", desc: "Bible Study", live: false },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className={`p-6 text-center ${item.live ? "border-gold/30" : ""}`}>
                    <Calendar className="w-8 h-8 text-gold mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-1">{item.day}</h3>
                    <p className="text-2xl font-bold text-gold font-body mb-2">{item.time}</p>
                    <p className="text-muted-foreground font-body text-sm mb-3">{item.desc}</p>
                    {item.live && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-body text-xs font-semibold">
                        <Radio className="w-3 h-3" />
                        Live Streamed
                      </span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-live-how">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">How to Watch</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Three Easy <span className="text-gold">Ways</span>
              </h2>
              <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "YouTube", desc: "Subscribe to our YouTube channel and turn on notifications to never miss a service.", icon: SiYoutube, color: "text-red-500" },
                { step: "02", title: "Facebook", desc: "Follow our Facebook page to watch services live and interact with our community.", icon: SiFacebook, color: "text-blue-500" },
                { step: "03", title: "Right Here", desc: "Bookmark this page and tune in during service times for the live stream embed.", icon: Radio, color: "text-gold" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 text-center h-full hover-elevate">
                    <span className="text-4xl font-bold text-gold/20 font-body">{item.step}</span>
                    <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mx-auto my-4">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy" data-testid="section-live-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Bell className="w-10 h-10 text-gold mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Never Miss a Service
              </h2>
              <p className="text-white/70 font-body mb-8">
                Connect with us to stay updated on service times, special events, and more.
              </p>
              <Link href="/connect">
                <Button size="lg" className="bg-gold text-white border-gold font-body px-8" data-testid="button-live-connect">
                  Stay Connected
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
