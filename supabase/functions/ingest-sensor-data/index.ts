import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const ALLOWED_STATUS = new Set(['idle', 'charging', 'complete', 'error'])

function validNum(v: unknown, min: number, max: number): number | null {
  if (v === undefined || v === null) return null
  if (typeof v !== 'number' || !Number.isFinite(v)) return NaN as unknown as number
  if (v < min || v > max) return NaN as unknown as number
  return v
}

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

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      voltage,
      current,
      power,
      energy_kwh,
      temperature,
      vehicle_detected,
      charging_status,
    } = body as Record<string, unknown>

    const voltageV = validNum(voltage, 0, 500)
    const currentV = validNum(current, -1000, 1000)
    const powerV = validNum(power, -500000, 500000)
    const energyV = validNum(energy_kwh, 0, 1_000_000)
    const tempV = validNum(temperature, -50, 200)

    if ([voltageV, currentV, powerV, energyV, tempV].some((v) => Number.isNaN(v))) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const status = typeof charging_status === 'string' ? charging_status : 'idle'
    if (!ALLOWED_STATUS.has(status)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (vehicle_detected !== undefined && typeof vehicle_detected !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: secret, error: secretErr } = await admin
      .from('station_secrets')
      .select('station_id')
      .eq('device_token', deviceToken)
      .maybeSingle()

    if (secretErr || !secret) {
      if (secretErr) console.error('secret lookup error', secretErr)
      return new Response(JSON.stringify({ error: 'Invalid device token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stationId = secret.station_id

    const computedPower =
      powerV ?? (voltageV !== null && currentV !== null
        ? Number((voltageV * currentV).toFixed(2))
        : null)

    const { error: insertErr } = await admin.from('sensor_readings').insert({
      station_id: stationId,
      voltage: voltageV,
      current: currentV,
      power: computedPower,
      energy_kwh: energyV,
      temperature: tempV,
      vehicle_detected: Boolean(vehicle_detected),
      charging_status: status,
    })

    if (insertErr) {
      console.error('insert error', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to record reading' }), {
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
    console.error('unhandled error', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
