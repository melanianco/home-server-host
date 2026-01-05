import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  ArrowLeft, 
  Loader2,
  Link as LinkIcon,
  Globe,
  Lock
} from "lucide-react";

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CreatePool = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Missing fields",
        description: "Please enter a pool name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const inviteCode = generateInviteCode();

      const { error } = await supabase.from("pools").insert({
        owner_id: user.id,
        name,
        description: description || null,
        invite_code: inviteCode,
        is_public: isPublic,
      });

      if (error) throw error;

      toast({
        title: "Pool created!",
        description: "Your resource pool is ready. Share the invite link with friends!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create pool",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-secondary" />
            <span className="font-display text-lg font-bold text-foreground">
              CREATE POOL
            </span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                NEW RESOURCE POOL
              </h1>
              <p className="text-muted-foreground text-sm">
                Create a pool to share resources with friends
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pool Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Pool Name *
              </Label>
              <Input
                id="name"
                placeholder="Gaming Squad Pool"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border focus:border-secondary"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="A pool for our gaming group to share resources..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border focus:border-secondary resize-none"
                rows={3}
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-secondary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-foreground font-semibold">Public Pool</p>
                  <p className="text-muted-foreground text-sm">
                    {isPublic 
                      ? "Anyone can find and request to join this pool"
                      : "Only people with the invite link can join"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Info Box */}
            <div className="bg-secondary/5 border border-secondary/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-secondary mt-0.5" />
                <div className="text-sm">
                  <p className="text-foreground font-semibold mb-1">Invite Link</p>
                  <p className="text-muted-foreground">
                    After creating your pool, you'll get a unique invite link to share with friends. 
                    Contributors can share their CPU, RAM, and storage with your pool.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold glow-magenta"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Pool"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePool;
