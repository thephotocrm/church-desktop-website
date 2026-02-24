import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Radio, Play, Clock, ArrowRight, ChevronDown, Film } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { useStreamStatus } from "@/components/stream-player";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  r2Url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  status: string;
  streamStartedAt: string | null;
  createdAt: string | null;
}

interface RecordingsResponse {
  items: Recording[];
  total: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PastStreams() {
  useSEO({
    title: "Past Services",
    description: "Watch previous worship services and sermons from First Pentecostal Church of Dallas.",
  });

  const { data: streamStatus } = useStreamStatus();
  const isLive = streamStatus?.isLive ?? false;

  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const limit = 12;

  const { data, isLoading } = useQuery<RecordingsResponse>({
    queryKey: ["/api/recordings", offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      const res = await fetch(`/api/recordings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Merge new items with existing for load-more
  const items = offset > 0 && allItems.length > 0
    ? [...allItems, ...(data?.items || []).filter(i => !allItems.find(a => a.id === i.id))]
    : data?.items || [];

  const total = data?.total || 0;
  const hasMore = items.length < total;

  const handleLoadMore = () => {
    setAllItems(items);
    setOffset(items.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-black/50" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="text-gold font-body text-sm font-semibold uppercase tracking-widest">Archive</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3">
              Past <span className="text-gold">Services</span>
            </h1>
            <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
            <p className="text-white/70 font-body text-lg mt-6 max-w-2xl mx-auto">
              Missed a service? Watch previous worship services, sermons, and Bible studies on demand.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Live Now CTA */}
      {isLive && (
        <section className="py-6 bg-red-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Link href="/live">
              <div className="flex items-center justify-center gap-3 cursor-pointer">
                <Radio className="w-5 h-5 text-white animate-pulse" />
                <span className="text-white font-bold text-lg">We're Live Right Now!</span>
                <Button size="sm" className="bg-white text-red-600 hover:bg-white/90 font-body">
                  Watch Live
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Past Streams Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && items.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-72" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Past Services Yet</h3>
              <p className="text-muted-foreground font-body">
                Recorded services will appear here after they are uploaded.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {items.map((recording) => (
                <motion.div key={recording.id} variants={fadeUp}>
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => setSelectedRecording(recording)}
                  >
                    <div className="relative aspect-video bg-muted">
                      {recording.thumbnailUrl ? (
                        <img
                          src={recording.thumbnailUrl}
                          alt={recording.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {recording.duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white border-0 font-mono text-xs">
                          {formatDuration(recording.duration)}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{recording.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                        {(recording.streamStartedAt || recording.createdAt) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(recording.streamStartedAt || recording.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                className="font-body"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More Services
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Join Us for Worship
          </h2>
          <p className="text-white/70 font-body mb-8">
            Nothing compares to being here in person. We'd love to have you join us this Sunday.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/live">
              <Button size="lg" className="bg-gold text-white border-gold font-body">
                Watch Live
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/connect">
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-body">
                Plan a Visit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Video Dialog — Native HTML5 player */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          {selectedRecording && (
            <div className="aspect-video">
              <video
                src={selectedRecording.r2Url}
                controls
                autoPlay
                className="w-full h-full"
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
