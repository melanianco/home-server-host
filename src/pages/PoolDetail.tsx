import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Server, 
  ArrowLeft,
  Copy,
  Cpu,
  MemoryStick,
  HardDrive,
  Loader2,
  User,
  Trash2,
  ExternalLink
} from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type PoolRow = Tables<"pools">;
type ContributorRow = Tables<"pool_contributors"> & {
  profiles?: { display_name: string | null; user_id: string } | null;
};

const PoolDetail = () => {
  const { poolId } = useParams();
  const [pool, setPool] = useState<PoolRow | null>(null);
  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      if (poolId) {
        // Fetch pool details
        const { data: poolData, error: poolError } = await supabase
          .from("pools")
          .select("*")
          .eq("id", poolId)
          .single();

        if (poolError || !poolData) {
          toast({ title: "Pool not found", variant: "destructive" });
          navigate("/dashboard");
          return;
        }

        setPool(poolData);

        // Fetch contributors
        const { data: contributorsData } = await supabase
          .from("pool_contributors")
          .select("*")
          .eq("pool_id", poolId);

        if (contributorsData) {
          // Fetch profiles for each contributor
          const userIds = contributorsData.map(c => c.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
          
          const contributorsWithProfiles = contributorsData.map(c => ({
            ...c,
            profiles: profilesMap.get(c.user_id) || null
          }));

          setContributors(contributorsWithProfiles);
        }
      }

      setLoading(false);
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [poolId, navigate, toast]);

  const copyInviteLink = () => {
    if (!pool) return;
    const link = `${window.location.origin}/join/${pool.invite_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Invite link copied!" });
  };

  const removeContributor = async (contributorId: string) => {
    const { error } = await supabase
      .from("pool_contributors")
      .delete()
      .eq("id", contributorId);

    if (error) {
      toast({ title: "Failed to remove contributor", variant: "destructive" });
    } else {
      setContributors(contributors.filter(c => c.id !== contributorId));
      toast({ title: "Contributor removed" });
    }
  };

  const isOwner = pool?.owner_id === user?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!pool) return null;

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
              POOL DETAILS
            </span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Pool Header */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {pool.name}
                </h1>
                {pool.description && (
                  <p className="text-muted-foreground mt-1">{pool.description}</p>
                )}
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                  pool.is_public 
                    ? "bg-secondary/10 text-secondary border border-secondary/30" 
                    : "bg-muted text-muted-foreground border border-border"
                }`}>
                  {pool.is_public ? "PUBLIC" : "PRIVATE"}
                </span>
              </div>
            </div>
            {isOwner && (
              <Button 
                onClick={copyInviteLink}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </Button>
            )}
          </div>
        </div>

        {/* Invite Link Box */}
        {isOwner && (
          <div className="bg-card/50 backdrop-blur-sm border border-secondary/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Invite Link</p>
                <code className="text-foreground font-mono text-sm bg-muted px-2 py-1 rounded">
                  {window.location.origin}/join/{pool.invite_code}
                </code>
              </div>
              <Button variant="outline" size="sm" onClick={copyInviteLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Resource Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-4 text-center">
            <Cpu className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">
              {pool.total_cpu_cores || 0}
            </div>
            <div className="text-xs text-muted-foreground">CPU Cores</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-secondary/30 rounded-lg p-4 text-center">
            <MemoryStick className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">
              {pool.total_ram_gb || 0}
            </div>
            <div className="text-xs text-muted-foreground">GB RAM</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-accent/30 rounded-lg p-4 text-center">
            <HardDrive className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">
              {pool.total_storage_gb || 0}
            </div>
            <div className="text-xs text-muted-foreground">GB Storage</div>
          </div>
        </div>

        {/* Contributors List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            CONTRIBUTORS ({contributors.length})
          </h2>

          {contributors.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No contributors yet. Share your invite link!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributors.map((contributor) => (
                <div 
                  key={contributor.id}
                  className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {contributor.profiles?.display_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className={`px-2 py-0.5 rounded ${
                          contributor.status === "online" 
                            ? "bg-neon-green/10 text-neon-green" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {contributor.status.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> {contributor.cpu_cores || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MemoryStick className="w-3 h-3" /> {contributor.ram_gb || 0} GB
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> {contributor.storage_gb || 0} GB
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeContributor(contributor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PoolDetail;
