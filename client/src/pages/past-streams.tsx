import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Radio, Play, Eye, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { useSEO } from "@/hooks/use-seo";
import { useStreamStatus } from "@/components/stream-player";

interface PastStream {
  videoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  duration: string | null;
  viewCount: number | null;
  likeCount: number | null;
}

interface PastStreamsResponse {
  items: PastStream[];
  nextPageToken: string | null;
  fromCache: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function formatDuration(iso: string | null): string {
  if (!iso) return "";
  // Parse ISO 8601 duration like PT1H23M45S
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = match[1] ? parseInt(match[1]) : 0;
  const m = match[2] ? parseInt(match[2]) : 0;
  const s = match[3] ? parseInt(match[3]) : 0;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(count: number | null): string {
  if (!count) return "0 views";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
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

  const [pageToken, setPageToken] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<PastStream[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PastStreamsResponse>({
    queryKey: ["/api/youtube/past-streams", pageToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (pageToken) params.set("page", pageToken);
      params.set("limit", "12");
      const res = await fetch(`/api/youtube/past-streams?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Merge new items with existing
  const items = pageToken && allItems.length > 0
    ? [...allItems, ...(data?.items || []).filter(i => !allItems.find(a => a.videoId === i.videoId))]
    : data?.items || [];

  const handleLoadMore = () => {
    if (data?.nextPageToken) {
      setAllItems(items);
      setPageToken(data.nextPageToken);
    }
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
              <SiYoutube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Past Streams Yet</h3>
              <p className="text-muted-foreground font-body">
                Past live streams will appear here once a YouTube channel is configured.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {items.map((stream) => (
                <motion.div key={stream.videoId} variants={fadeUp}>
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => setSelectedVideo(stream.videoId)}
                  >
                    <div className="relative aspect-video bg-muted">
                      {stream.thumbnailUrl ? (
                        <img
                          src={stream.thumbnailUrl}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SiYoutube className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {stream.duration && (
                        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white border-0 font-mono text-xs">
                          {formatDuration(stream.duration)}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{stream.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                        {stream.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(stream.publishedAt)}
                          </span>
                        )}
                        {stream.viewCount !== null && stream.viewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatViews(stream.viewCount)}
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
          {data?.nextPageToken && (
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

      {/* Video Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          {selectedVideo && (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                title="YouTube video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
