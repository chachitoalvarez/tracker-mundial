import { UsersRound, Mail, AlertCircle } from 'lucide-react'

interface Props {
  newGroupName: string
  setNewGroupName: (v: string) => void
  newGroupEmails: string
  setNewGroupEmails: (v: string) => void
  isLoading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function CreateGroupForm({ newGroupName, setNewGroupName, newGroupEmails, setNewGroupEmails, isLoading, error, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-gradient-to-br from-white to-amber-50/30 p-6 sm:p-8 rounded-3xl border border-amber-200/60 shadow-lg shadow-amber-500/5 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
          <UsersRound className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <h3 className="font-black text-2xl text-zinc-900 tracking-tight">Crear Grupo Privado</h3>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Nombre del Grupo</label>
          <input
            type="text"
            required
            disabled={isLoading}
            placeholder="Ej: Amigos del Club, Los Pibes..."
            className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-medium transition-all shadow-sm disabled:opacity-60"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-zinc-400" /> Invitar Amigos (Emails)
          </label>
          <textarea
            rows={2}
            disabled={isLoading}
            placeholder="amigo1@mail.com, amigo2@mail.com"
            className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-medium transition-all shadow-sm resize-none disabled:opacity-60"
            value={newGroupEmails}
            onChange={e => setNewGroupEmails(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isLoading || !newGroupName.trim()}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-md shadow-amber-500/20 w-full sm:w-auto disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando grupo...' : 'Crear y Compartir Enlace'}
          </button>
        </div>
      </div>
    </form>
  )
}
