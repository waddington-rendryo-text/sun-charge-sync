import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const deviceToken = req.headers.get('x-device-token')
    if (!deviceToken) {
      return new Response(JSON.stringify({ error: 'Missing device token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      voltage,
      current,
      power,
      energy_kwh,
      temperature,
      vehicle_detected,
      charging_status,
    } = body ?? {}

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Localizar a estação pelo token (agora em station_secrets)
    const { data: secret, error: secretErr } = await admin
      .from('station_secrets')
      .select('station_id')
      .eq('device_token', deviceToken)
      .maybeSingle()

    if (secretErr || !secret) {
      return new Response(JSON.stringify({ error: 'Invalid device token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stationId = secret.station_id

    const computedPower =
      power ?? (typeof voltage === 'number' && typeof current === 'number'
        ? Number((voltage * current).toFixed(2))
        : null)

    const { error: insertErr } = await admin.from('sensor_readings').insert({
      station_id: stationId,
      voltage: voltage ?? null,
      current: current ?? null,
      power: computedPower,
      energy_kwh: energy_kwh ?? null,
      temperature: temperature ?? null,
      vehicle_detected: Boolean(vehicle_detected),
      charging_status: charging_status ?? 'idle',
    })

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await admin
      .from('stations')
      .update({ is_online: true, last_seen_at: new Date().toISOString() })
      .eq('id', stationId)

    return new Response(JSON.stringify({ ok: true, station_id: stationId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
