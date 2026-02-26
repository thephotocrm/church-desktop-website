import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Wand2, Upload, Camera, Check, X, Loader2, Play, RefreshCw, Image,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminRecording {
  id: string;
  title: string;
  description: string | null;
  r2Key: string;
  r2Url: string;
  thumbnailUrl: string | null;
  thumbnailCandidates: string[] | null;
  duration: number | null;
  fileSize: number | null;
  status: string;
  streamStartedAt: string | null;
  createdAt: string | null;
}

interface ThumbnailResult {
  url: string;
  mode: string;
}

interface ThumbnailStudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recording: AdminRecording;
  onSelect: (url: string) => void;
}

const modeBadge: Record<string, { label: string; className: string }> = {
  "pastor-title": { label: "Pastor", className: "bg-purple-600 text-white" },
  "service-overlay": { label: "Overlay", className: "bg-amber-600 text-white" },
  "title-background": { label: "Background", className: "bg-emerald-600 text-white" },
};

export function ThumbnailStudioModal({
  open,
  onOpenChange,
  recording,
  onSelect,
}: ThumbnailStudioModalProps) {
  const { toast } = useToast();

  // Inputs
  const [studioTitle, setStudioTitle] = useState(recording.title);
  const [studioSubtitle, setStudioSubtitle] = useState("");
  const [pastorImageUrl, setPastorImageUrl] = useState("");
  const [pastorLayout, setPastorLayout] = useState<"left" | "right">("right");
  const [uploadingPastor, setUploadingPastor] = useState(false);
  const pastorFileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [showFrameCapture, setShowFrameCapture] = useState(false);
  const [frameTimestamp, setFrameTimestamp] = useState(0);
  const [capturingFrame, setCapturingFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ThumbnailResult[]>([]);
  const [selectedUrl, setSelectedUrl] = useState("");

  const candidates = recording.thumbnailCandidates || [];

  // Compute available modes for the label
  const availableModes: string[] = ["Background"];
  if (pastorImageUrl) availableModes.unshift("Pastor");
  if (snapshotUrl) availableModes.splice(availableModes.length - 1, 0, "Overlay");

  const handlePastorImageUpload = async (file: File) => {
    setUploadingPastor(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/recordings/admin/upload-thumbnail", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      setPastorImageUrl(url);
      toast({ title: "Pastor image uploaded" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPastor(false);
    }
  };

  const handleSeekVideo = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || Infinity;
      videoRef.current.currentTime = Math.min(frameTimestamp, dur);
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturingFrame(true);
    try {
      if (video.seeking) {
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
        });
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) throw new Error("Video not loaded yet — try again in a moment");

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      if (!dataUrl || dataUrl === "data:,") throw new Error("Failed to capture frame");

      setSnapshotUrl(dataUrl);
      setShowFrameCapture(false);
      toast({ title: "Frame captured!" });
    } catch (err: any) {
      toast({ title: err.message || "Frame capture failed", variant: "destructive" });
    } finally {
      setCapturingFrame(false);
    }
  };

  const handleGenerate = async () => {
    if (!studioTitle) return;
    setGenerating(true);
    setProgress(10);
    setResults([]);
    setSelectedUrl("");

    try {
      // Fake progress while waiting
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 3, 90));
      }, 500);

      const res = await fetch("/api/recordings/admin/generate-thumbnail-batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: studioTitle,
          subtitle: studioSubtitle || undefined,
          pastorImageUrl: pastorImageUrl || undefined,
          pastorLayout: pastorImageUrl ? pastorLayout : undefined,
          snapshotUrl: snapshotUrl || undefined,
          count: 25,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setResults(data.thumbnails || []);
      setProgress(100);

      if (data.errors > 0) {
        toast({ title: `Generated ${data.thumbnails.length} thumbnails (${data.errors} failed)` });
      } else {
        toast({ title: `Generated ${data.thumbnails.length} thumbnails!` });
      }
    } catch (err: any) {
      toast({ title: err.message || "Batch generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleUseSelected = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  const formatTimestamp = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="w-4 h-4 text-primary" />
              </div>
              Thumbnail Studio
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {recording.title}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Inputs row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Title / Subtitle */}
            <div className="space-y-3 p-4 border rounded-xl">
              <Label className="text-sm font-semibold">Title & Subtitle</Label>
              <div className="space-y-2">
                <Input
                  value={studioTitle}
                  onChange={(e) => setStudioTitle(e.target.value)}
                  placeholder="Sermon title"
                />
                <Input
                  value={studioSubtitle}
                  onChange={(e) => setStudioSubtitle(e.target.value)}
                  placeholder="Subtitle (optional)"
                />
              </div>
            </div>

            {/* Pastor Image */}
            <div className="space-y-3 p-4 border rounded-xl">
              <Label className="text-sm font-semibold">Pastor Image (optional)</Label>
              {!pastorImageUrl ? (
                <div
                  onClick={() => pastorFileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Upload PNG (transparent bg)</p>
                  <input
                    ref={pastorFileInputRef}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePastorImageUpload(file);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/[0.05] border border-purple-500/20">
                    <div className="h-14 w-14 rounded border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:12px_12px]">
                      <img src={pastorImageUrl} alt="Pastor" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-xs text-purple-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                    <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={() => setPastorImageUrl("")}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={pastorLayout}
                    onValueChange={(val) => { if (val) setPastorLayout(val as "left" | "right"); }}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="left" className="text-xs gap-1 data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-600">
                      Left
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" className="text-xs gap-1 data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-600">
                      Right
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
              {uploadingPastor && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </div>
              )}
            </div>

            {/* Service Snapshot */}
            <div className="space-y-3 p-4 border rounded-xl">
              <Label className="text-sm font-semibold">Service Snapshot (optional)</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {candidates.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setSnapshotUrl(url)}
                    className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${
                      snapshotUrl === url
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={url} alt={`Snapshot ${i + 1}`} className="w-full h-full object-cover" />
                    {snapshotUrl === url && (
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {/* Capture Frame card */}
                <div
                  onClick={() => setShowFrameCapture(!showFrameCapture)}
                  className={`aspect-video rounded border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                    showFrameCapture
                      ? "border-amber-500 bg-amber-500/[0.05]"
                      : "border-muted-foreground/30 hover:border-amber-500/50"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground font-medium">Capture</span>
                </div>
              </div>

              {/* Captured frame chip */}
              {snapshotUrl && !candidates.includes(snapshotUrl) && (
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/[0.05] border border-amber-500/20">
                  <img src={snapshotUrl} alt="Custom snapshot" className="h-10 aspect-video object-cover rounded border" />
                  <span className="text-[10px] text-muted-foreground">Custom frame</span>
                  <Button type="button" variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setSnapshotUrl("")}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Frame capture panel */}
              {showFrameCapture && (
                <div className="p-3 border border-amber-500/10 rounded-lg bg-background/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Time (s)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={recording.duration || 7200}
                      value={frameTimestamp}
                      onChange={(e) => {
                        const t = Number(e.target.value);
                        setFrameTimestamp(t);
                        if (videoRef.current) videoRef.current.currentTime = t;
                      }}
                      className="w-24 h-8"
                    />
                    <span className="text-xs text-muted-foreground">{formatTimestamp(frameTimestamp)}</span>
                    <Button type="button" variant="outline" size="sm" className="h-7" onClick={handleSeekVideo}>
                      <Play className="w-3 h-3 mr-1" /> Seek
                    </Button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={recording.duration || 7200}
                    value={frameTimestamp}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      setFrameTimestamp(t);
                      if (videoRef.current) videoRef.current.currentTime = t;
                    }}
                    className="w-full"
                  />
                  <div className="rounded overflow-hidden border bg-black">
                    <video
                      ref={videoRef}
                      src={`/api/recordings/${recording.id}/video`}
                      crossOrigin="anonymous"
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full"
                      onLoadedMetadata={handleSeekVideo}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <Button
                    type="button"
                    className="bg-amber-600 text-white hover:bg-amber-700"
                    size="sm"
                    disabled={capturingFrame}
                    onClick={handleCaptureFrame}
                  >
                    {capturingFrame ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Capturing...</>
                    ) : (
                      <><Camera className="w-4 h-4 mr-1" /> Capture Frame</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating || !studioTitle}
              className="bg-gradient-to-r from-purple-600 to-amber-600 text-white hover:from-purple-700 hover:to-amber-700"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating thumbnails...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Generate ~25 ({availableModes.join(" + ")})</>
              )}
            </Button>
            {generating && (
              <div className="flex-1 max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Results grid */}
          {(generating && results.length === 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 25 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {results.map((thumb, i) => {
                const badge = modeBadge[thumb.mode] || { label: thumb.mode, className: "bg-gray-600 text-white" };
                const isSelected = selectedUrl === thumb.url;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedUrl(isSelected ? "" : thumb.url)}
                    className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? "border-green-500 ring-2 ring-green-500/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={thumb.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    <Badge className={`absolute bottom-1 left-1 text-[9px] px-1.5 py-0 h-4 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generating || !studioTitle || results.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Regenerate All
          </Button>
          <Button
            onClick={handleUseSelected}
            disabled={!selectedUrl}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" /> Use Selected Thumbnail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
