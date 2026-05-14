import { useEffect, useMemo, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { UIProvider, useUI } from '@/contexts/UIContext'
import { useCelebration } from '@/hooks/useCelebration'
import { useAlbum } from '@/hooks/useAlbum'
import { useAchievements } from '@/hooks/useAchievements'
import { useTrades } from '@/hooks/useTrades'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { useGroups } from '@/hooks/useGroups'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LEGACY_PROJECT_SLUG, PROJECT_SLUG } from '@/lib/constants'

import { LoginView } from '@/views/LoginView'
import { ResumenView } from '@/views/ResumenView'
import { DetalleView } from '@/views/DetalleView'
import { CompararView } from '@/views/CompararView'
import { IntercambiosView } from '@/views/IntercambiosView'
import { LogrosView } from '@/views/LogrosView'

import { ContextualHeader } from '@/components/layout/ContextualHeader'
import { DesktopTabs } from '@/components/layout/DesktopTabs'
import { BottomNav } from '@/components/layout/BottomNav'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { ProfileDrawer } from '@/components/drawers/ProfileDrawer'
import { PublicProfileDrawer } from '@/components/drawers/PublicProfileDrawer'
import { ChatDrawer } from '@/components/drawers/ChatDrawer'

import type { Tab } from '@/lib/constants'


