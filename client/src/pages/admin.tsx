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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Radio, Settings, LogOut, Save, Video, Users, Calendar, Church,
  HandHeart, DollarSign, Check, X, UserCheck, UserX, Plus, Trash2, Cast, Shield,
  Edit2, MapPin, Clock, Film, Image, Upload, Loader2, Wand2, Camera, Play,
  Type, RefreshCw, MousePointer, Download, Palette
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

interface StyleReference {
  id: string;
  sourceVideoId: string;
  r2Key: string;
  r2Url: string;
  label: string | null;
  isActive: boolean | null;
  createdAt: string;
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
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
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

  const { data: styleRefs } = useQuery<StyleReference[]>({
    queryKey: ["/api/recordings/admin/style-references"],
  });

  const importRefsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/recordings/admin/import-style-references");
      return res.json();
    },
    onSuccess: (data: { imported: number; skipped: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings/admin/style-references"] });
      toast({ title: "Import complete", description: `${data.imported} imported, ${data.skipped} skipped, ${data.failed} failed` });
    },
    onError: () => {
      toast({ title: "Import failed", variant: "destructive" });
    },
  });

  const deleteRefMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recordings/admin/style-references/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings/admin/style-references"] });
      toast({ title: "Style reference removed" });
    },
    onError: () => {
      toast({ title: "Failed to delete style reference", variant: "destructive" });
    },
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

  const activeRefCount = styleRefs?.filter(r => r.isActive).length ?? 0;

  return (
    <Card className="shadow-md border-0 ring-1 ring-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Film className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Recording Management</CardTitle>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">v1.1</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Manage thumbnails, titles, and metadata</p>
          </div>
          {recordings && (
            <Badge variant="secondary" className="ml-auto tabular-nums">{recordings.length} recordings</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* AI Style References Section */}
        <div className="mb-6 p-4 rounded-lg border border-border/50 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm">AI Style References</h3>
              {activeRefCount > 0 && (
                <Badge variant="secondary" className="text-xs">{activeRefCount} active</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => importRefsMutation.mutate()}
              disabled={importRefsMutation.isPending}
            >
              {importRefsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {importRefsMutation.isPending ? "Importing..." : "Import from Elevation"}
            </Button>
          </div>

          {styleRefs && styleRefs.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {styleRefs.map((ref) => (
                <div key={ref.id} className="group relative aspect-video rounded-md overflow-hidden ring-1 ring-border/50 bg-muted">
                  <img
                    src={ref.r2Url}
                    alt={ref.label || ref.sourceVideoId}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white hover:bg-red-500/30"
                      onClick={() => deleteRefMutation.mutate(ref.id)}
                      disabled={deleteRefMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No style references imported yet. Click "Import from Elevation" to get started.</p>
          )}
        </div>

        <Separator className="mb-4" />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : recordings && recordings.length > 0 ? (
          <div className="space-y-2">
            {recordings.map((rec) =>
              editingId === rec.id ? (
                <RecordingEditRow
                  key={rec.id}
                  recording={rec}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                />
              ) : (
                <div key={rec.id} className="group p-4 border rounded-lg hover:bg-muted/30 hover:border-border transition-all duration-150">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail preview */}
                    <div className="w-28 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/50">
                      {rec.thumbnailUrl ? (
                        <img
                          src={rec.thumbnailUrl}
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/60">
                          <Film className="w-5 h-5 text-muted-foreground/40" />
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
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingId(rec.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-500/10"
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
          <div className="text-center py-12">
            <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No recordings yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Recordings will appear here after your first stream</p>
          </div>
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

  // Thumbnail Studio state
  const [thumbnailMode, setThumbnailMode] = useState<'pastor-title' | 'service-overlay' | 'title-background' | 'manual' | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState("");
  const [aiSnapshotUrl, setAiSnapshotUrl] = useState("");
  const [aiTitle, setAiTitle] = useState(recording.title);
  const [aiSubtitle, setAiSubtitle] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Pastor upload state
  const [pastorImageUrl, setPastorImageUrl] = useState("");
  const [pastorLayout, setPastorLayout] = useState<"left" | "right">("right");
  const [uploadingPastor, setUploadingPastor] = useState(false);
  const pastorFileInputRef = useRef<HTMLInputElement>(null);

  // Frame capture state
  const [showFrameCapture, setShowFrameCapture] = useState(false);
  const [frameTimestamp, setFrameTimestamp] = useState(0);
  const [capturingFrame, setCapturingFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const candidates = recording.thumbnailCandidates || [];
  const currentThumb = customThumbUrl || selectedThumb || null;

  const handleModeChange = (mode: 'pastor-title' | 'service-overlay' | 'title-background' | 'manual') => {
    setThumbnailMode(thumbnailMode === mode ? null : mode);
    setGeneratedPreview("");
    setShowFrameCapture(false);
  };

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

  const handleGeneratePastorTitle = async () => {
    if (!pastorImageUrl || !aiTitle) {
      toast({ title: "Upload a pastor image and enter a title", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/recordings/admin/generate-thumbnail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: 'pastor-title', pastorImageUrl, layout: pastorLayout, title: aiTitle, subtitle: aiSubtitle || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      const { url } = await res.json();
      setGeneratedPreview(url);
      toast({ title: "Thumbnail generated! Review below." });
    } catch (err: any) {
      toast({ title: err.message || "Generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateServiceOverlay = async () => {
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
        body: JSON.stringify({ mode: 'service-overlay', snapshotUrl: aiSnapshotUrl, title: aiTitle, subtitle: aiSubtitle || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      const { url } = await res.json();
      setGeneratedPreview(url);
      toast({ title: "AI thumbnail generated! Review below." });
    } catch (err: any) {
      toast({ title: err.message || "Generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateTitleBackground = async () => {
    if (!aiTitle) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/recordings/admin/generate-thumbnail", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: 'title-background', snapshotUrl: null, title: aiTitle, subtitle: aiSubtitle || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      const { url } = await res.json();
      setGeneratedPreview(url);
      toast({ title: "AI thumbnail generated! Review below." });
    } catch (err: any) {
      toast({ title: err.message || "Generation failed", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptGenerated = () => {
    setCustomThumbUrl(generatedPreview);
    setGeneratedPreview("");
  };

  const handleRegenerate = () => {
    setGeneratedPreview("");
    if (thumbnailMode === 'pastor-title') {
      handleGeneratePastorTitle();
    } else if (thumbnailMode === 'service-overlay') {
      handleGenerateServiceOverlay();
    } else if (thumbnailMode === 'title-background') {
      handleGenerateTitleBackground();
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
      // Wait for the video to finish seeking so we capture the actual frame
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

      // Use data URL directly — avoids R2 round-trip that can fail server-side
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      if (!dataUrl || dataUrl === "data:,") throw new Error("Failed to capture frame");

      setAiSnapshotUrl(dataUrl);
      setShowFrameCapture(false);
      toast({ title: "Frame captured! Now generate your thumbnail." });
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

  const modeCards: Array<{
    mode: 'pastor-title' | 'service-overlay' | 'title-background' | 'manual';
    icon: typeof Wand2;
    label: string;
    desc: string;
    accent: string;
    borderActive: string;
    bgActive: string;
    ringActive: string;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      mode: 'pastor-title',
      icon: Wand2,
      label: 'Pastor + Title',
      desc: 'Upload a pastor PNG (transparent bg) — generates a colorful gradient background with title',
      accent: 'purple',
      borderActive: 'border-purple-500',
      bgActive: 'bg-purple-500/[0.05]',
      ringActive: 'ring-purple-500/20',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      mode: 'service-overlay',
      icon: Film,
      label: 'Title + Service Overlay',
      desc: 'Pick a snapshot of the service — it becomes the backdrop behind big bold centered title text',
      accent: 'amber',
      borderActive: 'border-amber-500',
      bgActive: 'bg-amber-500/[0.05]',
      ringActive: 'ring-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      mode: 'title-background',
      icon: Palette,
      label: 'Title + Colored Background',
      desc: 'AI generates a vibrant colorful background with your title centered — no snapshot needed',
      accent: 'emerald',
      borderActive: 'border-emerald-500',
      bgActive: 'bg-emerald-500/[0.05]',
      ringActive: 'ring-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      mode: 'manual',
      icon: MousePointer,
      label: 'Manual Select',
      desc: 'Pick from auto-captures or upload your own image',
      accent: 'blue',
      borderActive: 'border-blue-500',
      bgActive: 'bg-blue-500/[0.05]',
      ringActive: 'ring-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
  ];

  // AI result preview (shared between ai-pastor and ai-title)
  const renderAiPreview = () => {
    if (!generatedPreview) return null;
    return (
      <div className="space-y-3 mt-4">
        <Label className="text-sm font-medium">Generated Preview</Label>
        <div className="rounded-xl border-2 border-green-500/30 ring-2 ring-green-500/10 overflow-hidden">
          <img src={generatedPreview} alt="AI generated thumbnail" className="w-full aspect-video object-cover" />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="bg-green-600 text-white hover:bg-green-700"
            size="sm"
            onClick={handleAcceptGenerated}
          >
            <Check className="w-4 h-4 mr-1" />
            Use This Thumbnail
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Regenerating...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-1" /> Regenerate</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 border-2 border-amber-500/30 bg-amber-500/[0.02] rounded-xl space-y-5">
      {/* Title / Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`rec-title-${recording.id}`} className="text-sm font-medium">Title</Label>
          <Input
            id={`rec-title-${recording.id}`}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setAiTitle(e.target.value); }}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date</Label>
          <Input
            value={
              recording.streamStartedAt
                ? new Date(recording.streamStartedAt).toLocaleDateString()
                : "—"
            }
            disabled
            className="h-10"
          />
        </div>
      </div>

      {/* Description */}
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

      {/* Thumbnail Studio */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Image className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Thumbnail Studio</span>
        </div>

        {/* Current thumbnail preview */}
        {currentThumb && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Current Thumbnail</Label>
            <div className="flex items-center gap-3">
              <img
                src={currentThumb}
                alt="Current thumbnail"
                className="h-20 aspect-video object-cover rounded-lg border ring-1 ring-border/50"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setCustomThumbUrl(""); setSelectedThumb(""); }}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </div>
          </div>
        )}

        {/* 3-column mode selector cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {modeCards.map((card) => {
            const isActive = thumbnailMode === card.mode;
            const Icon = card.icon;
            return (
              <div
                key={card.mode}
                onClick={() => handleModeChange(card.mode)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isActive
                    ? `${card.borderActive} ${card.bgActive} ring-2 ${card.ringActive}`
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold">{card.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                {isActive && (
                  <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full ${card.iconBg} flex items-center justify-center`}>
                    <Check className={`w-3 h-3 ${card.iconColor}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mode content panels */}

        {/* Mode 1: Pastor + Title (Programmatic) */}
        {thumbnailMode === 'pastor-title' && (
          <div className="p-4 border border-purple-500/20 rounded-xl bg-purple-500/[0.03] space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5 text-purple-500" />
              </span>
              Pastor + Title Thumbnail
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a pre-edited pastor PNG (transparent background), pick a layout, and enter a title.
            </p>

            {/* Upload pastor image */}
            <div className="space-y-1">
              <Label className="text-xs">Upload Pastor PNG</Label>
              {!pastorImageUrl ? (
                <div
                  onClick={() => pastorFileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click to upload pastor PNG (transparent background)</p>
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
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/[0.05] border border-purple-500/20">
                  <div className="h-16 w-16 rounded border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                    <img src={pastorImageUrl} alt="Pastor" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs text-purple-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Pastor image uploaded
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={() => setPastorImageUrl("")}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              {uploadingPastor && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </div>
              )}
            </div>

            {/* Layout picker */}
            <div className="space-y-1">
              <Label className="text-xs">Layout</Label>
              <ToggleGroup
                type="single"
                value={pastorLayout}
                onValueChange={(val) => { if (val) setPastorLayout(val as "left" | "right"); }}
                className="justify-start"
              >
                <ToggleGroupItem value="left" className="gap-1.5 data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-600">
                  <span className="text-xs">Pastor Left / Text Right</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="right" className="gap-1.5 data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-600">
                  <span className="text-xs">Pastor Right / Text Left</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Title input */}
            <div className="space-y-1">
              <Label className="text-xs">Sermon Title (appears on thumbnail)</Label>
              <Input
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
                placeholder="e.g. God Is Good"
              />
            </div>

            {/* Subtitle input */}
            <div className="space-y-1">
              <Label className="text-xs">Subtitle (optional, smaller text below title)</Label>
              <Input
                value={aiSubtitle}
                onChange={(e) => setAiSubtitle(e.target.value)}
                placeholder="e.g. A Series on Grace"
              />
            </div>

            {/* Generate button OR result preview */}
            {!generatedPreview ? (
              <Button
                type="button"
                className="bg-purple-600 text-white hover:bg-purple-700"
                size="sm"
                disabled={aiGenerating || !pastorImageUrl || !aiTitle}
                onClick={handleGeneratePastorTitle}
              >
                {aiGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-1" /> Generate Thumbnail</>
                )}
              </Button>
            ) : (
              renderAiPreview()
            )}
          </div>
        )}

        {/* Mode 2: Title + Service Overlay */}
        {thumbnailMode === 'service-overlay' && (
          <div className="p-4 border border-amber-500/20 rounded-xl bg-amber-500/[0.03] space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-amber-500" />
              </span>
              Title + Service Overlay
            </p>
            <p className="text-xs text-muted-foreground">
              Pick a snapshot of the service — it becomes the backdrop behind big bold centered title text.
            </p>

            {/* Snapshot grid + Capture Frame card */}
            <div className="space-y-1">
              <Label className="text-xs">Select Service Snapshot</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {candidates.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setAiSnapshotUrl(url)}
                    className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${
                      aiSnapshotUrl === url
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={url} alt={`Snapshot ${i + 1}`} className="w-full h-full object-cover" />
                    {aiSnapshotUrl === url && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {/* + Capture Frame card */}
                <div
                  onClick={() => setShowFrameCapture(!showFrameCapture)}
                  className={`aspect-video rounded border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    showFrameCapture
                      ? "border-amber-500 bg-amber-500/[0.05]"
                      : "border-muted-foreground/30 hover:border-amber-500/50 hover:bg-amber-500/[0.02]"
                  }`}
                >
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">Capture Frame</span>
                </div>
              </div>
            </div>

            {/* Inline frame capture (expands below grid) */}
            {showFrameCapture && (
              <div className="p-3 border border-amber-500/10 rounded-lg bg-background/50 space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-xs whitespace-nowrap">Timestamp (seconds)</Label>
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
                    preload="auto"
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

            {/* Captured frame chip (if custom frame selected) */}
            {aiSnapshotUrl && !candidates.includes(aiSnapshotUrl) && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/20">
                <img src={aiSnapshotUrl} alt="Custom snapshot" className="h-12 aspect-video object-cover rounded border" />
                <span className="text-xs text-muted-foreground">Custom captured frame</span>
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={() => setAiSnapshotUrl("")}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Title input */}
            <div className="space-y-1">
              <Label className="text-xs">Sermon Title (appears on thumbnail)</Label>
              <Input
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
                placeholder="e.g. God Is Good"
              />
            </div>

            {/* Generate button OR result preview */}
            {!generatedPreview ? (
              <Button
                type="button"
                className="bg-amber-600 text-white hover:bg-amber-700"
                size="sm"
                disabled={aiGenerating || !aiSnapshotUrl || !aiTitle}
                onClick={handleGenerateServiceOverlay}
              >
                {aiGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating (~30s)...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-1" /> Generate Thumbnail</>
                )}
              </Button>
            ) : (
              renderAiPreview()
            )}
          </div>
        )}

        {/* Mode 3: Title + Colored Background */}
        {thumbnailMode === 'title-background' && (
          <div className="p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/[0.03] space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              Title + Colored Background
            </p>
            <p className="text-xs text-muted-foreground">
              Generate a warm, painterly background with your title centered — no snapshot needed.
            </p>

            <div className="space-y-1">
              <Label className="text-xs">Title (appears on thumbnail)</Label>
              <Input
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
                placeholder="e.g. God Is Good"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Subtitle (optional, smaller text below title)</Label>
              <Input
                value={aiSubtitle}
                onChange={(e) => setAiSubtitle(e.target.value)}
                placeholder="e.g. A Series on Grace"
              />
            </div>

            {!generatedPreview ? (
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                size="sm"
                disabled={aiGenerating || !aiTitle}
                onClick={handleGenerateTitleBackground}
              >
                {aiGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating (~30s)...</>
                ) : (
                  <><Palette className="w-4 h-4 mr-1" /> Generate Thumbnail</>
                )}
              </Button>
            ) : (
              renderAiPreview()
            )}
          </div>
        )}

        {/* Mode 4: Manual Select */}
        {thumbnailMode === 'manual' && (
          <div className="p-4 border border-blue-500/20 rounded-xl bg-blue-500/[0.03] space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <MousePointer className="w-3.5 h-3.5 text-blue-500" />
              </span>
              Manual Select
            </p>

            {/* Candidates grid */}
            {candidates.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Auto-Captured Thumbnails</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {candidates.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelectedThumb(url); setCustomThumbUrl(""); }}
                      className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedThumb === url && !customThumbUrl
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      {selectedThumb === url && !customThumbUrl && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload + URL */}
            <div className="space-y-2">
              <Label className="text-xs">Upload or Paste URL</Label>
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
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <Button
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
      <Card className="shadow-md border-0 ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Review and approve new member registrations</p>
            </div>
            {pending && pending.length > 0 && (
              <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20 tabular-nums">{pending.length} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : pending && pending.length > 0 ? (
            <div className="space-y-2">
              {pending.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
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
                      className="bg-green-600 text-white hover:bg-green-700 shadow-sm"
                      onClick={() => approveMutation.mutate(m.id)}
                      disabled={approveMutation.isPending}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
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
            <div className="text-center py-10">
              <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No pending registrations</p>
              <p className="text-xs text-muted-foreground/60 mt-1">New member signups will appear here for review</p>
            </div>
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
    <Card className="shadow-md border-0 ring-1 ring-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Manage Members</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Set roles, titles, and group permissions</p>
          </div>
          {allMembers && (
            <Badge variant="secondary" className="ml-auto tabular-nums">{allMembers.length} members</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : allMembers && allMembers.length > 0 ? (
          <div className="space-y-2">
            {allMembers.map((m) => (
              <MemberRow key={m.id} member={m} groups={groups || []} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No approved members</p>
          </div>
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
    <div className="p-4 border rounded-lg hover:bg-muted/30 transition-colors space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{member.firstName} {member.lastName}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        {isDirty && (
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
                className={`cursor-pointer ${groupAdminIds.includes(g.id) ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0" : ""}`}
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
    <Card className="shadow-md border-0 ring-1 ring-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Prayer Requests</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Manage prayer submissions from members</p>
            </div>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {["active", "answered", "archived"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "ghost"}
                className={filter === s ? "shadow-sm h-8" : "h-8 text-muted-foreground"}
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
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
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
          <div className="text-center py-10">
            <HandHeart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No {filter} prayer requests</p>
          </div>
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
        <Card className="shadow-md border-0 ring-1 ring-border/50 overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">${(totalSucceeded / 100).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0 ring-1 ring-border/50 overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{donations?.filter((d) => d.status === "succeeded").length || 0}</p>
                <p className="text-sm text-muted-foreground">Successful Donations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-0 ring-1 ring-border/50 overflow-hidden">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center">
                <Church className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{funds?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Fund Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Management */}
      <Card className="shadow-md border-0 ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Fund Categories</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Create and manage giving funds</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fundsLoading ? (
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          ) : (
            <div className="space-y-2 mb-4">
              {funds?.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                  </div>
                  <Badge variant={f.isActive ? "default" : "secondary"} className={f.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
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
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
      <Card className="shadow-md border-0 ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Recent Donations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {donationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
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
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
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
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No donations yet</p>
            </div>
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
      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground flex items-start gap-2">
        <Cast className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
        Configure YouTube and Facebook restreaming. When OBS starts streaming, the server automatically forwards to enabled platforms.
      </div>
      {configsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
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
    <Card className="shadow-md border-0 ring-1 ring-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cast className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-lg">{label}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${statusColor} text-white border-0 capitalize`}>
              {status?.status || "idle"}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Enabled</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status?.errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-500/20">
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
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
      <Card className="shadow-md border-0 ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Event Management</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Create and manage church events</p>
            </div>
            {events && (
              <Badge variant="secondary" className="ml-auto tabular-nums">{events.length} events</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-2">
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
                  <div key={event.id} className="group p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.featured && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Featured</Badge>
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
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingId(event.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-500/10"
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
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No events created yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first event below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Form */}
      <Card className="shadow-md border-0 ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Create New Event</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Schedule a new church event</p>
            </div>
          </div>
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
                      className={`cursor-pointer ${newGroupIds.includes(g.id) ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0" : ""}`}
                      onClick={() => toggleGroupId(g.id)}
                    >
                      {g.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
    <div className="p-5 border-2 border-amber-500/30 bg-amber-500/[0.02] rounded-xl space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
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
                className={`cursor-pointer ${groupIds.includes(g.id) ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0" : ""}`}
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
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
    <Card className="shadow-md border-0 ring-1 ring-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Church className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Group Management</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Organize members into chat and announcement groups</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-2 mb-4">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  </div>
                  {g.type === "announcement" && (
                    <Badge variant="outline" className="text-xs">Announcement</Badge>
                  )}
                  {g.isDefault && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Default</Badge>
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
          <div className="text-center py-10 mb-4">
            <Church className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No groups created yet</p>
          </div>
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
            className="border rounded-lg px-3 py-2 text-sm bg-background h-10 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="chat">Chat</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-sm hover:shadow-md transition-all"
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
