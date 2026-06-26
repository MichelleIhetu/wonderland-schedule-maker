import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const { refresh_token, access_token, expires_in, scope } = body || {};
    if (!refresh_token && !access_token) {
      return new Response(JSON.stringify({ error: 'refresh_token or access_token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const expiresAt = expires_in ? new Date(Date.now() + (Number(expires_in) - 60) * 1000).toISOString() : null;

    const admin = createClient(supabaseUrl, serviceKey);

    if (!refresh_token && access_token) {
      const { data: existing, error: readErr } = await admin
        .from('google_oauth_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (readErr) {
        console.error('Read token row error:', readErr);
        return new Response(JSON.stringify({ error: readErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const payload = {
        user_id: user.id,
        refresh_token: null,
        access_token,
        expires_at: expiresAt,
        scope: scope || null,
      };

      const { error: updateErr } = existing ? await admin
        .from('google_oauth_tokens')
        .update({
          access_token,
          expires_at: expiresAt,
          scope: scope || null,
        })
        .eq('user_id', user.id) : await admin
        .from('google_oauth_tokens')
        .insert(payload);

      if (updateErr) {
        console.error('Save access token error:', updateErr);
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: upErr } = await admin
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        refresh_token,
        access_token: access_token || null,
        expires_at: expiresAt,
        scope: scope || null,
      }, { onConflict: 'user_id' });

    if (upErr) {
      console.error('Save token error:', upErr);
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
