import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  ArrowLeft, 
  Gamepad2, 
  Box, 
  Loader2,
  Pickaxe,
  Swords,
  Skull,
  Code
} from "lucide-react";

const minecraftVersions = [
  "1.21.4", "1.21.3", "1.21.2", "1.21.1", "1.21",
  "1.20.6", "1.20.5", "1.20.4", "1.20.3", "1.20.2", "1.20.1", "1.20",
  "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19",
  "1.18.2", "1.18.1", "1.18",
  "1.17.1", "1.17",
  "1.16.5", "1.16.4", "1.16.3", "1.16.2", "1.16.1", "1.16",
  "1.12.2", "1.8.9", "1.7.10"
];

const minecraftServerTypes = [
  { id: "vanilla", name: "Vanilla", description: "Official Minecraft server" },
  { id: "paper", name: "Paper", description: "High performance fork of Spigot" },
  { id: "purpur", name: "Purpur", description: "Paper fork with more features" },
  { id: "spigot", name: "Spigot", description: "Modified server with plugin support" },
  { id: "bukkit", name: "Bukkit", description: "Classic plugin-based server" },
  { id: "fabric", name: "Fabric", description: "Lightweight modding toolchain" },
  { id: "forge", name: "Forge", description: "Popular modding platform" },
  { id: "velocity", name: "Velocity", description: "Modern proxy server" },
  { id: "bungeecord", name: "BungeeCord", description: "Proxy for linking servers" },
  { id: "waterfall", name: "Waterfall", description: "BungeeCord fork by Paper" },
  { id: "sponge", name: "Sponge", description: "Plugin API for Forge/Vanilla" },
];

const gameTypes = [
  { id: "minecraft", name: "Minecraft", icon: Pickaxe, color: "cyan" },
  { id: "terraria", name: "Terraria", icon: Swords, color: "magenta" },
  { id: "valheim", name: "Valheim", icon: Skull, color: "blue" },
  { id: "custom", name: "Custom App", icon: Code, color: "green" },
];

const CreateServer = () => {
  const [name, setName] = useState("");
  const [gameType, setGameType] = useState("");
  const [mcServerType, setMcServerType] = useState("paper");
  const [mcVersion, setMcVersion] = useState("1.21.4");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [port, setPort] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gameType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
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

      // For Minecraft, store the server type and version in game_type
      const finalGameType = gameType === "minecraft" 
        ? `minecraft:${mcServerType}:${mcVersion}` 
        : gameType;

      const { error } = await supabase.from("servers").insert({
        owner_id: user.id,
        name,
        game_type: finalGameType,
        description: description || null,
        max_players: parseInt(maxPlayers) || 10,
        port: port ? parseInt(port) : null,
      });

      if (error) throw error;

      toast({
        title: "Server created!",
        description: "Your server has been configured and is ready for deployment.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create server",
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
            <Server className="w-6 h-6 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">
              CREATE SERVER
            </span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                NEW SERVER
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure your game server settings
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Type Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Game Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                {gameTypes.map((game) => {
                  const Icon = game.icon;
                  const isSelected = gameType === game.id;
                  const colorClasses = {
                    cyan: isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                    magenta: isSelected ? "border-secondary bg-secondary/10 text-secondary" : "border-border hover:border-secondary/50",
                    blue: isSelected ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/50",
                    green: isSelected ? "border-neon-green bg-neon-green/10 text-neon-green" : "border-border hover:border-neon-green/50",
                  };

                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setGameType(game.id)}
                      className={`p-4 rounded-lg border transition-all ${colorClasses[game.color as keyof typeof colorClasses]}`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="font-semibold text-sm">{game.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minecraft Server Type & Version (shown only when Minecraft is selected) */}
            {gameType === "minecraft" && (
              <>
                <div className="space-y-3">
                  <Label className="text-foreground">Server Type *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {minecraftServerTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setMcServerType(type.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          mcServerType === type.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="font-semibold text-sm block">{type.name}</span>
                        <span className="text-xs opacity-70">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mcVersion" className="text-foreground">
                    Minecraft Version *
                  </Label>
                  <select
                    id="mcVersion"
                    value={mcVersion}
                    onChange={(e) => setMcVersion(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground focus:border-primary focus:outline-none"
                  >
                    {minecraftVersions.map((version) => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Server Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Server Name *
              </Label>
              <Input
                id="name"
                placeholder="My Awesome Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border focus:border-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="A friendly server for gaming with friends..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border focus:border-primary resize-none"
                rows={3}
              />
            </div>

            {/* Max Players & Port */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPlayers" className="text-foreground">
                  Max Players
                </Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  placeholder="10"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port" className="text-foreground">
                  Port (optional)
                </Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="25565"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Box className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="text-foreground font-semibold mb-1">Desktop Agent Required</p>
                  <p className="text-muted-foreground">
                    To run this server, you'll need the ServerPool desktop agent installed on at least one computer in your resource pool.
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
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-cyan"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Server"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateServer;
