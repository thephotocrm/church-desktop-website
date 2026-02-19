import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { Cross, LogIn } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function MemberLogin() {
  useSEO({ title: "Member Login", description: "Sign in to your church member account" });
  const [, navigate] = useLocation();
  const { login } = useMemberAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Login failed");
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
          <CardTitle className="text-2xl">Member Sign In</CardTitle>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Access your church profile and directory
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 text-red-600 text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-white border-gold" disabled={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-gold hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
