import { useQuery } from "@tanstack/react-query";
import { PrayerRequestCard } from "@/components/prayer-request-card";
import { PrayerRequestForm } from "@/components/prayer-request-form";
import { motion } from "framer-motion";
import { HandHeart } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

interface PrayerRequest {
  id: string;
  title: string;
  body: string;
  authorName: string | null;
  isAnonymous: boolean | null;
  prayerCount: number | null;
  status: string;
  createdAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function Prayer() {
  useSEO({ title: "Prayer Wall", description: "Submit and pray for prayer requests at First Pentecostal Church of Dallas" });

  const { data: requests, isLoading } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/prayer-requests"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/bible-podium.png" alt="Prayer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-3xl mx-auto px-4"
        >
          <motion.span variants={fadeUp} className="text-gold font-body text-sm font-semibold uppercase tracking-widest">
            Lifting Each Other Up
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mt-3 text-shadow-lg">
            Prayer Wall
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/80 font-body text-lg mt-4">
            Share your prayer needs and join us in interceding for one another.
          </motion.p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prayer request form */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24">
              <PrayerRequestForm />
            </div>
          </div>

          {/* Prayer request list */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-5 animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : requests && requests.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="space-y-4"
              >
                {requests.map((req) => (
                  <motion.div key={req.id} variants={fadeUp}>
                    <PrayerRequestCard {...req} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <HandHeart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-semibold mb-1">No prayer requests yet</p>
                <p className="text-muted-foreground font-body">
                  Be the first to share a prayer request with our community.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
