import { Link } from "wouter";
import { Radio } from "lucide-react";
import { useStreamStatus } from "./stream-player";

export function LiveBanner() {
  const { data: streamStatus } = useStreamStatus();

  if (!streamStatus?.isLive) return null;

  return (
    <Link href="/live">
      <div className="bg-red-600 text-white py-2 px-4 cursor-pointer hover:bg-red-700 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-semibold">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>We're Live Right Now — Watch the Service</span>
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </Link>
  );
}
