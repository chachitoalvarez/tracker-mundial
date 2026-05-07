import { useMemo } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { UIProvider, useUI } from '@/contexts/UIContext'
import { useCelebration } from '@/hooks/useCelebration'
import { useAlbum } from '@/hooks/useAlbum'
import { useAchievements } from '@/hooks/useAchievements'
import { useTrades } from '@/hooks/useTrades'
import { useChat } from '@/hooks/useChat'
import { useGroups } from '@/hooks/useGroups'

import { LoginView } from '@/views/LoginView'
import { ResumenView } from '@/views/ResumenView'
import { DetalleView } from '@/views/DetalleView'
import { CompararView } from '@/views/CompararView'
import { IntercambiosView } from '@/views/IntercambiosView'
import { LogrosView } from '@/views/LogrosView'

import { MainHeader } from '@/components/layout/MainHeader'
import { ContextualHeader } from '@/components/layout/ContextualHeader'
import { DesktopTabs } from '@/components/layout/DesktopTabs'
import { BottomNav } from '@/components/layout/BottomNav'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { ProfileDrawer } from '@/components/drawers/ProfileDrawer'
import { PublicProfileDrawer } from '@/components/drawers/PublicProfileDrawer'
import { ChatDrawer } from '@/components/drawers/ChatDrawer'

import { mockFriends } from '@/data/mockFriends'
import type { Tab } from '@/lib/constants'
import type { LeaderboardEntry } from '@/types/user'

