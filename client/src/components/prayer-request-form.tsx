import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMemberAuth } from "@/hooks/use-member-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export function PrayerRequestForm() {
  const { member } = useMemberAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (!member && !authorName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/prayer-requests", {
        title: title.trim(),
        body: body.trim(),
        authorName: !member ? authorName.trim() : undefined,
        isAnonymous,
        isPublic: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-requests"] });
      toast({ title: "Prayer request submitted" });
      setTitle("");
      setBody("");
      setAuthorName("");
      setIsAnonymous(false);
    } catch {
      toast({ title: "Failed to submit prayer request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Submit a Prayer Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!member && (
            <div className="space-y-2">
              <Label htmlFor="authorName">Your Name</Label>
              <Input
                id="authorName"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="prayerTitle">Title</Label>
            <Input
              id="prayerTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your request"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prayerBody">Prayer Request</Label>
            <Textarea
              id="prayerBody"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your prayer request..."
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="text-sm">Post anonymously</Label>
            </div>
          </div>
          <Button type="submit" className="w-full bg-gold text-white border-gold" disabled={submitting}>
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Prayer Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
