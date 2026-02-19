import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Save, LogOut, Shield } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function Profile() {
  useSEO({ title: "My Profile", description: "Manage your church member profile" });
  const [, navigate] = useLocation();
  const { member, isLoading, logout, refreshProfile } = useMemberAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    hidePhone: false,
    hideEmail: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !member) {
      navigate("/member-login");
    }
  }, [isLoading, member, navigate]);

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone || "",
        hidePhone: member.hidePhone || false,
        hideEmail: member.hideEmail || false,
      });
    }
  }, [member]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/members/me", form);
      await refreshProfile();
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusColor = member.status === "approved" ? "bg-green-500" : member.status === "pending" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Info</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                <Badge className={`${statusColor} text-white border-0 capitalize`}>{member.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {member.status === "pending" && (
              <div className="p-3 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your account is pending approval. You'll have full access once an admin approves your registration.
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={member.email} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="border rounded-md p-4 space-y-3">
                <p className="text-sm font-semibold">Privacy Settings</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hidePhone" className="text-sm">Hide phone from directory</Label>
                  <Switch
                    id="hidePhone"
                    checked={form.hidePhone}
                    onCheckedChange={(checked) => setForm({ ...form, hidePhone: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hideEmail" className="text-sm">Hide email from directory</Label>
                  <Switch
                    id="hideEmail"
                    checked={form.hideEmail}
                    onCheckedChange={(checked) => setForm({ ...form, hideEmail: checked })}
                  />
                </div>
              </div>

              <Button type="submit" className="bg-gold text-white border-gold" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