function AppShell() {
  const { isAuthenticated, authInitialized, userName, setUserName, authEmail, handleLogout } = useAuth()
  const {
    activeTab, setActiveTab,
    intercambiosTab, setIntercambiosTab,
    isProfileOpen, setIsProfileOpen,
    selectedPublicUser, setSelectedPublicUser,
  } = useUI()

  const { celebration, triggerCelebration } = useCelebration()

  const {
    albumData, stats, filteredData, currentSectionData,
    searchTerm, setSearchTerm, selectedSection, setSelectedSection,
    showOnlyRepeated, setShowOnlyRepeated,
    updateStickerCount, toggleAllInSection, handleGoToDetail,
  } = useAlbum(triggerCelebration)

  const { achievements, unlockedCount } = useAchievements(albumData, stats, triggerCelebration)

  const {
    likedByMe, likedByThem, connections, showMatchAnimation,
    currentTradeUser, unreadConnectionsCount,
    handleSwipe, handleAcceptLike, handleRejectLike,
    markConnectionRead, markConnectionUnread,
  } = useTrades(triggerCelebration)

  const {
    activeChatUser, setActiveChatUser,
    chatMessage, setChatMessage,
    chatHistory, isTyping,
    handleOpenChat, handleSendMessage,
  } = useChat(markConnectionRead, markConnectionUnread)

  const {
    groups, compareFilter, showCreateGroup, setShowCreateGroup,
    isManagingGroup, setIsManagingGroup,
    newGroupName, setNewGroupName,
    newGroupEmails, setNewGroupEmails,
    manageEmails, setManageEmails,
    activeGroupObj,
    handleFilterChange, handleCreateGroup, handleAddMembersToGroup,
    handleRemoveMember, handleDeleteGroup,
  } = useGroups()

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    let usersToShow = [...mockFriends]
    if (compareFilter !== 'all') {
      const activeGroup = groups.find(g => g.id === compareFilter)
      if (activeGroup) {
        usersToShow = usersToShow.filter(f => activeGroup.members.includes(f.id))
      }
    }
    const allUsers: LeaderboardEntry[] = [
      ...usersToShow,
      {
        id: 'me',
        name: userName || 'Tú',
        email: authEmail,
        completed: stats.totalCompleted,
        needed: stats.totalNeeded,
        repeated: stats.totalRepeated,
        isMe: true,
      },
    ]
    return allUsers.sort((a, b) => b.completed - a.completed)
  }, [stats, compareFilter, groups, userName, authEmail])

  if (!authInitialized) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <LoginView />

  const intercambiosBadge = likedByThem.length + unreadConnectionsCount
  const setTab = (tab: Tab) => setActiveTab(tab)
  const goToDetail = (section: string) => handleGoToDetail(section, setTab)

  return (
    <div className="min-h-screen bg-zinc-50/50 p-3 sm:p-4 md:p-8 font-sans text-zinc-800 overflow-x-hidden pb-24 md:pb-8 relative">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
        .animate-float-up {
          animation: floatUp 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {celebration && <CelebrationOverlay celebration={celebration} />}

      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {activeTab === 'resumen' ? (
          <MainHeader userName={userName} onProfileOpen={() => setIsProfileOpen(true)} />
        ) : (
          <ContextualHeader
            activeTab={activeTab}
            userName={userName}
            unlockedAchievementsCount={unlockedCount}
            onProfileOpen={() => setIsProfileOpen(true)}
          />
        )}

        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
          <div className="bg-transparent sm:bg-white sm:rounded-[2rem] sm:shadow-sm sm:border sm:border-zinc-200/60 p-0 sm:p-6 overflow-hidden sm:overflow-visible">
            <DesktopTabs
              activeTab={activeTab}
              onTabChange={setTab}
              intercambiosBadge={intercambiosBadge}
              logrosBadge={unlockedCount}
            />

            <div className="p-0">
              {activeTab === 'resumen' && (
                <ResumenView
                  stats={stats}
                  filteredData={filteredData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onGoToDetail={goToDetail}
                />
              )}

              {activeTab === 'detalle' && (
                <DetalleView
                  albumData={albumData}
                  selectedSection={selectedSection}
                  setSelectedSection={setSelectedSection}
                  showOnlyRepeated={showOnlyRepeated}
                  setShowOnlyRepeated={setShowOnlyRepeated}
                  currentSectionData={currentSectionData}
                  stats={stats}
                  onMarkAll={() => toggleAllInSection(selectedSection, 'fill')}
                  onClearAll={() => toggleAllInSection(selectedSection, 'clear')}
                  onUpdateCount={updateStickerCount}
                />
              )}

              {activeTab === 'comparar' && (
                <CompararView
                  leaderboard={leaderboard}
                  groups={groups}
                  compareFilter={compareFilter}
                  activeGroupObj={activeGroupObj}
                  showCreateGroup={showCreateGroup}
                  setShowCreateGroup={setShowCreateGroup}
                  isManagingGroup={isManagingGroup}
                  setIsManagingGroup={setIsManagingGroup}
                  newGroupName={newGroupName}
                  setNewGroupName={setNewGroupName}
                  newGroupEmails={newGroupEmails}
                  setNewGroupEmails={setNewGroupEmails}
                  manageEmails={manageEmails}
                  setManageEmails={setManageEmails}
                  onFilterChange={handleFilterChange}
                  onCreateGroup={handleCreateGroup}
                  onAddMembers={handleAddMembersToGroup}
                  onRemoveMember={handleRemoveMember}
                  onDeleteGroup={handleDeleteGroup}
                  onClickUser={user => setSelectedPublicUser(user)}
                  onClickMe={() => setIsProfileOpen(true)}
                />
              )}

              {activeTab === 'intercambios' && (
                <IntercambiosView
                  intercambiosTab={intercambiosTab}
                  setIntercambiosTab={setIntercambiosTab}
                  currentTradeUser={currentTradeUser}
                  showMatchAnimation={showMatchAnimation}
                  connections={connections}
                  likedByMe={likedByMe}
                  likedByThem={likedByThem}
                  unreadConnectionsCount={unreadConnectionsCount}
                  onSwipe={handleSwipe}
                  onOpenChat={handleOpenChat}
                  onAcceptLike={handleAcceptLike}
                  onRejectLike={handleRejectLike}
                />
              )}

              {activeTab === 'logros' && (
                <LogrosView achievements={achievements} unlockedCount={unlockedCount} />
              )}
            </div>
          </div>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setTab}
          intercambiosBadge={intercambiosBadge}
          logrosBadge={unlockedCount}
        />
      </div>

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        setUserName={setUserName}
        authEmail={authEmail}
        stats={stats}
        unlockedAchievementsCount={unlockedCount}
        connectionsCount={connections.length}
        groupsCount={groups.length}
        onLogout={handleLogout}
      />

      {selectedPublicUser && (
        <PublicProfileDrawer
          user={selectedPublicUser}
          onClose={() => setSelectedPublicUser(null)}
          onProposeSwap={() => { setSelectedPublicUser(null); setActiveTab('intercambios') }}
        />
      )}

      {activeChatUser && (
        <ChatDrawer
          user={activeChatUser}
          history={chatHistory[activeChatUser.id] ?? []}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          isTyping={isTyping}
          onClose={() => setActiveChatUser(null)}
          onSend={handleSendMessage}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppShell />
      </UIProvider>
    </AuthProvider>
  )
}
