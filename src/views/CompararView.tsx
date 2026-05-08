import { useEffect } from 'react'
import { Plus, X, Settings, UsersRound } from 'lucide-react'
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-zinc-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
              <UsersRound className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <select
              className="flex-1 md:w-64 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-zinc-900 cursor-pointer transition-all appearance-none disabled:opacity-60"
              value={compareFilter}
              onChange={e => onFilterChange(e.target.value)}
              disabled={isLoadingGroups}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right .5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="all">
                {isLoadingGroups ? 'Cargando grupos...' : '🌍 Todos (Global)'}
              </option>
              {!isLoadingGroups && groups.length > 0 && (
                <optgroup label="Tus Grupos Privados">
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>👥 {g.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
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
          className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold rounded-2xl transition-all w-full md:w-auto active:scale-[0.98] shadow-sm"
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
