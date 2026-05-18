import { useEffect, useState } from 'react'
import { Bell, Check, Edit2, LogOut, Mail, Shield, X } from 'lucide-react'
import * as profilesService from '@/services/profiles.service'
import { formatUsername } from '@/lib/username'
import { AVATARS, type AvatarKey } from '@/lib/avatars'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { AlbumStats } from '@/types/album'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
  setUserName: (v: string) => void
  avatarKey: string | null
  onAvatarChange: (avatarKey: string | null) => void
  authEmail: string
  stats: AlbumStats
  unlockedAchievementsCount: number
  connectionsCount: number
  groupsCount: number
  onLogout: () => void
}

export function ProfileDrawer({
  isOpen, onClose, userName, setUserName, avatarKey, onAvatarChange, authEmail,
  stats, unlockedAchievementsCount, connectionsCount, groupsCount, onLogout,
}: Props) {
  const [isPublicProfile, setIsPublicProfile] = useState(true)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    profilesService.getProfileSettings().then(({ isPublic }) => {
      setIsPublicProfile(isPublic)
    })
    setIsAvatarPickerOpen(false)
  }, [isOpen])

  useEffect(() => {
    if (!isAvatarPickerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAvatarPickerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAvatarPickerOpen])

  const handleTogglePublicProfile = async () => {
    const next = !isPublicProfile
    setIsPublicProfile(next)
    const { error } = await profilesService.updatePublicProfileSetting(next)
    if (!error) {
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2000)
    } else {
      setIsPublicProfile(!next)
    }
  }

  const handleAvatarChange = async (nextAvatarKey: AvatarKey) => {
    const previousAvatarKey = avatarKey
    onAvatarChange(nextAvatarKey)
    const { error } = await profilesService.updateAvatarKey(nextAvatarKey)
    if (!error) {
      setAvatarFeedback('Avatar actualizado')
      setIsAvatarPickerOpen(false)
      setTimeout(() => setAvatarFeedback(null), 2000)
      return
    }
    onAvatarChange(previousAvatarKey)
    setAvatarFeedback('No pudimos actualizar el avatar. Probá de nuevo.')
    setTimeout(() => setAvatarFeedback(null), 2500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[400px] bg-zinc-50 h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right-8 duration-300 rounded-l-[2rem] md:rounded-l-none overflow-clip">
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="relative flex-shrink-0">
            <div className="overflow-hidden rounded-full border-2 border-white shadow-sm">
              <UserAvatar
                avatarKey={avatarKey}
                className="h-12 w-12"
                iconClassName="h-5 w-5"
                fallbackClassName="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600"
              />
            </div>
            <button
              type="button"
              aria-label="Cambiar avatar"
              onClick={() => setIsAvatarPickerOpen(open => !open)}
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white bg-zinc-900 text-white shadow-md transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30"
            >
              <Edit2 className="h-2.5 w-2.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="relative group">
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(formatUsername(e.target.value))}
                className="w-full truncate border-b border-transparent bg-transparent pb-0.5 text-base font-black tracking-tight text-zinc-900 transition-colors hover:border-zinc-200 focus:border-amber-500 focus:outline-none"
              />
              <Edit2 className="absolute right-1 top-1 h-3 w-3 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={3} />
            </div>
            <div className="flex w-fit max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              <Mail className="h-3 w-3 flex-shrink-0 text-zinc-400" strokeWidth={2.5} />
              <span className="truncate">{authEmail}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 active:scale-90"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {isAvatarPickerOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar selector de avatar"
              onClick={() => setIsAvatarPickerOpen(false)}
              className="absolute inset-0 z-0"
            />
            <div className="relative z-10 flex-shrink-0 border-b border-zinc-200/60 bg-white px-5 py-4">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                <div className="mb-3">
                  <h3 className="text-sm font-black text-zinc-900">Cambiar avatar</h3>
                  <p className="text-xs font-medium text-zinc-500">Elegí cómo querés aparecer en Late Nola</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map(avatar => (
                    <button
                      key={avatar.key}
                      type="button"
                      onClick={() => handleAvatarChange(avatar.key)}
                      title={avatar.label}
                      className={`relative rounded-2xl border-2 p-1 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 ${
                        avatarKey === avatar.key ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-white hover:border-zinc-200'
                      }`}
                    >
                      <UserAvatar avatarKey={avatar.key} className="w-full aspect-square" />
                      {avatarKey === avatar.key && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex-shrink-0 border-b border-zinc-200/60 bg-slate-50 p-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: `${stats.percentage}%`, label: 'Avance', color: 'text-amber-600' },
              { value: unlockedAchievementsCount, label: 'Logros', color: 'text-emerald-600' },
              { value: connectionsCount, label: 'Canjes', color: 'text-blue-600' },
              { value: groupsCount, label: 'Grupos', color: 'text-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/60 bg-white p-2.5 text-center shadow-sm">
                <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white scrollbar-hide">
          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black tracking-tight text-zinc-800">Preferencias</h3>
              {savedFeedback && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in">
                  <Check className="h-3 w-3" strokeWidth={3} /> Guardado
                </span>
              )}
            </div>

            <div className="flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-colors hover:bg-zinc-50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-2.5">
                  <Bell className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Notificaciones</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">Avisos de nuevos matches</p>
                </div>
              </div>
              <div className="relative h-7 w-12 rounded-full border border-emerald-600 bg-emerald-500 shadow-inner">
                <div className="absolute right-1 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            <div
              className="flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-colors hover:bg-zinc-50"
              onClick={handleTogglePublicProfile}
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-2.5">
                  <Shield className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Perfil Público</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">Visible en el ranking global</p>
                </div>
              </div>
              <div className={`relative h-7 w-12 rounded-full border shadow-inner transition-colors ${isPublicProfile ? 'border-emerald-600 bg-emerald-500' : 'border-zinc-300 bg-zinc-200'}`}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${isPublicProfile ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-zinc-200/60 bg-white p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 bg-red-50 px-4 py-3 font-bold text-red-600 transition-all hover:border-red-200 hover:bg-red-100 active:scale-95"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.5} /> Cerrar Sesión
          </button>
        </div>

        {avatarFeedback && (
          <div className="pointer-events-none absolute bottom-24 left-4 right-4 z-20 rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">
            {avatarFeedback}
          </div>
        )}
      </div>
    </div>
  )
}
