import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Server, Cpu, HardDrive, Users, Zap, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <Server className="w-8 h-8 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            SERVER<span className="text-primary">POOL</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/10">
              Login
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-16 pb-24 lg:pt-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-foreground">DISTRIBUTED</span>
            <br />
            <span className="text-primary text-glow-cyan">GAME SERVERS</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Pool resources from your friends' PCs to host powerful game servers. 
            Share CPU, RAM, and storage across your network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display font-semibold text-lg px-8">
                START HOSTING
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 font-display font-semibold text-lg px-8">
              LEARN MORE
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24">
          <FeatureCard
            icon={<Cpu className="w-8 h-8" />}
            title="CPU POOLING"
            description="Combine processing power from multiple PCs to run demanding servers"
            delay="0.3s"
          />
          <FeatureCard
            icon={<HardDrive className="w-8 h-8" />}
            title="STORAGE SHARING"
            description="Share disk space for world saves, mods, and automatic backups"
            delay="0.4s"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="INVITE FRIENDS"
            description="Create pools with shareable invite links for your community"
            delay="0.5s"
          />
          <FeatureCard
            icon={<Server className="w-8 h-8" />}
            title="GAME SERVERS"
            description="Host Minecraft, Terraria, Valheim, and custom applications"
            delay="0.6s"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="LIGHTWEIGHT"
            description="Minimal resource usage with efficient load balancing"
            delay="0.7s"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="REDUNDANCY"
            description="Automatic failover and backup across pool contributors"
            delay="0.8s"
          />
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value="0" label="ACTIVE POOLS" />
          <StatCard value="0" label="SERVERS RUNNING" />
          <StatCard value="0TB" label="STORAGE SHARED" />
          <StatCard value="0" label="CONTRIBUTORS" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 text-center text-muted-foreground">
        <p className="text-sm">© 2025 ServerPool. Distributed hosting for gamers.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: string;
}) => (
  <div 
    className="bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 rounded-lg p-6 transition-all duration-300 hover:glow-cyan animate-fade-in"
    style={{ animationDelay: delay }}
  >
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="font-display text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-6 text-center">
    <div className="font-display text-3xl font-bold text-primary text-glow-cyan mb-1">{value}</div>
    <div className="text-xs text-muted-foreground font-semibold tracking-wider">{label}</div>
  </div>
);

export default Index;
