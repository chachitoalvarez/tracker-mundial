import { supabase } from '@/services/supabase'

export async function getPublicProfileSetting(): Promise<{ isPublic: boolean; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isPublic: true, error: 'No hay sesión activa' }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_public_profile')
    .eq('id', user.id)
    .single()

  if (error) return { isPublic: true, error: error.message }
  return { isPublic: (data as { is_public_profile: boolean }).is_public_profile ?? true, error: null }
}

export async function updatePublicProfileSetting(isPublic: boolean): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, is_public_profile: isPublic }, { onConflict: 'id' })

  return { error: error?.message ?? null }
}
