import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { Users, Search, Mail, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

interface DirectoryMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  role: string;
  title: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function Directory() {
  useSEO({ title: "Member Directory", description: "Browse church member directory" });
  const [, navigate] = useLocation();
  const { member, isLoading: authLoading } = useMemberAuth();
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery<DirectoryMember[]>({
    queryKey: ["/api/members/directory"],
    enabled: !!member && member.status === "approved",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!member) {
    navigate("/member-login");
    return null;
  }

  if (member.status !== "approved") {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Users className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Directory Access</h1>
          <p className="text-muted-foreground font-body">
            Your account is pending approval. You'll be able to access the member directory once an admin approves your account.
          </p>
        </div>
      </div>
    );
  }

  const filtered = members?.filter(
    (m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-bold">Member Directory</h1>
          <Badge variant="outline" className="ml-2">{filtered.length} members</Badge>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((m) => (
              <motion.div key={m.id} variants={fadeUp}>
                <Card className="p-4 hover-elevate">
                  <div className="flex items-center gap-3">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.firstName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                        <User className="w-6 h-6 text-accent-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{m.title ? `${m.title} ` : ""}{m.firstName} {m.lastName}</p>
                      {m.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />{m.email}
                        </p>
                      )}
                      {m.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{m.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
