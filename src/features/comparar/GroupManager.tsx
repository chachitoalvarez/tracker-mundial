import { useState } from 'react'
import { AtSign, Clock, Settings, Trash2, User, UserPlus } from 'lucide-react'
import * as groupsService from '@/services/groups.service'
import type { Group } from '@/types/group'

interface Props {
  group: Group
  currentUserEmail: string | null
  onRemoveMember: (email: string) => void
  onDeleteGroup: () => void
  onRefresh: () => Promise<void>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function GroupManager({ group, currentUserEmail, onRemoveMember, onDeleteGroup, onRefresh }: Props) {
  const [invite, setInvite] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  const ownerMember = group.members.find(m => m.userId === group.ownerId)
  const otherMembers = group.members.filter(m => m.userId !== group.ownerId)
  const isOwner = currentUserEmail != null && ownerMember?.email === currentUserEmail

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = invite.trim().toLowerCase()
    if (!value) return
    setInviteError(null)
    setIsInviting(true)

    try {
      const normalizedUsername = value.replace(/^@/, '')
      const isEmail = EMAIL_RE.test(value)
      let emailToInvite: string

      if (isEmail) {
        emailToInvite = value
      } else {
        const resolved = await groupsService.resolveUsernameToEmail(normalizedUsername)
        if (!resolved) {
          setInviteError('No encontramos a ese usuario')
          return
        }
        emailToInvite = resolved
      }

      const alreadyMember = group.members.some(m => m.email === emailToInvite)
      if (alreadyMember) {
        setInviteError('Esta persona ya es miembro')
        return
      }

      const { error } = await groupsService.addMemberByEmail(group.id, emailToInvite)
      if (error) {
        setInviteError(error)
        return
      }

      setInvite('')
      await onRefresh()
    } catch {
      setInviteError('No se pudo añadir al grupo')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-100 pb-5">
        <h3 className="font-black text-xl text-zinc-900 flex items-center gap-2 tracking-tight">
          <Settings className="w-6 h-6 text-zinc-400" /> Ajustes: {group.name}
        </h3>
        {isOwner && (
          <button onClick={onDeleteGroup} className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center active:scale-95">
            <Trash2 className="w-4 h-4" strokeWidth={2.5} /> Eliminar grupo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Miembros del grupo ({group.members.length})
          </label>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-50 to-white px-4 py-3 rounded-2xl border border-amber-200/60 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-amber-900 flex items-center gap-2">
                    {isOwner ? 'Tú' : (ownerMember?.email ?? 'Admin')}
                    <span className="text-[9px] uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-black border border-amber-300">Admin</span>
                  </span>
                  {ownerMember && !isOwner && (
                    <p className="text-xs text-zinc-400 truncate">{ownerMember.email}</p>
                  )}
                </div>
              </div>
            </div>

            {otherMembers.map(member => (
              <div key={member.email} className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.userId ? (
                      <User className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-zinc-700 truncate block">{member.email}</span>
                    {!member.userId && (
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Invitación pendiente</span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => onRemoveMember(member.email)}
                    className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors flex-shrink-0 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <div className="md:border-l border-zinc-100 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 mt-6 md:mt-0">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" strokeWidth={2.5} /> Invitar al grupo
            </label>

            <form onSubmit={handleInvite} className="space-y-1.5">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={2.5} />
                <input
                  type="text"
                  value={invite}
                  onChange={e => { setInvite(e.target.value); setInviteError(null) }}
                  placeholder="Ej: juan@email.com o @usuario123"
                  disabled={isInviting}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] text-slate-400 px-0.5">
                Ingresá el correo exacto o el usuario, con o sin @.
              </p>
              {inviteError && (
                <p className="text-xs text-red-600 font-medium px-0.5">{inviteError}</p>
              )}
              <button
                type="submit"
                disabled={!invite.trim() || isInviting}
                className="w-full mt-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all active:scale-[0.98]"
              >
                {isInviting ? 'Añadiendo...' : 'Añadir al grupo'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
