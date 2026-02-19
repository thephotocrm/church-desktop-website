import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { DollarSign, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";

interface Donation {
  id: string;
  amountCents: number;
  currency: string;
  type: string;
  frequency: string | null;
  status: string;
  createdAt: string;
  fundCategoryId: string;
}

export default function GivingHistory() {
  useSEO({ title: "Giving History", description: "View your donation history" });
  const [, navigate] = useLocation();
  const { member, isLoading: authLoading } = useMemberAuth();

  useEffect(() => {
    if (!authLoading && !member) {
      navigate("/member-login");
    }
  }, [authLoading, member, navigate]);

  const { data: donations, isLoading } = useQuery<Donation[]>({
    queryKey: ["/api/giving/history"],
    enabled: !!member,
  });

  if (authLoading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    succeeded: "bg-green-500",
    pending: "bg-yellow-500",
    failed: "bg-red-500",
    refunded: "bg-blue-500",
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/give">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Give
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-bold">Giving History</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : donations && donations.length > 0 ? (
          <div className="space-y-3">
            {donations.map((d) => (
              <Card key={d.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        ${(d.amountCents / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(d.createdAt).toLocaleDateString()}
                        {d.type === "recurring" && d.frequency && (
                          <Badge variant="outline" className="text-xs capitalize">{d.frequency}</Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={`${statusColors[d.status] || "bg-gray-500"} text-white border-0 capitalize`}>
                      {d.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold mb-1">No donations yet</p>
            <p className="text-muted-foreground font-body">
              Your giving history will appear here after your first donation.
            </p>
            <Link href="/give">
              <Button className="mt-4 bg-gold text-white border-gold">Make a Donation</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
