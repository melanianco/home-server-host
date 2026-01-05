-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create servers table
CREATE TABLE public.servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  max_players INTEGER DEFAULT 10,
  current_players INTEGER DEFAULT 0,
  port INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource pools table
CREATE TABLE public.pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  is_public BOOLEAN DEFAULT false,
  total_cpu_cores INTEGER DEFAULT 0,
  total_ram_gb NUMERIC DEFAULT 0,
  total_storage_gb NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pool contributors table
CREATE TABLE public.pool_contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cpu_cores INTEGER DEFAULT 0,
  ram_gb NUMERIC DEFAULT 0,
  storage_gb NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pool_id, user_id)
);

-- Create server-pool assignments table
CREATE TABLE public.server_pool_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  allocated_cpu INTEGER DEFAULT 0,
  allocated_ram_gb NUMERIC DEFAULT 0,
  allocated_storage_gb NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, pool_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_pool_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Servers policies
CREATE POLICY "Users can view their own servers" ON public.servers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create their own servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own servers" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own servers" ON public.servers FOR DELETE USING (auth.uid() = owner_id);

-- Pools policies
CREATE POLICY "Users can view pools they own or contribute to" ON public.pools FOR SELECT 
  USING (auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM public.pool_contributors WHERE pool_id = pools.id AND user_id = auth.uid()
  ) OR is_public = true);
CREATE POLICY "Users can create their own pools" ON public.pools FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own pools" ON public.pools FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own pools" ON public.pools FOR DELETE USING (auth.uid() = owner_id);

-- Pool contributors policies
CREATE POLICY "Users can view contributors in their pools" ON public.pool_contributors FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.pools WHERE id = pool_contributors.pool_id AND (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.pool_contributors pc WHERE pc.pool_id = pools.id AND pc.user_id = auth.uid()
  ))));
CREATE POLICY "Pool owners can add contributors" ON public.pool_contributors FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.pools WHERE id = pool_contributors.pool_id AND owner_id = auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Pool owners can update contributors" ON public.pool_contributors FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.pools WHERE id = pool_contributors.pool_id AND owner_id = auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Pool owners can remove contributors" ON public.pool_contributors FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.pools WHERE id = pool_contributors.pool_id AND owner_id = auth.uid()) OR auth.uid() = user_id);

-- Server pool assignments policies
CREATE POLICY "Users can view assignments for their servers" ON public.server_pool_assignments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.servers WHERE id = server_pool_assignments.server_id AND owner_id = auth.uid()));
CREATE POLICY "Users can create assignments for their servers" ON public.server_pool_assignments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.servers WHERE id = server_pool_assignments.server_id AND owner_id = auth.uid()));
CREATE POLICY "Users can delete assignments for their servers" ON public.server_pool_assignments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.servers WHERE id = server_pool_assignments.server_id AND owner_id = auth.uid()));

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON public.pools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();