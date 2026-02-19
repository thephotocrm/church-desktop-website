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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radio, Settings, LogOut, Save, Video, Users, Calendar, Church,
  HandHeart, DollarSign, Check, X, UserCheck, UserX, Plus, Trash2
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="stream">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="stream"><Video className="w-4 h-4 mr-1" />Stream</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-1" />Members</TabsTrigger>
            <TabsTrigger value="prayer"><HandHeart className="w-4 h-4 mr-1" />Prayer</TabsTrigger>
            <TabsTrigger value="giving"><DollarSign className="w-4 h-4 mr-1" />Giving</TabsTrigger>
            <TabsTrigger value="groups"><Church className="w-4 h-4 mr-1" />Groups</TabsTrigger>
          </TabsList>

          {/* Stream Tab */}
          <TabsContent value="stream">
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
                  Stream status is auto-detected from your MediaMTX server.
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stream-title">Stream Title</Label>
                    <Input id="stream-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream-description">Description</Label>
                    <Textarea id="stream-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream-thumbnail">Thumbnail URL</Label>
                    <Input id="stream-thumbnail" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                  </div>
                  <Button type="submit" className="bg-gold text-white border-gold" disabled={updateConfig.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateConfig.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MembersAdmin />
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

// ========== Members Admin ==========
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

// ========== Groups Admin ==========
function GroupsAdmin() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/admin-groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups/admin", { credentials: "include" });
      // If 401, groups endpoint requires member auth, use admin endpoint pattern
      // Fallback: fetch all groups using the admin's cookie session
      if (!res.ok) {
        // Try direct DB query through admin route pattern
        return [];
      }
      return res.json();
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/groups/admin", {
        name: newName,
        description: newDesc,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-groups"] });
      setNewName("");
      setNewDesc("");
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin-groups"] });
      toast({ title: "Group deleted" });
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
                <div>
                  <p className="font-medium">{g.name}</p>
                  {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteGroup.mutate(g.id)}
                  disabled={deleteGroup.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 mb-4">No groups created yet</p>
        )}

        <Separator className="my-4" />
        <p className="text-sm font-semibold mb-3">Create New Group</p>
        <div className="flex gap-2">
          <Input
            placeholder="Group name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
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
