import { supabase } from '@/services/supabase'
import { albumData as baseAlbumData, stickersBySubseccion, stickersByCode } from '@/data/albumData'
import type { AlbumSection, UserStickerCount } from '@/types/album'
import { LOCAL_STORAGE_KEY } from '@/lib/constants'

type LegacyCollectedMap = Record<string, Record<string, number>>

const TOTAL_NEEDED = baseAlbumData.reduce((acc, s) => acc + s.needed, 0)

function computeTotals(collected: UserStickerCount): { uniqueCount: number; repeatedCount: number } {
  let uniqueCount = 0
  let repeatedCount = 0
  for (const count of Object.values(collected)) {
    if (count > 0) uniqueCount++
    if (count > 1) repeatedCount += count - 1
  }
  return { uniqueCount, repeatedCount }
}

function isPlainCountMap(value: unknown): value is UserStickerCount {
  return !!value && typeof value === 'object' && Object.values(value).every(v => typeof v === 'number')
}

function migrateLegacyCollected(collected: LegacyCollectedMap): UserStickerCount {
  const flat: UserStickerCount = {}
  for (const [sectionName, sectionCounts] of Object.entries(collected)) {
    const stickers = stickersBySubseccion.get(sectionName) ?? []
    for (const [num, count] of Object.entries(sectionCounts)) {
      if (count <= 0) continue
      const sticker = stickers[Number(num) - 1]
      if (sticker) flat[sticker.codigoFigura] = count
    }
  }
  return flat
}

function normalizeCollectedPayload(value: unknown): UserStickerCount {
  if (!value || typeof value !== 'object') return {}
  if (isPlainCountMap(value)) {
    return Object.fromEntries(
      Object.entries(value).filter(([code, count]) => stickersByCode.has(code) && count > 0)
    )
  }
  return migrateLegacyCollected(value as LegacyCollectedMap)
}

function toCollectedMap(data: AlbumSection[]): UserStickerCount {
  const map: UserStickerCount = {}
  for (const s of data) {
    for (const [code, count] of Object.entries(s.collected)) {
      if (count > 0) map[code] = count
    }
  }
  return map
}

function toAlbumData(collectedPayload: unknown): AlbumSection[] {
  const collected = normalizeCollectedPayload(collectedPayload)
  return baseAlbumData.map(s => ({
    ...s,
    collected: Object.fromEntries(
      (stickersBySubseccion.get(s.section) ?? [])
        .map(sticker => [sticker.codigoFigura, collected[sticker.codigoFigura] ?? 0] as const)
        .filter(([, count]) => count > 0)
    ),
  }))
}

export async function getAlbumState(): Promise<{ data: AlbumSection[] | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No hay sesión activa' }

  // Migrate from localStorage for first-time Supabase users
  let migratedCollected: UserStickerCount = {}
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      migratedCollected = Array.isArray(parsed)
        ? toCollectedMap(parsed as AlbumSection[])
        : normalizeCollectedPayload(parsed)
    }
  } catch { /* ignore */ }

  const { uniqueCount, repeatedCount } = computeTotals(migratedCollected)

  // ignoreDuplicates: true — creates row if missing, leaves existing row untouched.
  // Avoid .single() here: when row already exists, the upsert returns [] (no error),
  // but .single() would return a 406 expecting exactly one row.
  const { data: upsertedRows } = await supabase
    .from('user_album_state')
    .upsert(
      { user_id: user.id, collected: migratedCollected, unique_count: uniqueCount, repeated_count: repeatedCount, total_needed: TOTAL_NEEDED },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select('collected')

  const upserted = (upsertedRows as { collected: unknown }[] | null)?.[0] ?? null
  if (upserted) return { data: toAlbumData(upserted.collected), error: null }

  // Row already existed — fetch it
  const { data: existing, error: selectErr } = await supabase
    .from('user_album_state')
    .select('collected')
    .eq('user_id', user.id)
    .single()

  if (selectErr) return { data: null, error: selectErr.message }
  return { data: toAlbumData(existing.collected), error: null }
}

export async function saveAlbumState(albumData: AlbumSection[]): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa' }

  const collected = toCollectedMap(albumData)
  const { uniqueCount, repeatedCount } = computeTotals(collected)

  const { error } = await supabase
    .from('user_album_state')
    .upsert(
      { user_id: user.id, collected, unique_count: uniqueCount, repeated_count: repeatedCount, total_needed: TOTAL_NEEDED },
      { onConflict: 'user_id' }
    )

  return { error: error?.message ?? null }
}
