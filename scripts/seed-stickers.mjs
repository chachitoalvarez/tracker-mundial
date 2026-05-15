/**
 * Seed script: loads panini_mundial_2026_980_limpio.json into the Supabase figuritas table.
 *
 * Usage:
 *   node scripts/seed-stickers.mjs
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (service role key, NOT the anon key - anon cannot write to figuritas)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.')
  console.error('Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-stickers.mjs')
  process.exit(1)
}

const supabase = createClient(url, key)

const jsonPath = resolve(__dirname, '../src/data/panini_mundial_2026_980_limpio.json')
const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'))
const figuritas = raw.figuritas

console.log(`Loaded ${figuritas.length} figuritas from JSON`)

const rows = figuritas.map(f => ({
  id: `wc2026:base:${f.codigo_figura}`,
  numero_orden: f.numero_orden,
  seccion: f.seccion,
  subseccion: f.subseccion,
  codigo_figura: f.codigo_figura,
  pais_equipo: f.pais_equipo,
  nombre_figura: f.nombre_figura,
  nombre_jugador: f.nombre_jugador,
  tipo_figura: f.tipo_figura,
  tipo_coleccion: f.tipo_coleccion,
  es_especial: f.es_especial,
  acabado: f.acabado,
}))

const BATCH_SIZE = 200
let inserted = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)
  const { error } = await supabase
    .from('figuritas')
    .upsert(batch, { onConflict: 'id' })

  if (error) {
    console.error(`Error at batch ${i / BATCH_SIZE + 1}:`, error.message)
    process.exit(1)
  }

  inserted += batch.length
  console.log(`  Upserted ${inserted} / ${rows.length}`)
}

console.log(`\nDone. ${inserted} figuritas seeded into Supabase.`)
