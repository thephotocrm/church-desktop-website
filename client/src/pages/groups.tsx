import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Groups() {
  useSEO({ title: "Groups", description: "Join church groups and connect with others" });
  const [, navigate] = useLocation();
  const { member, isLoading: authLoading } = useMemberAuth();
  const { toast } = useToast();

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!member && member.status === "approved",
  });

  const { data: myGroups } = useQuery<Group[]>({
    queryKey: ["/api/members/me/groups"],
    enabled: !!member,
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/groups"] });
      toast({ title: "Joined group!" });
    },
    onError: () => {
      toast({ title: "Failed to join group", variant: "destructive" });
    },
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("DELETE", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/groups"] });
      toast({ title: "Left group" });
    },
    onError: () => {
      toast({ title: "Failed to leave group", variant: "destructive" });
    },
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
          <h1 className="text-2xl font-bold mb-2">Groups</h1>
          <p className="text-muted-foreground font-body">
            Your account is pending approval. You'll be able to join groups once approved.
          </p>
        </div>
      </div>
    );
  }

  const myGroupIds = new Set(myGroups?.map((g) => g.id) || []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-bold">Church Groups</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-5 bg-muted rounded w-1/2 mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {groups?.map((group) => {
              const isMember = myGroupIds.has(group.id);
              return (
                <motion.div key={group.id} variants={fadeUp}>
                  <Card className="hover-elevate">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {isMember && <Badge className="bg-gold text-white border-gold">Joined</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {group.description && (
                        <p className="text-sm text-muted-foreground font-body mb-4">{group.description}</p>
                      )}
                      {isMember ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => leaveGroup.mutate(group.id)}
                          disabled={leaveGroup.isPending}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Leave
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-gold text-white border-gold"
                          onClick={() => joinGroup.mutate(group.id)}
                          disabled={joinGroup.isPending}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!isLoading && (!groups || groups.length === 0) && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No groups available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
