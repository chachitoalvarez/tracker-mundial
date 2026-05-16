import { useEffect } from 'react'
import { ChevronDown, Globe2, Plus, Settings, UsersRound, X } from 'lucide-react'
import { LeaderboardList } from '@/features/comparar/LeaderboardList'
import { GroupManager } from '@/features/comparar/GroupManager'
import { CreateGroupForm } from '@/features/comparar/CreateGroupForm'
import type { LeaderboardEntry } from '@/types/user'
import type { Group } from '@/types/group'

interface Props {
  leaderboard: LeaderboardEntry[]
  isLoadingLeaderboard: boolean
  groups: Group[]
  isLoadingGroups: boolean
  compareFilter: string
  activeGroupObj: Group | null
  currentUserEmail: string | null
  showCreateGroup: boolean
  setShowCreateGroup: (v: boolean) => void
  isManagingGroup: boolean
  setIsManagingGroup: (v: boolean) => void
  newGroupName: string
  setNewGroupName: (v: string) => void
  newGroupEmails: string
  setNewGroupEmails: (v: string) => void
  isCreatingGroup: boolean
  createGroupError: string | null
  onFilterChange: (v: string) => void
  onCreateGroup: (e: React.FormEvent) => void
  onRemoveMember: (email: string) => void
  onDeleteGroup: () => void
  onRefresh: () => Promise<void>
  onClickUser: (user: LeaderboardEntry) => void
  onClickMe: () => void
}

export function CompararView({
  leaderboard, isLoadingLeaderboard, groups, isLoadingGroups, compareFilter, activeGroupObj, currentUserEmail,
  showCreateGroup, setShowCreateGroup,
  isManagingGroup, setIsManagingGroup,
  newGroupName, setNewGroupName,
  newGroupEmails, setNewGroupEmails,
  isCreatingGroup, createGroupError,
  onFilterChange, onCreateGroup, onRemoveMember, onDeleteGroup, onRefresh,
  onClickUser, onClickMe,
}: Props) {
  const ownerEmail = activeGroupObj?.members.find(m => m.userId === activeGroupObj.ownerId)?.email
  const isGroupOwner = !!currentUserEmail && !!activeGroupObj && ownerEmail === currentUserEmail

  useEffect(() => {
    if (!isGroupOwner && isManagingGroup) setIsManagingGroup(false)
  }, [isGroupOwner, isManagingGroup, setIsManagingGroup])

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-5 lg:p-4 rounded-3xl border border-zinc-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
              <UsersRound className="w-5 h-5" strokeWidth={2.5} />
            </div>

            <div className="relative flex-1 md:w-64">
              <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" strokeWidth={2.5} />
              <select
                className="h-12 min-h-12 w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-11 text-sm font-semibold leading-none text-zinc-900 transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-60 lg:h-11 lg:min-h-11"
                value={compareFilter}
                onChange={e => onFilterChange(e.target.value)}
                disabled={isLoadingGroups}
              >
                <option value="all">
                  {isLoadingGroups ? 'Cargando grupos...' : 'Todos (Global)'}
                </option>
                {!isLoadingGroups && groups.length > 0 && (
                  <optgroup label="Tus Grupos Privados">
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" strokeWidth={2.5} />
            </div>
          </div>

          {compareFilter !== 'all' && activeGroupObj && isGroupOwner && (
            <button
              onClick={() => { setIsManagingGroup(!isManagingGroup); setShowCreateGroup(false) }}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-2xl transition-all w-full sm:w-auto active:scale-95 ${
                isManagingGroup ? 'bg-zinc-800 text-white shadow-md' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm'
              }`}
            >
              <Settings className="w-4 h-4" strokeWidth={2.5} /> Administrar Grupo
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowCreateGroup(!showCreateGroup); setIsManagingGroup(false) }}
          className="flex items-center justify-center gap-2 px-5 py-3 lg:py-0 h-11 lg:h-11 bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold rounded-2xl transition-all w-full md:w-auto active:scale-[0.98] shadow-sm"
        >
          {showCreateGroup ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Plus className="w-5 h-5" strokeWidth={2.5} />}
          {showCreateGroup ? 'Cancelar' : 'Nuevo Grupo'}
        </button>
      </div>

      {isManagingGroup && activeGroupObj && (
        <GroupManager
          group={activeGroupObj}
          currentUserEmail={currentUserEmail}
          onRemoveMember={onRemoveMember}
          onDeleteGroup={onDeleteGroup}
          onRefresh={onRefresh}
        />
      )}

      {showCreateGroup && (
        <CreateGroupForm
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          newGroupEmails={newGroupEmails}
          setNewGroupEmails={setNewGroupEmails}
          isLoading={isCreatingGroup}
          error={createGroupError}
          onSubmit={onCreateGroup}
        />
      )}

      <LeaderboardList
        leaderboard={leaderboard}
        isLoading={isLoadingLeaderboard}
        emptyMessage={
          compareFilter === 'all'
            ? 'Aún no hay coleccionistas públicos. Activá tu perfil público en Ajustes para aparecer en el ranking.'
            : 'Este grupo todavía no tiene miembros activos. Esperando que las invitaciones sean aceptadas.'
        }
        onClickUser={onClickUser}
        onClickMe={onClickMe}
      />
    </div>
  )
}
