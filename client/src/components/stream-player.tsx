import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import Hls from "hls.js";

interface StreamStatus {
  isLive: boolean;
  title: string;
  description: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
}

export function StreamPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { data: status, isLoading } = useQuery<StreamStatus>({
    queryKey: ["/api/stream/status"],
    refetchInterval: 15000,
    staleTime: 10000,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !status?.isLive || !status.hlsUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(status.hlsUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = status.hlsUrl;
    }
  }, [status?.isLive, status?.hlsUrl]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video bg-navy animate-pulse" />
      </Card>
    );
  }

  // Live state
  if (status?.isLive && status.hlsUrl) {
    return (
      <div>
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              muted
              playsInline
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-600 text-white text-xs font-bold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </Card>
        {status.title && (
          <p className="mt-3 text-lg font-semibold text-center">{status.title}</p>
        )}
      </div>
    );
  }

  // Offline state — preserves existing placeholder design
  return (
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
          <p className="text-white/70 font-body text-sm">
            Our next service will be streamed live
          </p>
        </div>
      </div>
    </Card>
  );
}

export function useStreamStatus() {
  return useQuery<StreamStatus>({
    queryKey: ["/api/stream/status"],
    refetchInterval: 15000,
    staleTime: 10000,
  });
}
