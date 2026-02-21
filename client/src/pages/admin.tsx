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
  Edit2, MapPin, Clock
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
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="stream"><Video className="w-4 h-4 mr-1" />Stream</TabsTrigger>
            <TabsTrigger value="restream"><Cast className="w-4 h-4 mr-1" />Restream</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-1" />Members</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1" />Events</TabsTrigger>
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
