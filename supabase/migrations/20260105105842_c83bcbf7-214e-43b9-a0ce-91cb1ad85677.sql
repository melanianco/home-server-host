-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a function to check if users share a pool (either as owner or contributor)
CREATE OR REPLACE FUNCTION public.users_share_pool(viewer_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if they're in the same pool (either as owner or contributor)
    SELECT 1
    FROM pools p
    LEFT JOIN pool_contributors pc ON pc.pool_id = p.id
    WHERE 
      -- Viewer is owner or contributor
      (p.owner_id = viewer_id OR pc.user_id = viewer_id)
      AND
      -- Target is owner or contributor of the same pool
      (p.owner_id = target_id OR EXISTS (
        SELECT 1 FROM pool_contributors pc2 
        WHERE pc2.pool_id = p.id AND pc2.user_id = target_id
      ))
  )
  OR
  -- Check if they share a server (viewer owns server, target is in a pool assigned to it)
  EXISTS (
    SELECT 1
    FROM servers s
    JOIN server_pool_assignments spa ON spa.server_id = s.id
    JOIN pools p ON p.id = spa.pool_id
    LEFT JOIN pool_contributors pc ON pc.pool_id = p.id
    WHERE s.owner_id = viewer_id
      AND (p.owner_id = target_id OR pc.user_id = target_id)
  )
$$;

-- New restrictive policy: users can only view their own profile OR profiles of pool/server members
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.users_share_pool(auth.uid(), user_id)
);