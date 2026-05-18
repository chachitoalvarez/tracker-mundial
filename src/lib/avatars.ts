import { supabase } from '@/services/supabase'

export const AVATARS = [
  { key: 'mascota', fileName: 'mascota.webp', label: 'Mascota' },
  { key: 'trofeo', fileName: 'copa.webp', label: 'Trofeo' },
  { key: 'pelota', fileName: 'pelota.webp', label: 'Pelota' },
  { key: 'estadio', fileName: 'estadio.webp', label: 'Estadio' },
  { key: 'camiseta10', fileName: 'camiseta10.webp', label: 'Camiseta 10' },
  { key: 'messi', fileName: 'messi.webp', label: 'Messi' },
  { key: 'maradona', fileName: 'maradona.webp', label: 'Maradona' },
] as const

export type AvatarKey = typeof AVATARS[number]['key']

export function getAvatarUrl(key?: string | null) {
  const avatar = AVATARS.find(item => item.key === key)
  if (!avatar) return null
  return supabase.storage.from('public-assets').getPublicUrl(avatar.fileName).data.publicUrl
}
