// TODO: replace with Supabase calls when integrating
import type { Group } from '@/types/group'

export async function listGroups(): Promise<Group[]> {
  // TODO: supabase.from('groups').select(...).eq('user_id', currentUserId)
  return []
}

export async function createGroup(_name: string, _memberEmails: string[]): Promise<Group> {
  // TODO: supabase.from('groups').insert(...)
  throw new Error('Not implemented')
}

export async function deleteGroup(_id: string): Promise<void> {
  // TODO: supabase.from('groups').delete().eq('id', id)
}
