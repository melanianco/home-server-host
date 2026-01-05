import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Copy,
  Download,
  Terminal,
  Wifi,
  WifiOff,
  Settings,
  LogOut,
  ArrowLeft,
  Activity
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type PoolContributorRow = Tables<"pool_contributors">;

const Agent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<(PoolContributorRow & { pool_name?: string })[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_BASE_URL = "https://xdzfsfktynsorqfnwhma.supabase.co/functions/v1/agent-api";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchContributions(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchContributions = async (userId: string) => {
    setLoading(true);
    try {
      const { data: contribData } = await supabase
        .from("pool_contributors")
        .select("*, pools(name)")
        .eq("user_id", userId);

      if (contribData) {
        const mapped = contribData.map((c: any) => ({
          ...c,
          pool_name: c.pools?.name || "Unknown Pool"
        }));
        setContributions(mapped);
      }
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  // Calculate totals
  const totalCpu = contributions.reduce((sum, c) => sum + (c.cpu_cores || 0), 0);
  const totalRam = contributions.reduce((sum, c) => sum + Number(c.ram_gb || 0), 0);
  const totalStorage = contributions.reduce((sum, c) => sum + Number(c.storage_gb || 0), 0);
  const onlineCount = contributions.filter(c => c.status === "online").length;

  // Chart data
  const resourcePieData = [
    { name: "CPU", value: totalCpu, color: "hsl(180, 100%, 50%)" },
    { name: "RAM", value: totalRam, color: "hsl(300, 100%, 60%)" },
    { name: "Storage", value: totalStorage, color: "hsl(210, 100%, 60%)" },
  ].filter(d => d.value > 0);

  const poolResourceData = contributions.map(c => ({
    name: c.pool_name || "Pool",
    cpu: c.cpu_cores || 0,
    ram: Number(c.ram_gb || 0),
    storage: Number(c.storage_gb || 0),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2">
              <Server className="w-8 h-8 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">
                SERVER<span className="text-primary">POOL</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            AGENT CONNECTION
          </h1>
          <p className="text-muted-foreground">
            Connect your desktop agent to contribute resources to your pools
          </p>
        </div>

        {/* Connection Info */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-neon-green" />
              API ENDPOINT
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Base URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted/50 border border-border rounded px-3 py-2 text-sm text-primary font-mono overflow-x-auto">
                    {API_BASE_URL}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(API_BASE_URL, "API URL")}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {accessToken && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Access Token (use in Authorization header)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted/50 border border-border rounded px-3 py-2 text-sm text-secondary font-mono truncate">
                      Bearer {accessToken.slice(0, 40)}...
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(`Bearer ${accessToken}`, "Token")}
                      className="border-secondary/30 text-secondary hover:bg-secondary/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-accent" />
              QUICK START
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="bg-muted/30 border border-border rounded p-4">
                <p className="text-muted-foreground mb-2">1. Download the desktop agent</p>
                <Button variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
              
              <div className="bg-muted/30 border border-border rounded p-4">
                <p className="text-muted-foreground mb-2">2. Configure with your credentials</p>
                <code className="block text-xs text-primary font-mono bg-background/50 p-2 rounded">
                  POST /register {"{"} pool_id, cpu_cores, ram_gb, storage_gb {"}"}
                </code>
              </div>
              
              <div className="bg-muted/30 border border-border rounded p-4">
                <p className="text-muted-foreground mb-2">3. Send heartbeats to stay connected</p>
                <code className="block text-xs text-primary font-mono bg-background/50 p-2 rounded">
                  POST /heartbeat {"{"} pool_id, status, resources {"}"}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Total Resources Pie Chart */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              YOUR CONTRIBUTED RESOURCES
            </h2>

            {resourcePieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourcePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {resourcePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(220, 25%, 10%)", 
                        border: "1px solid hsl(220, 30%, 20%)",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <div className="text-center">
                  <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No resources contributed yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Join a pool and run the agent to contribute</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <Cpu className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-primary">{totalCpu}</div>
                <div className="text-xs text-muted-foreground">CPU Cores</div>
              </div>
              <div className="text-center p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                <MemoryStick className="w-5 h-5 text-secondary mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-secondary">{totalRam}</div>
                <div className="text-xs text-muted-foreground">RAM GB</div>
              </div>
              <div className="text-center p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <HardDrive className="w-5 h-5 text-accent mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-accent">{totalStorage}</div>
                <div className="text-xs text-muted-foreground">Storage GB</div>
              </div>
            </div>
          </div>

          {/* Per-Pool Bar Chart */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-secondary" />
              RESOURCES BY POOL
            </h2>

            {poolResourceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={poolResourceData} layout="vertical">
                    <XAxis type="number" stroke="hsl(220, 15%, 60%)" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(220, 15%, 60%)" 
                      fontSize={12}
                      width={100}
                      tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + "..." : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(220, 25%, 10%)", 
                        border: "1px solid hsl(220, 30%, 20%)",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="cpu" name="CPU Cores" fill="hsl(180, 100%, 50%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ram" name="RAM (GB)" fill="hsl(300, 100%, 60%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="storage" name="Storage (GB)" fill="hsl(210, 100%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Server className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pool contributions</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 p-3 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                {onlineCount > 0 ? (
                  <Wifi className="w-5 h-5 text-neon-green" />
                ) : (
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">
                  {onlineCount} / {contributions.length} pools online
                </span>
              </div>
              <div className={`w-3 h-3 rounded-full ${onlineCount > 0 ? "status-online" : "bg-muted-foreground"}`} />
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-neon-orange" />
            API REFERENCE
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { method: "POST", path: "/register", desc: "Register agent to a pool" },
              { method: "POST", path: "/heartbeat", desc: "Update status & resources" },
              { method: "POST", path: "/disconnect", desc: "Mark agent as offline" },
              { method: "GET", path: "/pools", desc: "List your pools" },
              { method: "GET", path: "/pool/:id", desc: "Get pool details" },
              { method: "POST", path: "/join/:code", desc: "Join pool by invite code" },
            ].map((endpoint) => (
              <div key={endpoint.path} className="bg-muted/30 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    endpoint.method === "GET" 
                      ? "bg-neon-green/20 text-neon-green" 
                      : "bg-primary/20 text-primary"
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-foreground font-mono">{endpoint.path}</code>
                </div>
                <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agent;
