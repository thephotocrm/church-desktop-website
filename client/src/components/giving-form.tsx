import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Heart, ArrowRight } from "lucide-react";

interface FundCategory {
  id: string;
  name: string;
  description: string | null;
}

const presetAmounts = [10, 25, 50, 100];

export function GivingForm() {
  const { member } = useMemberAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [fundId, setFundId] = useState("");
  const [type, setType] = useState<"one_time" | "recurring">("one_time");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(false);

  const { data: funds } = useQuery<FundCategory[]>({
    queryKey: ["/api/giving/funds"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1) {
      toast({ title: "Please enter a valid amount (minimum $1.00)", variant: "destructive" });
      return;
    }
    if (!fundId) {
      toast({ title: "Please select a fund", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/giving/checkout-session", {
        amountCents: Math.round(amountNum * 100),
        fundCategoryId: fundId,
        type,
        frequency: type === "recurring" ? frequency : undefined,
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to create payment session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-gold" />
          <CardTitle className="text-lg">Make a Donation</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fund selector */}
          <div className="space-y-2">
            <Label>Select Fund</Label>
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a fund..." />
              </SelectTrigger>
              <SelectContent>
                {funds?.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount presets */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === String(preset) ? "default" : "outline"}
                  className={amount === String(preset) ? "bg-gold text-white border-gold" : ""}
                  size="sm"
                  onClick={() => setAmount(String(preset))}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* One-time vs Recurring */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as "one_time" | "recurring")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one_time">One-Time</TabsTrigger>
                <TabsTrigger value="recurring">Recurring</TabsTrigger>
              </TabsList>
              <TabsContent value="recurring" className="pt-3">
                <Select value={frequency} onValueChange={(v) => setFrequency(v as "weekly" | "monthly")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>

          {!member && (
            <p className="text-xs text-muted-foreground">
              <a href="/member-login" className="text-gold hover:underline">Sign in</a> to save your payment method for future donations.
            </p>
          )}

          <Button type="submit" className="w-full bg-gold text-white border-gold" size="lg" disabled={loading}>
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? "Processing..." : `Give${amount ? ` $${amount}` : ""}`}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
