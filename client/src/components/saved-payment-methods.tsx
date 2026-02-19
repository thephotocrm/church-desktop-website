import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Trash2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export function SavedPaymentMethods() {
  const { member } = useMemberAuth();
  const { toast } = useToast();

  const { data: methods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/giving/payment-methods"],
    enabled: !!member,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/giving/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/giving/payment-methods"] });
      toast({ title: "Payment method removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove payment method", variant: "destructive" });
    },
  });

  if (!member || isLoading) return null;
  if (!methods || methods.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" />
          Saved Cards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {methods.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">{m.brand} **** {m.last4}</p>
                <p className="text-xs text-muted-foreground">Expires {m.expMonth}/{m.expYear}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeMutation.mutate(m.id)}
              disabled={removeMutation.isPending}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
