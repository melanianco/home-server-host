import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Server, 
  Loader2,
  CheckCircle,
  XCircle,
  Cpu,
  MemoryStick,
  HardDrive
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Pool {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  total_cpu_cores: number;
  total_ram_gb: number;
  total_storage_gb: number;
}

const JoinPool = () => {
  const { inviteCode } = useParams();
  const [pool, setPool] = useState<Pool | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch pool by invite code
      if (inviteCode) {
        const { data: poolData, error: poolError } = await supabase
          .from("pools")
          .select("*")
          .eq("invite_code", inviteCode)
          .single();

        if (poolError || !poolData) {
          setError("Invalid or expired invite link");
        } else {
          setPool(poolData);

          // Check if already a member
          if (session?.user) {
            const { data: membership } = await supabase
              .from("pool_contributors")
              .select("id")
              .eq("pool_id", poolData.id)
              .eq("user_id", session.user.id)
              .single();

            if (membership) {
              setAlreadyMember(true);
            }
          }
        }
      }

      setLoading(false);
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!user) {
      navigate(`/auth?redirect=/join/${inviteCode}`);
      return;
    }

    if (!pool) return;

    setJoining(true);

    try {
      const { error } = await supabase.from("pool_contributors").insert({
        pool_id: pool.id,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Joined pool!",
        description: `You're now a contributor to ${pool.name}`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join pool",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Server className="w-10 h-10 text-primary" />
          <span className="font-display text-2xl font-bold text-foreground">
            SERVER<span className="text-primary">POOL</span>
          </span>
        </Link>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8">
          {error ? (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                INVALID INVITE
              </h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link to="/">
                <Button className="bg-primary text-primary-foreground">
                  Go Home
                </Button>
              </Link>
            </div>
          ) : alreadyMember ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                ALREADY A MEMBER
              </h1>
              <p className="text-muted-foreground mb-6">
                You're already contributing to {pool?.name}
              </p>
              <Link to="/dashboard">
                <Button className="bg-primary text-primary-foreground">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : pool ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  JOIN POOL
                </h1>
                <p className="text-muted-foreground text-sm">
                  You've been invited to contribute resources
                </p>
              </div>

              <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                  {pool.name}
                </h2>
                {pool.description && (
                  <p className="text-muted-foreground text-sm">{pool.description}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Cpu className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-semibold text-foreground">{pool.total_cpu_cores}</div>
                  <div className="text-xs text-muted-foreground">CPU Cores</div>
                </div>
                <div className="text-center p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <MemoryStick className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <div className="font-semibold text-foreground">{pool.total_ram_gb}</div>
                  <div className="text-xs text-muted-foreground">GB RAM</div>
                </div>
                <div className="text-center p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <HardDrive className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="font-semibold text-foreground">{pool.total_storage_gb}</div>
                  <div className="text-xs text-muted-foreground">GB Storage</div>
                </div>
              </div>

              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-display font-semibold glow-magenta"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user ? (
                  "JOIN POOL"
                ) : (
                  "SIGN IN TO JOIN"
                )}
              </Button>

              {!user && (
                <p className="text-center text-muted-foreground text-xs mt-4">
                  You'll need to create an account first
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default JoinPool;
