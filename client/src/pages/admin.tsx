import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radio, Settings, LogOut, Save, Video, Users, Calendar, Church,
  HandHeart, DollarSign, Check, X, UserCheck, UserX, Plus, Trash2, Cast, Shield,
  Edit2, MapPin, Clock, Film, Image, Upload, Loader2, Wand2, Camera, Play
} from "lucide-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: string;
  username: string;
}

interface StreamStatus {
  isLive: boolean;
  title: string;
  description: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
}

interface PendingMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  createdAt: string;
}

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

interface Donation {
  id: string;
  amountCents: number;
  status: string;
  type: string;
  frequency: string | null;
  memberId: string | null;
  createdAt: string;
}

interface FundCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  orderIndex: number | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean | null;
}

interface AdminMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
  role: string;
  title: string | null;
  groupAdminIds: string[];
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: authLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const { data: streamStatus } = useQuery<StreamStatus>({
    queryKey: ["/api/stream/status"],
    refetchInterval: 10000,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    if (streamStatus) {
      setTitle(streamStatus.title || "");
      setDescription(streamStatus.description || "");
      setThumbnailUrl(streamStatus.thumbnailUrl || "");
    }
  }, [streamStatus]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const updateConfig = useMutation({
    mutationFn: async (data: { title?: string; description?: string; thumbnailUrl?: string }) => {
      const res = await apiRequest("PATCH", "/api/stream/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream/status"] });
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/login");
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateConfig.mutate({ title, description, thumbnailUrl });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground leading-tight">Manage your church platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">{user.username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="stream">
          <TabsList className="flex w-full gap-1 overflow-x-auto mb-8 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="stream" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Video className="w-4 h-4" />Stream</TabsTrigger>
            <TabsTrigger value="recordings" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Film className="w-4 h-4" />Recordings</TabsTrigger>
            <TabsTrigger value="restream" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Cast className="w-4 h-4" />Restream</TabsTrigger>
            <TabsTrigger value="members" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Users className="w-4 h-4" />Members</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Calendar className="w-4 h-4" />Events</TabsTrigger>
            <TabsTrigger value="prayer" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><HandHeart className="w-4 h-4" />Prayer</TabsTrigger>
            <TabsTrigger value="giving" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><DollarSign className="w-4 h-4" />Giving</TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 min-w-fit gap-1.5 rounded-lg data-[state=active]:shadow-md"><Church className="w-4 h-4" />Groups</TabsTrigger>
          </TabsList>

          {/* Stream Tab */}
          <TabsContent value="stream">
            <Card className="shadow-md border-0 ring-1 ring-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Live Stream</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Configure your stream settings</p>
                    </div>
                  </div>
                  {streamStatus?.isLive ? (
                    <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1.5 px-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1.5 px-3">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Offline
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                  Stream status is auto-detected from your MediaMTX server.
                </div>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="stream-title" className="text-sm font-medium">Stream Title</Label>
                    <Input id="stream-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream-description" className="text-sm font-medium">Description</Label>
                    <Textarea id="stream-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream-thumbnail" className="text-sm font-medium">Thumbnail URL</Label>
                    <Input id="stream-thumbnail" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="h-10" />
                  </div>
                  <Button type="submit" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all" disabled={updateConfig.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateConfig.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings">
            <RecordingsAdmin />
          </TabsContent>

          {/* Restream Tab */}
          <TabsContent value="restream">
            <RestreamAdmin />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MembersAdmin />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <EventsAdmin />
          </TabsContent>

          {/* Prayer Tab */}
          <TabsContent value="prayer">
            <PrayerAdmin />
          </TabsContent>

          {/* Giving Tab */}
          <TabsContent value="giving">
            <GivingAdmin />
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <GroupsAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ========== Recordings Admin ==========

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

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function RecordingsAdmin() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: recordings, isLoading } = useQuery<AdminRecording[]>({
    queryKey: ["/api/recordings/admin/all"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recordings/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({ title: "Recording deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete recording", variant: "destructive" });
    },
  });

  const statusColors: Record<string, string> = {
    ready: "bg-green-500",
    processing: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-gold" />
          <CardTitle>Recording Management</CardTitle>
          {recordings && (
            <Badge variant="outline">{recordings.length} recordings</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : recordings && recordings.length > 0 ? (
          <div className="space-y-3">
            {recordings.map((rec) =>
              editingId === rec.id ? (
                <RecordingEditRow
                  key={rec.id}
                  recording={rec}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              ) : (
                <div key={rec.id} className="p-4 border rounded-md">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail preview */}
                    <div className="w-28 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      {rec.thumbnailUrl ? (
                        <img
                          src={rec.thumbnailUrl}
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{rec.title}</h4>
                        <Badge className={`${statusColors[rec.status] || "bg-gray-500"} text-white border-0 text-xs capitalize`}>
                          {rec.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(rec.duration)}
                        </span>
                        <span>
                          {rec.streamStartedAt
                            ? new Date(rec.streamStartedAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })
                            : rec.createdAt
                            ? new Date(rec.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })
                            : "—"}
                        </span>
                        <span>{formatFileSize(rec.fileSize)}</span>
                      </div>
                      {rec.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rec.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(rec.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(rec.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">No recordings yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function RecordingEditRow({
  recording,
  onCancel,
  onSaved,
}: {
  recording: AdminRecording;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(recording.title);
  const [description, setDescription] = useState(recording.description || "");
  const [selectedThumb, setSelectedThumb] = useState(recording.thumbnailUrl || "");
  const [customThumbUrl, setCustomThumbUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Thumbnail generation state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSnapshotUrl, setAiSnapshotUrl] = useState("");
  const [aiTitle, setAiTitle] = useState(recording.title);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Frame capture state
  const [showFrameCapture, setShowFrameCapture] = useState(false);
  const [frameTimestamp, setFrameTimestamp] = useState(3000); // 50 min default
  const [capturingFrame, setCapturingFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const candidates = recording.thumbnailCandidates || [];

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
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
      setCustomThumbUrl(url);
      toast({ title: "Thumbnail uploaded" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateAiThumbnail = async () => {
    if (!aiSnapshotUrl || !aiTitle) {
      toast({ title: "Select a snapshot and enter a title", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/recordings/admin/generate-thumbnail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotUrl: aiSnapshotUrl, title: aiTitle }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      const { url } = await res.json();
      setCustomThumbUrl(url);
      setShowAiPanel(false);
      toast({ title: "AI thumbnail generated!" });
    } catch (err: any) {
      toast({ title: err.message || "Generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSeekVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = frameTimestamp;
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturingFrame(true);
    try {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Failed to capture frame");

      // Upload via existing upload-thumbnail endpoint
      const formData = new FormData();
      formData.append("file", blob, `frame-${frameTimestamp}s.jpg`);
      const res = await fetch("/api/recordings/admin/upload-thumbnail", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      // Set as the selected AI snapshot
      setAiSnapshotUrl(url);
      setShowAiPanel(true);
      setShowFrameCapture(false);
      toast({ title: "Frame captured! Now generate AI thumbnail." });
    } catch (err: any) {
      toast({ title: err.message || "Frame capture failed", variant: "destructive" });
    } finally {
      setCapturingFrame(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const thumbnailUrl = customThumbUrl || selectedThumb || null;
      await apiRequest("PATCH", `/api/recordings/admin/${recording.id}`, {
        title,
        description: description || null,
        thumbnailUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({ title: "Recording updated" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Failed to update recording", variant: "destructive" });
    },
  });

  const formatTimestamp = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 border-2 border-gold rounded-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`rec-title-${recording.id}`}>Title</Label>
          <Input
            id={`rec-title-${recording.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            value={
              recording.streamStartedAt
                ? new Date(recording.streamStartedAt).toLocaleDateString()
                : "—"
            }
            disabled
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`rec-desc-${recording.id}`}>Description</Label>
        <Textarea
          id={`rec-desc-${recording.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description..."
        />
      </div>

      {/* Thumbnail picker */}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            Select Thumbnail
          </Label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {candidates.map((url, i) => (
              <div
                key={i}
                onClick={() => { setSelectedThumb(url); setCustomThumbUrl(""); }}
                className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedThumb === url && !customThumbUrl
                    ? "border-gold ring-2 ring-gold/30"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                {selectedThumb === url && !customThumbUrl && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom thumbnail upload / URL */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" />
          Custom Thumbnail
        </Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleThumbnailUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-1" /> Upload Image</>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">or</span>
          <Input
            id={`rec-custom-thumb-${recording.id}`}
            value={customThumbUrl}
            onChange={(e) => setCustomThumbUrl(e.target.value)}
            placeholder="Paste URL"
            className="flex-1"
          />
        </div>
        {customThumbUrl && (
          <div className="flex items-center gap-2 mt-1">
            <img
              src={customThumbUrl}
              alt="Custom thumbnail preview"
              className="h-16 aspect-video object-cover rounded border"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCustomThumbUrl("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* AI Thumbnail Generation + Frame Capture */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showAiPanel ? "default" : "outline"}
            size="sm"
            className={showAiPanel ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
            onClick={() => { setShowAiPanel(!showAiPanel); setShowFrameCapture(false); }}
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Generate AI Thumbnail
          </Button>
          <Button
            type="button"
            variant={showFrameCapture ? "default" : "outline"}
            size="sm"
            className={showFrameCapture ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            onClick={() => { setShowFrameCapture(!showFrameCapture); setShowAiPanel(false); }}
          >
            <Camera className="w-4 h-4 mr-1" />
            Capture Custom Frame
          </Button>
        </div>

        {/* AI Thumbnail Panel */}
        {showAiPanel && (
          <div className="p-4 border rounded-md bg-muted/50 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1">
              <Wand2 className="w-4 h-4 text-purple-500" />
              AI Thumbnail Generator
            </p>
            <p className="text-xs text-muted-foreground">
              Select a snapshot below, enter the sermon title, and generate a YouTube-style thumbnail with background removal.
            </p>

            {/* Snapshot selection for AI */}
            {candidates.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Select Source Snapshot</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {candidates.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setAiSnapshotUrl(url)}
                      className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${
                        aiSnapshotUrl === url
                          ? "border-purple-500 ring-2 ring-purple-500/30"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img src={url} alt={`Snapshot ${i + 1}`} className="w-full h-full object-cover" />
                      {aiSnapshotUrl === url && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom snapshot URL (e.g. from frame capture) */}
            {aiSnapshotUrl && !candidates.includes(aiSnapshotUrl) && (
              <div className="flex items-center gap-2">
                <img src={aiSnapshotUrl} alt="Custom snapshot" className="h-14 aspect-video object-cover rounded border" />
                <span className="text-xs text-muted-foreground">Custom captured frame</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Sermon Title (appears on thumbnail)</Label>
              <Input
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
                placeholder="e.g. God Is Good"
              />
            </div>

            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700"
              size="sm"
              disabled={aiGenerating || !aiSnapshotUrl || !aiTitle}
              onClick={handleGenerateAiThumbnail}
            >
              {aiGenerating ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating (~10s)...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-1" /> Generate Thumbnail</>
              )}
            </Button>
          </div>
        )}

        {/* Frame Capture Panel */}
        {showFrameCapture && (
          <div className="p-4 border rounded-md bg-muted/50 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1">
              <Camera className="w-4 h-4 text-blue-500" />
              Capture Custom Frame
            </p>
            <p className="text-xs text-muted-foreground">
              Scrub to a specific moment in the recording and capture a frame for AI thumbnail generation.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Timestamp (seconds)</Label>
                <Input
                  type="number"
                  min={0}
                  max={recording.duration || 7200}
                  value={frameTimestamp}
                  onChange={(e) => setFrameTimestamp(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(frameTimestamp)}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={handleSeekVideo}>
                  <Play className="w-3 h-3 mr-1" /> Seek
                </Button>
              </div>

              <input
                type="range"
                min={0}
                max={recording.duration || 7200}
                value={frameTimestamp}
                onChange={(e) => {
                  setFrameTimestamp(Number(e.target.value));
                }}
                onMouseUp={handleSeekVideo}
                onTouchEnd={handleSeekVideo}
                className="w-full"
              />

              <div className="rounded overflow-hidden border bg-black" style={{ maxWidth: 480 }}>
                <video
                  ref={videoRef}
                  src={recording.r2Url}
                  crossOrigin="anonymous"
                  preload="metadata"
                  className="w-full"
                  onLoadedMetadata={handleSeekVideo}
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="sm"
                disabled={capturingFrame}
                onClick={handleCaptureFrame}
              >
                {capturingFrame ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Capturing...</>
                ) : (
                  <><Camera className="w-4 h-4 mr-1" /> Capture & Use for AI Thumbnail</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          className="bg-gold text-white border-gold"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !title}
        >
          <Save className="w-4 h-4 mr-1" />
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ========== Members Admin ==========

const TITLE_PRESETS = [
  "Pastor", "Bishop", "Youth Pastor", "Deacon", "Deaconess",
  "Elder", "Minister", "Evangelist", "Mother",
];

function MembersAdmin() {
  const { toast } = useToast();
  const { data: pending, isLoading } = useQuery<PendingMember[]>({
    queryKey: ["/api/members/admin/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/members/admin/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/admin/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/admin/all"] });
      toast({ title: "Member approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/members/admin/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/admin/pending"] });
      toast({ title: "Member rejected" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Section A: Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gold" />
            <CardTitle>Pending Approvals</CardTitle>
            {pending && pending.length > 0 && (
              <Badge className="bg-gold text-white border-gold">{pending.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : pending && pending.length > 0 ? (
            <div className="space-y-3">
              {pending.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-semibold">{m.firstName} {m.lastName}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Registered {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => approveMutation.mutate(m.id)}
                      disabled={approveMutation.isPending}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50"
                      onClick={() => rejectMutation.mutate(m.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No pending member registrations</p>
          )}
        </CardContent>
      </Card>

      {/* Section B: Manage Members */}
      <ManageMembersSection />
    </div>
  );
}

function ManageMembersSection() {
  const { toast } = useToast();

  const { data: allMembers, isLoading } = useQuery<AdminMember[]>({
    queryKey: ["/api/members/admin/all"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups/admin"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-gold" />
          <CardTitle>Manage Members</CardTitle>
          {allMembers && (
            <Badge variant="outline">{allMembers.length} members</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : allMembers && allMembers.length > 0 ? (
          <div className="space-y-3">
            {allMembers.map((m) => (
              <MemberRow key={m.id} member={m} groups={groups || []} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">No approved members</p>
        )}
      </CardContent>
    </Card>
  );
}

function MemberRow({ member, groups }: { member: AdminMember; groups: Group[] }) {
  const { toast } = useToast();
  const [role, setRole] = useState(member.role);
  const [title, setTitle] = useState(member.title || "");
  const [customTitle, setCustomTitle] = useState("");
  const [isCustom, setIsCustom] = useState(
    member.title ? !TITLE_PRESETS.includes(member.title) : false
  );
  const [groupAdminIds, setGroupAdminIds] = useState<string[]>(member.groupAdminIds);

  const isDirty =
    role !== member.role ||
    (isCustom ? customTitle : title) !== (member.title || "") ||
    JSON.stringify(groupAdminIds.sort()) !== JSON.stringify(member.groupAdminIds.sort());

  useEffect(() => {
    if (member.title && !TITLE_PRESETS.includes(member.title)) {
      setIsCustom(true);
      setCustomTitle(member.title);
      setTitle("__custom__");
    }
  }, [member.title]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const resolvedTitle = isCustom ? customTitle : title;
      await apiRequest("PATCH", `/api/members/admin/${member.id}/role`, {
        role,
        title: resolvedTitle || null,
        groupAdminIds: role === "group_admin" ? groupAdminIds : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/admin/all"] });
      toast({ title: `Updated ${member.firstName} ${member.lastName}` });
    },
    onError: () => {
      toast({ title: "Failed to update member", variant: "destructive" });
    },
  });

  const handleTitleChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustom(true);
      setTitle("__custom__");
    } else if (val === "__none__") {
      setIsCustom(false);
      setTitle("");
      setCustomTitle("");
    } else {
      setIsCustom(false);
      setTitle(val);
      setCustomTitle("");
    }
  };

  const toggleGroupAdmin = (groupId: string) => {
    setGroupAdminIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="p-4 border rounded-md space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{member.firstName} {member.lastName}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        {isDirty && (
          <Button
            size="sm"
            className="bg-gold text-white border-gold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 min-w-[160px]">
          <Label className="text-xs">Title</Label>
          <Select value={isCustom ? "__custom__" : title || "__none__"} onValueChange={handleTitleChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="No title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No title</SelectItem>
              {TITLE_PRESETS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
              <SelectItem value="__custom__">Custom...</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isCustom && (
          <div className="space-y-1 min-w-[140px]">
            <Label className="text-xs">Custom Title</Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter title"
              className="h-9"
            />
          </div>
        )}
        <div className="space-y-1 min-w-[150px]">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="group_admin">Group Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {role === "group_admin" && (
        <div className="space-y-2">
          <Label className="text-xs">Admin of Groups</Label>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Badge
                key={g.id}
                variant={groupAdminIds.includes(g.id) ? "default" : "outline"}
                className={`cursor-pointer ${groupAdminIds.includes(g.id) ? "bg-gold text-white border-gold" : ""}`}
                onClick={() => toggleGroupAdmin(g.id)}
              >
                {g.name}
              </Badge>
            ))}
          </div>
          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground">No groups available</p>
          )}
        </div>
      )}
    </div>
  );
}

// ========== Prayer Admin ==========
function PrayerAdmin() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("active");

  const { data: requests, isLoading } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/prayer-requests/admin/all", filter],
    queryFn: async () => {
      const res = await fetch(`/api/prayer-requests/admin/all?status=${filter}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/prayer-requests/admin/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-requests/admin/all"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HandHeart className="w-5 h-5 text-gold" />
            <CardTitle>Prayer Requests</CardTitle>
          </div>
          <div className="flex gap-1">
            {["active", "answered", "archived"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                className={filter === s ? "bg-gold text-white border-gold" : ""}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 border rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By {r.authorName || "Anonymous"} {r.isAnonymous ? "(anonymous)" : ""}
                      &middot; {new Date(r.createdAt).toLocaleDateString()}
                      &middot; {r.prayerCount || 0} prayers
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{r.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{r.body}</p>
                <div className="flex gap-2">
                  {r.status !== "answered" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "answered" })}>
                      <Check className="w-3 h-3 mr-1" />Answered
                    </Button>
                  )}
                  {r.status !== "archived" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "archived" })}>
                      Archive
                    </Button>
                  )}
                  {r.status !== "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "active" })}>
                      Reactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">No {filter} prayer requests</p>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Giving Admin ==========
function GivingAdmin() {
  const { toast } = useToast();

  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/giving/admin/donations"],
  });

  const { data: funds, isLoading: fundsLoading } = useQuery<FundCategory[]>({
    queryKey: ["/api/giving/funds"],
  });

  const [newFundName, setNewFundName] = useState("");
  const [newFundDesc, setNewFundDesc] = useState("");

  const createFund = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/giving/admin/funds", {
        name: newFundName,
        description: newFundDesc,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/giving/funds"] });
      setNewFundName("");
      setNewFundDesc("");
      toast({ title: "Fund created" });
    },
    onError: () => {
      toast({ title: "Failed to create fund", variant: "destructive" });
    },
  });

  const totalSucceeded = donations
    ?.filter((d) => d.status === "succeeded")
    .reduce((sum, d) => sum + d.amountCents, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gold">${(totalSucceeded / 100).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{donations?.filter((d) => d.status === "succeeded").length || 0}</p>
            <p className="text-sm text-muted-foreground">Successful Donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{funds?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Fund Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Fund Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            Fund Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundsLoading ? (
            <div className="h-20 bg-muted animate-pulse rounded-md" />
          ) : (
            <div className="space-y-2 mb-4">
              {funds?.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                  </div>
                  <Badge variant={f.isActive ? "default" : "secondary"}>
                    {f.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Separator className="my-4" />
          <p className="text-sm font-semibold mb-3">Add New Fund</p>
          <div className="flex gap-2">
            <Input
              placeholder="Fund name"
              value={newFundName}
              onChange={(e) => setNewFundName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newFundDesc}
              onChange={(e) => setNewFundDesc(e.target.value)}
            />
            <Button
              className="bg-gold text-white border-gold"
              onClick={() => createFund.mutate()}
              disabled={!newFundName || createFund.isPending}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : donations && donations.length > 0 ? (
            <div className="space-y-2">
              {donations.slice(0, 20).map((d) => {
                const statusColors: Record<string, string> = {
                  succeeded: "bg-green-500",
                  pending: "bg-yellow-500",
                  failed: "bg-red-500",
                };
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">${(d.amountCents / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()} &middot; {d.type}
                        {d.frequency ? ` (${d.frequency})` : ""}
                      </p>
                    </div>
                    <Badge className={`${statusColors[d.status] || "bg-gray-500"} text-white border-0 capitalize`}>
                      {d.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No donations yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========== Restream Admin ==========
interface PlatformConfigData {
  platform: string;
  enabled: boolean;
  streamKey: string | null;
  rtmpUrl: string | null;
  channelId: string | null;
  apiKey: string | null;
  channelUrl: string | null;
}

interface RestreamStatusData {
  platform: string;
  status: string;
  errorMessage: string | null;
  startedAt: string | null;
  stoppedAt: string | null;
}

function RestreamAdmin() {
  const { toast } = useToast();

  const { data: configs, isLoading: configsLoading } = useQuery<PlatformConfigData[]>({
    queryKey: ["/api/admin/platform-configs"],
  });

  const { data: statuses } = useQuery<RestreamStatusData[]>({
    queryKey: ["/api/admin/restream-status"],
    refetchInterval: 5000,
  });

  const statusMap = new Map((statuses || []).map((s) => [s.platform, s]));

  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 rounded-md bg-muted text-sm text-muted-foreground">
        Configure YouTube and Facebook restreaming. When OBS starts streaming, the server automatically forwards to enabled platforms.
      </div>
      {configsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <PlatformCard
            platform="youtube"
            label="YouTube"
            config={configs?.find((c) => c.platform === "youtube") || null}
            status={statusMap.get("youtube") || null}
            showExtras
          />
          <PlatformCard
            platform="facebook"
            label="Facebook"
            config={configs?.find((c) => c.platform === "facebook") || null}
            status={statusMap.get("facebook") || null}
          />
        </>
      )}
    </div>
  );
}

function PlatformCard({
  platform,
  label,
  config,
  status,
  showExtras,
}: {
  platform: string;
  label: string;
  config: PlatformConfigData | null;
  status: RestreamStatusData | null;
  showExtras?: boolean;
}) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [streamKey, setStreamKey] = useState(config?.streamKey || "");
  const [channelUrl, setChannelUrl] = useState(config?.channelUrl || "");
  const [channelId, setChannelId] = useState(config?.channelId || "");
  const [apiKey, setApiKey] = useState(config?.apiKey || "");

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setStreamKey(config.streamKey || "");
      setChannelUrl(config.channelUrl || "");
      setChannelId(config.channelId || "");
      setApiKey(config.apiKey || "");
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        enabled,
        channelUrl,
      };
      // Only send stream key if user changed it (not the masked value)
      if (streamKey && !streamKey.startsWith("****")) {
        body.streamKey = streamKey;
      }
      if (showExtras) {
        body.channelId = channelId;
        if (apiKey && !apiKey.startsWith("****")) {
          body.apiKey = apiKey;
        }
      }
      const res = await apiRequest("PATCH", `/api/admin/platform-configs/${platform}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-configs"] });
      toast({ title: `${label} settings saved` });
    },
    onError: () => {
      toast({ title: "Error", description: `Failed to save ${label} settings.`, variant: "destructive" });
    },
  });

  const statusColor = {
    idle: "bg-gray-500",
    active: "bg-green-500",
    error: "bg-red-500",
  }[status?.status || "idle"] || "bg-gray-500";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cast className="w-5 h-5 text-gold" />
            <CardTitle>{label}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${statusColor} text-white border-0 capitalize`}>
              {status?.status || "idle"}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Enabled</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status?.errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
            Error: {status.errorMessage}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${platform}-stream-key`}>Stream Key</Label>
            <Input
              id={`${platform}-stream-key`}
              type="password"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="Enter RTMP stream key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${platform}-channel-url`}>Channel URL</Label>
            <Input
              id={`${platform}-channel-url`}
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder={`https://${platform}.com/...`}
            />
          </div>
          {showExtras && (
            <>
              <div className="space-y-2">
                <Label htmlFor={`${platform}-channel-id`}>Channel ID</Label>
                <Input
                  id={`${platform}-channel-id`}
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UC..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${platform}-api-key`}>YouTube Data API Key</Label>
                <Input
                  id={`${platform}-api-key`}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                />
              </div>
            </>
          )}
          <Button
            className="bg-gold text-white border-gold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Events Admin ==========
interface AdminEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean | null;
  location: string | null;
  imageUrl: string | null;
  featured: boolean | null;
  category: string | null;
  status: string;
  recurrenceRule: string | null;
  recurrenceEndDate: string | null;
  parentEventId: string | null;
  groups: Group[];
  rsvpCount: { attending: number; maybe: number; declined: number };
}

const EVENT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "worship", label: "Worship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "outreach", label: "Outreach" },
  { value: "youth", label: "Youth" },
  { value: "prayer", label: "Prayer" },
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

function EventsAdmin() {
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<AdminEvent[]>({
    queryKey: ["/api/events/admin/all"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups/admin"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newAllDay, setNewAllDay] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newFeatured, setNewFeatured] = useState(false);
  const [newStatus, setNewStatus] = useState("published");
  const [newGroupIds, setNewGroupIds] = useState<string[]>([]);
  const [newRecurrence, setNewRecurrence] = useState("");

  const createEvent = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/events/admin", {
        title: newTitle,
        description: newDescription,
        startDate: newStartDate,
        endDate: newEndDate || null,
        allDay: newAllDay,
        location: newLocation || null,
        imageUrl: newImageUrl || null,
        category: newCategory,
        featured: newFeatured,
        status: newStatus,
        recurrenceRule: newRecurrence || null,
        groupIds: newGroupIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setNewTitle("");
      setNewDescription("");
      setNewStartDate("");
      setNewEndDate("");
      setNewAllDay(false);
      setNewLocation("");
      setNewImageUrl("");
      setNewCategory("general");
      setNewFeatured(false);
      setNewStatus("published");
      setNewGroupIds([]);
      setNewRecurrence("");
      toast({ title: "Event created" });
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const toggleGroupId = (id: string) => {
    setNewGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  };

  const categoryColor: Record<string, string> = {
    worship: "bg-purple-500",
    fellowship: "bg-blue-500",
    outreach: "bg-green-500",
    youth: "bg-orange-500",
    prayer: "bg-indigo-500",
    general: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      {/* Event List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gold" />
            <CardTitle>Event Management</CardTitle>
            {events && (
              <Badge variant="outline">{events.length} events</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                editingId === event.id ? (
                  <EventEditRow
                    key={event.id}
                    event={event}
                    groups={groups || []}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                ) : (
                  <div key={event.id} className="p-4 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.featured && (
                            <Badge className="bg-gold text-white border-gold text-xs">Featured</Badge>
                          )}
                          <Badge className={`${categoryColor[event.category || "general"]} text-white border-0 text-xs capitalize`}>
                            {event.category || "general"}
                          </Badge>
                          <Badge variant={event.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(event.startDate)}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.rsvpCount.attending} attending
                            {event.rsvpCount.maybe > 0 && `, ${event.rsvpCount.maybe} maybe`}
                          </span>
                        </div>
                        {event.groups.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.groups.map((g) => (
                              <Badge key={g.id} variant="outline" className="text-xs">{g.name}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(event.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEvent.mutate(event.id)}
                          disabled={deleteEvent.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No events created yet</p>
          )}
        </CardContent>
      </Card>

      {/* Create Event Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gold" />
            Create New Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input id="event-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input id="event-location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} placeholder="Event description" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start">Start Date/Time</Label>
                <Input id="event-start" type="datetime-local" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">End Date/Time</Label>
                <Input id="event-end" type="datetime-local" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={newRecurrence} onValueChange={setNewRecurrence}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((r) => (
                      <SelectItem key={r.value || "none"} value={r.value || "none"}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-image">Image URL</Label>
                <Input id="event-image" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="/images/..." />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={newFeatured} onCheckedChange={setNewFeatured} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newAllDay} onCheckedChange={setNewAllDay} />
                <Label>All Day</Label>
              </div>
            </div>

            {groups && groups.length > 0 && (
              <div className="space-y-2">
                <Label>Group Associations</Label>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <Badge
                      key={g.id}
                      variant={newGroupIds.includes(g.id) ? "default" : "outline"}
                      className={`cursor-pointer ${newGroupIds.includes(g.id) ? "bg-gold text-white border-gold" : ""}`}
                      onClick={() => toggleGroupId(g.id)}
                    >
                      {g.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="bg-gold text-white border-gold"
              onClick={() => createEvent.mutate()}
              disabled={!newTitle || !newStartDate || !newDescription || createEvent.isPending}
            >
              <Plus className="w-4 h-4 mr-1" />
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EventEditRow({
  event,
  groups,
  onCancel,
  onSaved,
}: {
  event: AdminEvent;
  groups: Group[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startDate, setStartDate] = useState(toLocalDatetime(event.startDate));
  const [endDate, setEndDate] = useState(event.endDate ? toLocalDatetime(event.endDate) : "");
  const [allDay, setAllDay] = useState(event.allDay || false);
  const [location, setLocation] = useState(event.location || "");
  const [imageUrl, setImageUrl] = useState(event.imageUrl || "");
  const [category, setCategory] = useState(event.category || "general");
  const [featured, setFeatured] = useState(event.featured || false);
  const [status, setStatus] = useState(event.status);
  const [groupIds, setGroupIds] = useState<string[]>(event.groups.map(g => g.id));
  const [recurrence, setRecurrence] = useState(event.recurrenceRule || "");

  const updateEvent = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/events/admin/${event.id}`, {
        title,
        description,
        startDate,
        endDate: endDate || null,
        allDay,
        location: location || null,
        imageUrl: imageUrl || null,
        category,
        featured,
        status,
        recurrenceRule: recurrence || null,
        groupIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event updated" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  const toggleGroupId = (id: string) => {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 border-2 border-gold rounded-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date/Time</Label>
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End Date/Time</Label>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Recurrence</Label>
          <Select value={recurrence || "none"} onValueChange={(v) => setRecurrence(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.map((r) => (
                <SelectItem key={r.value || "none"} value={r.value || "none"}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={featured} onCheckedChange={setFeatured} />
          <Label>Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={allDay} onCheckedChange={setAllDay} />
          <Label>All Day</Label>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          <Label>Group Associations</Label>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Badge
                key={g.id}
                variant={groupIds.includes(g.id) ? "default" : "outline"}
                className={`cursor-pointer ${groupIds.includes(g.id) ? "bg-gold text-white border-gold" : ""}`}
                onClick={() => toggleGroupId(g.id)}
              >
                {g.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          className="bg-gold text-white border-gold"
          onClick={() => updateEvent.mutate()}
          disabled={updateEvent.isPending}
        >
          <Save className="w-4 h-4 mr-1" />
          {updateEvent.isPending ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ========== Groups Admin ==========
function GroupsAdmin() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"chat" | "announcement">("chat");

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups/admin"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/groups/admin", {
        name: newName,
        description: newDesc,
        type: newType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/admin"] });
      setNewName("");
      setNewDesc("");
      setNewType("chat");
      toast({ title: "Group created" });
    },
    onError: () => {
      toast({ title: "Failed to create group", variant: "destructive" });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/groups/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/admin"] });
      toast({ title: "Group deleted" });
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Failed to delete group", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Church className="w-5 h-5 text-gold" />
          <CardTitle>Group Management</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-2 mb-4">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  </div>
                  {g.type === "announcement" && (
                    <Badge variant="outline" className="text-xs">Announcement</Badge>
                  )}
                  {g.isDefault && (
                    <Badge className="bg-gold text-white border-gold text-xs">Default</Badge>
                  )}
                </div>
                {!g.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGroup.mutate(g.id)}
                    disabled={deleteGroup.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 mb-4">No groups created yet</p>
        )}

        <Separator className="my-4" />
        <p className="text-sm font-semibold mb-3">Create New Group</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Group name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
          <Input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "chat" | "announcement")}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="chat">Chat</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button
            className="bg-gold text-white border-gold"
            onClick={() => createGroup.mutate()}
            disabled={!newName || createGroup.isPending}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
