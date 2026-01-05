import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRegistration {
  pool_id: string
  cpu_cores: number
  ram_gb: number
  storage_gb: number
}

interface HeartbeatPayload {
  contributor_id: string
  status: 'online' | 'offline'
  cpu_cores?: number
  ram_gb?: number
  storage_gb?: number
}

interface ResourceUpdate {
  contributor_id: string
  cpu_cores: number
  ram_gb: number
  storage_gb: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const path = url.pathname.replace('/agent-api', '')

    // Get authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Agent API request: ${req.method} ${path} by user ${user.id}`)

    // POST /register - Register agent as contributor to a pool
    if (req.method === 'POST' && path === '/register') {
      const body: AgentRegistration = await req.json()
      
      if (!body.pool_id) {
        return new Response(
          JSON.stringify({ error: 'pool_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if pool exists
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('id, name')
        .eq('id', body.pool_id)
        .single()

      if (poolError || !pool) {
        return new Response(
          JSON.stringify({ error: 'Pool not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if already a contributor
      const { data: existing } = await supabase
        .from('pool_contributors')
        .select('id')
        .eq('pool_id', body.pool_id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing contributor
        const { data: updated, error: updateError } = await supabase
          .from('pool_contributors')
          .update({
            cpu_cores: body.cpu_cores || 0,
            ram_gb: body.ram_gb || 0,
            storage_gb: body.storage_gb || 0,
            status: 'online',
            last_seen: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating contributor:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update contributor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update pool totals
        await updatePoolTotals(supabase, body.pool_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            contributor_id: existing.id,
            pool_name: pool.name,
            message: 'Agent reconnected to pool'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create new contributor
      const { data: contributor, error: insertError } = await supabase
        .from('pool_contributors')
        .insert({
          pool_id: body.pool_id,
          user_id: user.id,
          cpu_cores: body.cpu_cores || 0,
          ram_gb: body.ram_gb || 0,
          storage_gb: body.storage_gb || 0,
          status: 'online',
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating contributor:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to register agent' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update pool totals
      await updatePoolTotals(supabase, body.pool_id)

      console.log(`Agent registered: ${contributor.id} for pool ${pool.name}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          contributor_id: contributor.id,
          pool_name: pool.name,
          message: 'Agent registered successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /heartbeat - Send heartbeat to keep agent online
    if (req.method === 'POST' && path === '/heartbeat') {
      const body: HeartbeatPayload = await req.json()
      
      if (!body.contributor_id) {
        return new Response(
          JSON.stringify({ error: 'contributor_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {
        status: body.status || 'online',
        last_seen: new Date().toISOString()
      }

      if (body.cpu_cores !== undefined) updateData.cpu_cores = body.cpu_cores
      if (body.ram_gb !== undefined) updateData.ram_gb = body.ram_gb
      if (body.storage_gb !== undefined) updateData.storage_gb = body.storage_gb

      const { data: contributor, error: updateError } = await supabase
        .from('pool_contributors')
        .update(updateData)
        .eq('id', body.contributor_id)
        .eq('user_id', user.id)
        .select('pool_id')
        .single()

      if (updateError) {
        console.error('Error updating heartbeat:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update heartbeat' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update pool totals if resources changed
      if (body.cpu_cores !== undefined || body.ram_gb !== undefined || body.storage_gb !== undefined) {
        await updatePoolTotals(supabase, contributor.pool_id)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Heartbeat received' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /disconnect - Mark agent as offline
    if (req.method === 'POST' && path === '/disconnect') {
      const body = await req.json()
      
      if (!body.contributor_id) {
        return new Response(
          JSON.stringify({ error: 'contributor_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: contributor, error: updateError } = await supabase
        .from('pool_contributors')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString()
        })
        .eq('id', body.contributor_id)
        .eq('user_id', user.id)
        .select('pool_id')
        .single()

      if (updateError) {
        console.error('Error disconnecting:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Agent disconnected: ${body.contributor_id}`)

      return new Response(
        JSON.stringify({ success: true, message: 'Agent disconnected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /pools - Get pools user can contribute to
    if (req.method === 'GET' && path === '/pools') {
      const { data: contributions } = await supabase
        .from('pool_contributors')
        .select('pool_id, pools:pool_id (id, name, invite_code)')
        .eq('user_id', user.id)

      const { data: ownedPools } = await supabase
        .from('pools')
        .select('id, name, invite_code')
        .eq('owner_id', user.id)

      return new Response(
        JSON.stringify({ 
          contributed_pools: contributions?.map(c => c.pools) || [],
          owned_pools: ownedPools || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /pool/:id - Get pool details
    if (req.method === 'GET' && path.startsWith('/pool/')) {
      const poolId = path.replace('/pool/', '')
      
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .single()

      if (poolError || !pool) {
        return new Response(
          JSON.stringify({ error: 'Pool not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(pool),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /join/:invite_code - Join pool by invite code
    if (req.method === 'POST' && path.startsWith('/join/')) {
      const inviteCode = path.replace('/join/', '')
      
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single()

      if (poolError || !pool) {
        return new Response(
          JSON.stringify({ error: 'Invalid invite code' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          pool_id: pool.id, 
          pool_name: pool.name,
          message: 'Use /register with this pool_id to join'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found', available_endpoints: [
        'POST /register - Register agent to pool',
        'POST /heartbeat - Send heartbeat',
        'POST /disconnect - Disconnect agent',
        'GET /pools - Get user pools',
        'GET /pool/:id - Get pool details',
        'POST /join/:invite_code - Lookup pool by invite code'
      ]}),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Agent API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function updatePoolTotals(supabase: any, poolId: string) {
  // Get all online contributors for this pool
  const { data: contributors } = await supabase
    .from('pool_contributors')
    .select('cpu_cores, ram_gb, storage_gb')
    .eq('pool_id', poolId)
    .eq('status', 'online')

  if (!contributors) return

  const totals = contributors.reduce(
    (acc: any, c: any) => ({
      total_cpu_cores: acc.total_cpu_cores + (c.cpu_cores || 0),
      total_ram_gb: acc.total_ram_gb + Number(c.ram_gb || 0),
      total_storage_gb: acc.total_storage_gb + Number(c.storage_gb || 0)
    }),
    { total_cpu_cores: 0, total_ram_gb: 0, total_storage_gb: 0 }
  )

  await supabase
    .from('pools')
    .update(totals)
    .eq('id', poolId)

  console.log(`Updated pool ${poolId} totals:`, totals)
}
