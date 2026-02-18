import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Radio, Settings, LogOut, Save, Video, Users, Calendar, Church } from "lucide-react";
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

  // Redirect to login if not authenticated
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
      toast({ title: "Settings saved", description: "Stream configuration updated successfully." });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-gold" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Logged in as <strong>{user.username}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stream Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-gold" />
                <CardTitle>Live Stream</CardTitle>
              </div>
              {streamStatus?.isLive ? (
                <Badge className="bg-red-600 text-white border-red-600">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary">Offline</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 rounded-md bg-muted text-sm text-muted-foreground">
              Stream status is auto-detected from your MediaMTX server. Start streaming with OBS and the player will go live automatically.
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-title">Stream Title</Label>
                <Input
                  id="stream-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Worship Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stream-description">Description</Label>
                <Textarea
                  id="stream-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the stream"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stream-thumbnail">Thumbnail URL</Label>
                <Input
                  id="stream-thumbnail"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
              <Button
                type="submit"
                className="bg-gold text-white border-gold"
                disabled={updateConfig.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateConfig.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Future Sections Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="opacity-60">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 text-gold mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Events</h3>
              <p className="text-sm text-muted-foreground">Manage church events</p>
              <Badge variant="outline" className="mt-3">Coming Soon</Badge>
            </CardContent>
          </Card>
          <Card className="opacity-60">
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-gold mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Leadership</h3>
              <p className="text-sm text-muted-foreground">Manage leaders &amp; staff</p>
              <Badge variant="outline" className="mt-3">Coming Soon</Badge>
            </CardContent>
          </Card>
          <Card className="opacity-60">
            <CardContent className="pt-6 text-center">
              <Church className="w-8 h-8 text-gold mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Ministries</h3>
              <p className="text-sm text-muted-foreground">Manage ministry groups</p>
              <Badge variant="outline" className="mt-3">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
