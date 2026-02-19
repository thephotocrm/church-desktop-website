import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { Cross, UserPlus } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function Register() {
  useSEO({ title: "Register", description: "Create your church member account" });
  const [, navigate] = useLocation();
  const { register } = useMemberAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mx-auto mb-3">
            <Cross className="w-6 h-6 text-accent-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Join the First Pentecostal Church community
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 text-red-600 text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-white border-gold" disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/member-login" className="text-gold hover:underline">
              Sign in
            </Link>
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            Your account will need admin approval before you can access the directory.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