function AppShell() {
  const { isAuthenticated, authInitialized, sessionUserId, userName, setUserName, authEmail, sessionEmail, handleLogout } = useAuth()
  const {
    activeTab, setActiveTab,
    intercambiosTab, setIntercambiosTab,
    isProfileOpen, setIsProfileOpen,
    selectedPublicUser, setSelectedPublicUser,
  } = useUI()

  const { celebration, triggerCelebration } = useCelebration()

  const {
    albumData, stats, filteredData, currentSectionData,
    searchTerm, setSearchTerm, stickerSearchTerm, setStickerSearchTerm,
    selectedSection, setSelectedSection,
    detailFilter, setDetailFilter,
    isLoadingAlbum, updateStickerCount, addScannedStickers, handleGoToDetail, jumpToStickerCode,
  } = useAlbum(triggerCelebration)

  const { achievements, unlockedCount } = useAchievements(albumData, stats, isLoadingAlbum, triggerCelebration)
  const seenAchievementsKey = useMemo(
    () => sessionUserId ? `${PROJECT_SLUG}-seen-achievements-${sessionUserId}` : '',
    [sessionUserId],
  )
  const legacySeenAchievementsKey = useMemo(
    () => sessionUserId ? `${LEGACY_PROJECT_SLUG}-seen-achievements-${sessionUserId}` : '',
    [sessionUserId],
  )
  const [seenAchievementsCount, setSeenAchievementsCount] = useState(0)

  const {
    likedByMe, likedByThem, connections, showMatchAnimation,
    currentTradeUser, isLoadingCandidates, unreadConnectionsCount,
    handleSwipe, handleAcceptLike, handleRejectLike,
  } = useTrades(triggerCelebration)

  const { openChatWithUser, closeChat } = useChat()

  useEffect(() => {
    if (isAuthenticated) closeChat()
  }, [isAuthenticated, closeChat])

  useEffect(() => {
    if (!seenAchievementsKey) {
      setSeenAchievementsCount(0)
      return
    }
    const storedCount = Number(
      window.localStorage.getItem(seenAchievementsKey)
      ?? window.localStorage.getItem(legacySeenAchievementsKey)
      ?? '0'
    )
    setSeenAchievementsCount(Number.isFinite(storedCount) ? storedCount : 0)
    if (seenAchievementsKey && legacySeenAchievementsKey) {
      const legacyValue = window.localStorage.getItem(legacySeenAchievementsKey)
      const currentValue = window.localStorage.getItem(seenAchievementsKey)
      if (legacyValue !== null && currentValue === null) {
        window.localStorage.setItem(seenAchievementsKey, legacyValue)
      }
    }
  }, [legacySeenAchievementsKey, seenAchievementsKey])

  useEffect(() => {
    if (activeTab !== 'logros' || !seenAchievementsKey || isLoadingAlbum) return
    window.localStorage.setItem(seenAchievementsKey, String(unlockedCount))
    setSeenAchievementsCount(unlockedCount)
  }, [activeTab, isLoadingAlbum, seenAchievementsKey, unlockedCount])

  const {
    groups, isLoadingGroups, isCreatingGroup, createGroupError,
    compareFilter, showCreateGroup, setShowCreateGroup,
    isManagingGroup, setIsManagingGroup,
    newGroupName, setNewGroupName,
    newGroupEmails, setNewGroupEmails,
    activeGroupObj,
    handleFilterChange, handleCreateGroup,
    handleRemoveMember, handleDeleteGroup, refresh: refreshGroups,
  } = useGroups()

  const { leaderboard, isLoadingLeaderboard } = useLeaderboard(compareFilter)

  if (!authInitialized) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <LoginView />

  const intercambiosBadge = likedByThem.length + unreadConnectionsCount
  const logrosBadge = Math.max(unlockedCount - seenAchievementsCount, 0)
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
        <ContextualHeader
          activeTab={activeTab}
          userName={userName}
          notificationsCount={logrosBadge}
          onProfileOpen={() => setIsProfileOpen(true)}
        />

        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
          <div className={`bg-transparent sm:bg-white sm:rounded-[2rem] sm:shadow-sm sm:border sm:border-zinc-200/60 p-0 sm:p-6 overflow-clip sm:overflow-visible${activeTab === 'detalle' ? ' -mt-4 sm:mt-0' : ''}`}>
            <DesktopTabs
              activeTab={activeTab}
              onTabChange={setTab}
              intercambiosBadge={intercambiosBadge}
              logrosBadge={logrosBadge}
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
                  stickerSearchTerm={stickerSearchTerm}
                  setStickerSearchTerm={setStickerSearchTerm}
                  detailFilter={detailFilter}
                  setDetailFilter={setDetailFilter}
                  currentSectionData={currentSectionData}
                  stats={stats}
                  onUpdateCount={updateStickerCount}
                  onAddScannedStickers={addScannedStickers}
                  onJumpToStickerCode={jumpToStickerCode}
                />
              )}

              {activeTab === 'comparar' && (
                <CompararView
                  leaderboard={leaderboard}
                  isLoadingLeaderboard={isLoadingLeaderboard}
                  groups={groups}
                  isLoadingGroups={isLoadingGroups}
                  compareFilter={compareFilter}
                  activeGroupObj={activeGroupObj}
                  currentUserEmail={sessionEmail || null}
                  showCreateGroup={showCreateGroup}
                  setShowCreateGroup={setShowCreateGroup}
                  isManagingGroup={isManagingGroup}
                  setIsManagingGroup={setIsManagingGroup}
                  newGroupName={newGroupName}
                  setNewGroupName={setNewGroupName}
                  newGroupEmails={newGroupEmails}
                  setNewGroupEmails={setNewGroupEmails}
                  isCreatingGroup={isCreatingGroup}
                  createGroupError={createGroupError}
                  onFilterChange={handleFilterChange}
                  onCreateGroup={handleCreateGroup}
                  onRemoveMember={handleRemoveMember}
                  onDeleteGroup={handleDeleteGroup}
                  onRefresh={refreshGroups}
                  onClickUser={user => setSelectedPublicUser(user)}
                  onClickMe={() => setIsProfileOpen(true)}
                />
              )}

              {activeTab === 'intercambios' && (
                <IntercambiosView
                  intercambiosTab={intercambiosTab}
                  setIntercambiosTab={setIntercambiosTab}
                  currentTradeUser={currentTradeUser}
                  isLoadingCandidates={isLoadingCandidates}
                  showMatchAnimation={showMatchAnimation}
                  connections={connections}
                  likedByMe={likedByMe}
                  likedByThem={likedByThem}
                  unreadConnectionsCount={unreadConnectionsCount}
                  onSwipe={handleSwipe}
                  onOpenChat={(conn) => openChatWithUser(String(conn.id), conn.name)}
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
          logrosBadge={logrosBadge}
        />
      </div>

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        setUserName={setUserName}
        authEmail={sessionEmail || authEmail}
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
          onStartChat={(otherUserId, otherUsername, prefill) => {
            openChatWithUser(otherUserId, otherUsername, prefill)
          }}
        />
      )}

      <ChatDrawer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <UIProvider>
          <AppShell />
        </UIProvider>
      </ChatProvider>
    </AuthProvider>
  )
}
