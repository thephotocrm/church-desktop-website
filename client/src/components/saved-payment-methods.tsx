import { useQuery, useMutation } from "@tanstack/react-query";
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

const C = {
  INK2: "#231E1A",
  GOLD: "#C9943A",
  GOLD_DIM: "rgba(201,148,58,0.18)",
  WARM_GRAY: "#8C8078",
  BORDER: "rgba(255,255,255,0.07)",
  MUTED: "rgba(255,255,255,0.35)",
} as const;

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
    <div
      className="rounded-[20px] p-6"
      style={{ background: C.INK2, border: `1px solid ${C.BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: C.GOLD_DIM }}
        >
          <CreditCard className="w-4 h-4" style={{ color: C.GOLD }} />
        </div>
        <h3 className="text-white font-['Open_Sans'] text-[16px] font-bold">Saved Cards</h3>
      </div>

      {/* Cards list */}
      <div className="space-y-1">
        {methods.map((m, i) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-3"
            style={i < methods.length - 1 ? { borderBottom: `1px solid ${C.BORDER}` } : undefined}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" style={{ color: C.WARM_GRAY }} />
              <div>
                <p className="text-white font-['Open_Sans'] text-[14px] font-medium capitalize">
                  {m.brand} •••• {m.last4}
                </p>
                <p className="font-['Open_Sans'] text-[11px]" style={{ color: C.MUTED }}>
                  Expires {m.expMonth}/{m.expYear}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeMutation.mutate(m.id)}
              disabled={removeMutation.isPending}
              className="p-2 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: C.WARM_GRAY }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
