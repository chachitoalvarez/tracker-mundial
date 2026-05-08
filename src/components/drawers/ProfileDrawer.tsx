import { useState, useEffect } from 'react'
import { X, User, Edit2, Mail, Bell, Shield, LogOut, Check } from 'lucide-react'
import * as profilesService from '@/services/profiles.service'
import type { AlbumStats } from '@/types/album'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
  setUserName: (v: string) => void
  authEmail: string
  stats: AlbumStats
  unlockedAchievementsCount: number
  connectionsCount: number
  groupsCount: number
  onLogout: () => void
}

export function ProfileDrawer({
  isOpen, onClose, userName, setUserName, authEmail,
  stats, unlockedAchievementsCount, connectionsCount, groupsCount, onLogout,
}: Props) {
  const [isPublicProfile, setIsPublicProfile] = useState(true)
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    profilesService.getPublicProfileSetting().then(({ isPublic }) => setIsPublicProfile(isPublic))
  }, [isOpen])

  const handleTogglePublicProfile = async () => {
    const next = !isPublicProfile
    setIsPublicProfile(next)
    const { error } = await profilesService.updatePublicProfileSetting(next)
    if (!error) {
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2000)
    } else {
      setIsPublicProfile(!next) // revert on error
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[400px] bg-zinc-50 h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right-8 duration-300 rounded-l-[2rem] md:rounded-l-none overflow-clip">

        {/* Sección 1 — Header compacto */}
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="relative group">
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="text-base font-black text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-amber-500 focus:outline-none transition-colors pb-0.5 tracking-tight w-full truncate"
              />
              <Edit2 className="w-3 h-3 text-zinc-300 absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
            </div>
            <div className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60 flex items-center gap-1.5 w-fit max-w-full overflow-hidden">
              <Mail className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={2.5} />
              <span className="truncate">{authEmail}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Sección 2 — Métricas fijas */}
        <div className="flex-shrink-0 bg-slate-50 p-4 border-b border-zinc-200/60">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: `${stats.percentage}%`, label: 'Avance', color: 'text-amber-600' },
              { value: unlockedAchievementsCount, label: 'Logros', color: 'text-emerald-600' },
              { value: connectionsCount, label: 'Canjes', color: 'text-blue-600' },
              { value: groupsCount, label: 'Grupos', color: 'text-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-2.5 border border-zinc-200/60 text-center shadow-sm flex flex-col items-center justify-center">
                <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 3 — Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-zinc-800 tracking-tight">Preferencias</h3>
              {savedFeedback && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3" strokeWidth={3} /> Guardado
                </span>
              )}
            </div>

            {/* Notificaciones — visual only */}
            <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                  <Bell className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Notificaciones</p>
                  <p className="text-xs font-medium text-zinc-500 mt-0.5">Avisos de nuevos matches</p>
                </div>
              </div>
              <div className="w-12 h-7 bg-emerald-500 rounded-full relative shadow-inner border border-emerald-600">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-1 shadow-sm" />
              </div>
            </div>

            {/* Perfil Público — functional */}
            <div
              className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors cursor-pointer"
              onClick={handleTogglePublicProfile}
            >
              <div className="flex items-center gap-4">
                <div className="bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                  <Shield className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Perfil Público</p>
                  <p className="text-xs font-medium text-zinc-500 mt-0.5">Visible en el ranking global</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative shadow-inner border transition-colors ${isPublicProfile ? 'bg-emerald-500 border-emerald-600' : 'bg-zinc-200 border-zinc-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${isPublicProfile ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 4 — Footer fijo con logout */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 border-2 border-red-100 text-red-600 font-bold py-3 px-4 rounded-2xl hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} /> Cerrar Sesión
          </button>
        </div>

      </div>
    </div>
  )
}
