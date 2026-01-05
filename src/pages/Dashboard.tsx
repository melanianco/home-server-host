import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Plus, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Users, 
  LogOut,
  Settings,
  Activity
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

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
          <Link to="/dashboard" className="flex items-center gap-2">
            <Server className="w-8 h-8 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">
              SERVER<span className="text-primary">POOL</span>
            </span>
          </Link>

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            COMMAND CENTER
          </h1>
          <p className="text-muted-foreground">
            Manage your servers and resource pools
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Server className="w-5 h-5" />} value="0" label="Servers" color="cyan" />
          <StatCard icon={<Users className="w-5 h-5" />} value="0" label="Pools" color="magenta" />
          <StatCard icon={<Cpu className="w-5 h-5" />} value="0" label="CPU Cores" color="blue" />
          <StatCard icon={<HardDrive className="w-5 h-5" />} value="0 GB" label="Storage" color="green" />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Servers Section */}
          <div className="lg:col-span-2">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  YOUR SERVERS
                </h2>
                <Link to="/servers/new">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                    <Plus className="w-4 h-4 mr-1" />
                    NEW SERVER
                  </Button>
                </Link>
              </div>

              {/* Empty State */}
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg text-foreground mb-2">No servers yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first server to get started
                </p>
                <Link to="/servers/new">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Server
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Resource Pools Section */}
          <div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  POOLS
                </h2>
                <Link to="/pools/new">
                  <Button size="sm" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10">
                    <Plus className="w-4 h-4 mr-1" />
                    CREATE
                  </Button>
                </Link>
              </div>

              {/* Empty State */}
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No pools yet
                </p>
              </div>
            </div>

            {/* Resources Overview */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 mt-6">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-accent" />
                RESOURCES
              </h2>

              <div className="space-y-4">
                <ResourceBar label="CPU" value={0} max={100} unit="cores" color="cyan" />
                <ResourceBar label="RAM" value={0} max={100} unit="GB" color="magenta" />
                <ResourceBar label="Storage" value={0} max={100} unit="GB" color="blue" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string; 
  color: "cyan" | "magenta" | "blue" | "green";
}) => {
  const colorClasses = {
    cyan: "text-primary border-primary/30 bg-primary/5",
    magenta: "text-secondary border-secondary/30 bg-secondary/5",
    blue: "text-accent border-accent/30 bg-accent/5",
    green: "text-neon-green border-neon-green/30 bg-neon-green/5",
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
};

const ResourceBar = ({ 
  label, 
  value, 
  max, 
  unit, 
  color 
}: { 
  label: string; 
  value: number; 
  max: number; 
  unit: string;
  color: "cyan" | "magenta" | "blue";
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const colorClasses = {
    cyan: "bg-primary",
    magenta: "bg-secondary",
    blue: "bg-accent",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-semibold">{value} / {max} {unit}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
