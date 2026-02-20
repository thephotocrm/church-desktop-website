import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { useGroupChat, type ChatMessage } from "@/hooks/use-group-chat";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, UserPlus, UserMinus, Send, ArrowLeft, MessageSquare, Megaphone, Search, Hash,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean | null;
  createdAt: string;
}

export default function Groups() {
  useSEO({ title: "Groups", description: "Join church groups and connect with others" });
  const [, navigate] = useLocation();
  const { member, isLoading: authLoading } = useMemberAuth();
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: myGroups, isLoading: myGroupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/members/me/groups"],
    enabled: !!member,
  });

  const selectedGroup = myGroups?.find((g) => g.id === selectedGroupId) || null;

  // Auto-select first group on load
  useEffect(() => {
    if (myGroups && myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id);
    }
  }, [myGroups, selectedGroupId]);

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

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Left Sidebar - group list */}
        <div
          className={`${
            showSidebar ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-80 lg:w-96 border-r bg-card shrink-0`}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <h2 className="font-semibold text-lg">My Groups</h2>
            </div>
            <BrowseGroupsDialog member={member} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {myGroupsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : myGroups && myGroups.length > 0 ? (
              <div className="py-2">
                {myGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setShowSidebar(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                      selectedGroupId === group.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      {group.type === "announcement" ? (
                        <Megaphone className="w-5 h-5 text-gold" />
                      ) : (
                        <Hash className="w-5 h-5 text-gold" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{group.name}</p>
                        {group.type === "announcement" && (
                          <Badge variant="outline" className="text-xs shrink-0">Announcements</Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No groups joined yet</p>
                <p className="text-xs mt-1">Browse groups to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - chat view */}
        <div
          className={`${
            !showSidebar ? "flex" : "hidden"
          } md:flex flex-col flex-1 min-w-0`}
        >
          {selectedGroup ? (
            <ChatView
              group={selectedGroup}
              member={member}
              onBack={() => setShowSidebar(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a group to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat view for a selected group
function ChatView({
  group,
  member,
  onBack,
}: {
  group: Group;
  member: { id: string; role: string; firstName: string; lastName: string };
  onBack: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages: wsMessages, sendMessage, isConnected, setInitialMessages } = useGroupChat(group.id);

  const { data: historicalMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/groups/${group.id}/messages`],
    enabled: !!group.id,
  });

  // Load historical messages into the chat hook
  useEffect(() => {
    if (historicalMessages) {
      setInitialMessages(historicalMessages);
    }
  }, [historicalMessages, setInitialMessages]);

  // Combine: historical messages are set as initial, WS messages append
  const allMessages = wsMessages;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canPost = group.type !== "announcement" || member.role === "admin";

  return (
    <>
      {/* Chat header */}
      <div className="p-4 border-b flex items-center gap-3 bg-card">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          {group.type === "announcement" ? (
            <Megaphone className="w-5 h-5 text-gold" />
          ) : (
            <Hash className="w-5 h-5 text-gold" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{group.name}</h3>
          <div className="flex items-center gap-2">
            {group.type === "announcement" && (
              <span className="text-xs text-muted-foreground">Announcement channel</span>
            )}
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
          </div>
        </div>
      </div>

      {/* Announcement banner */}
      {group.type === "announcement" && !canPost && (
        <div className="px-4 py-2 bg-muted text-muted-foreground text-sm flex items-center gap-2 border-b">
          <Megaphone className="w-4 h-4" />
          Only admins can post in this group
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            {canPost && <p className="text-xs mt-1">Be the first to send a message!</p>}
          </div>
        )}
        {allMessages.map((msg) => {
          const isOwn = msg.memberId === member.id;
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 text-xs font-semibold text-gold">
                {msg.sender
                  ? `${msg.sender.firstName[0]}${msg.sender.lastName[0]}`
                  : "?"}
              </div>
              <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {msg.sender
                      ? `${msg.sender.firstName} ${msg.sender.lastName}`
                      : "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`inline-block px-3 py-2 rounded-lg text-sm ${
                    isOwn
                      ? "bg-gold text-white"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      {canPost && (
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              className="bg-gold text-white border-gold"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// Dialog to browse and join/leave groups
function BrowseGroupsDialog({ member }: { member: { id: string } }) {
  const { toast } = useToast();

  const { data: allGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!member,
  });

  const { data: myGroups } = useQuery<Group[]>({
    queryKey: ["/api/members/me/groups"],
    enabled: !!member,
  });

  const myGroupIds = new Set(myGroups?.map((g) => g.id) || []);

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
    onError: (err: Error) => {
      toast({ title: err.message || "Failed to leave group", variant: "destructive" });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-1" />
          Browse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Browse Groups</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {allGroups?.map((group) => {
            const isMember = myGroupIds.has(group.id);
            return (
              <div key={group.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{group.name}</p>
                    {group.type === "announcement" && (
                      <Badge variant="outline" className="text-xs">Announcements</Badge>
                    )}
                    {isMember && (
                      <Badge className="bg-gold text-white border-gold text-xs">Joined</Badge>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
                <div className="shrink-0 ml-3">
                  {isMember ? (
                    !group.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => leaveGroup.mutate(group.id)}
                        disabled={leaveGroup.isPending}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Leave
                      </Button>
                    )
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
                </div>
              </div>
            );
          })}
          {(!allGroups || allGroups.length === 0) && (
            <p className="text-center text-muted-foreground py-4">No groups available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
