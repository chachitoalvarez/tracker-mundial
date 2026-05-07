import { supabase } from './supabase'

export async function signIn(identifier: string, password: string): Promise<{ error?: string }> {
  const trimmed = identifier.trim()
  let emailToUse = trimmed

  if (!trimmed.includes('@')) {
    const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
      'get_email_by_username',
      { p_username: trimmed }
    )

    if (rpcError || !resolvedEmail) {
      return { error: 'Credenciales inválidas.' }
    }
    emailToUse = resolvedEmail as string
  }

  const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password })

  if (error) return { error: 'Credenciales inválidas.' }
  return {}
}

export async function signUp(email: string, password: string, username: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { user_name: username } },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
