import { Settings, User, UserMinus, UserPlus, Mail, Trash2 } from 'lucide-react'
import type { Group } from '@/types/group'

interface Props {
  group: Group
  manageEmails: string
  setManageEmails: (v: string) => void
  onAddMembers: (e: React.FormEvent) => void
  onRemoveMember: (id: number) => void
  onDeleteGroup: () => void
}

export function GroupManager({ group, manageEmails, setManageEmails, onAddMembers, onRemoveMember, onDeleteGroup }: Props) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-100 pb-5">
        <h3 className="font-black text-xl text-zinc-900 flex items-center gap-2 tracking-tight">
          <Settings className="w-6 h-6 text-zinc-400" /> Ajustes: {group.name}
        </h3>
        <button onClick={onDeleteGroup} className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center active:scale-95">
          <Trash2 className="w-4 h-4" strokeWidth={2.5} /> Eliminar Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Miembros del grupo ({group.members.length + 1})
          </label>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-50 to-white px-4 py-3 rounded-2xl border border-amber-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <span className="text-sm font-black text-amber-900 flex items-center gap-2">
                  Tú <span className="text-[9px] uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-black border border-amber-300">Admin</span>
                </span>
              </div>
            </div>
            {group.members.map(memberId => (
              <div key={memberId} className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold text-zinc-500 truncate">#{memberId}</span>
                </div>
                <button onClick={() => onRemoveMember(memberId)} className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors flex-shrink-0 active:scale-90">
                  <UserMinus className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:border-l border-zinc-100 md:pl-8 pt-6 md:pt-0 border-t md:border-t-0 mt-6 md:mt-0">
          <form onSubmit={onAddMembers}>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" strokeWidth={2.5} /> Invitar más amigos
            </label>
            <textarea
              rows={3}
              placeholder="Ingresa los emails separados por coma..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none text-sm mb-4 font-medium transition-all resize-none"
              value={manageEmails}
              onChange={e => setManageEmails(e.target.value)}
            />
            <button type="submit" disabled={!manageEmails.trim()} className="w-full px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm disabled:shadow-none flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" strokeWidth={2.5} /> Enviar Invitaciones
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
