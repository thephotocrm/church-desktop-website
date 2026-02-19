import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PrayerRequestCardProps {
  id: string;
  title: string;
  body: string;
  authorName: string | null;
  isAnonymous: boolean | null;
  prayerCount: number | null;
  status: string;
  createdAt: string;
}

export function PrayerRequestCard({ id, title, body, authorName, prayerCount, status, createdAt }: PrayerRequestCardProps) {
  const [count, setCount] = useState(prayerCount || 0);
  const [prayed, setPrayed] = useState(false);

  const handlePray = async () => {
    if (prayed) return;
    try {
      const res = await apiRequest("POST", `/api/prayer-requests/${id}/pray`);
      const data = await res.json();
      setCount(data.prayerCount);
      setPrayed(true);
    } catch {
      // silently fail
    }
  };

  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className="p-5 hover-elevate">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-base">{title}</h3>
        {status === "answered" && (
          <Badge className="bg-green-500 text-white border-0 text-xs">Answered</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">{body}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" />
          <span>{authorName || "Anonymous"}</span>
          <span>&middot;</span>
          <span>{timeAgo}</span>
        </div>
        <Button
          variant={prayed ? "default" : "outline"}
          size="sm"
          className={prayed ? "bg-gold text-white border-gold" : ""}
          onClick={handlePray}
        >
          <Heart className={`w-3.5 h-3.5 mr-1 ${prayed ? "fill-current" : ""}`} />
          {count} Praying
        </Button>
      </div>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
