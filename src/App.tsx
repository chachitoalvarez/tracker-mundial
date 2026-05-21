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
import { getStickerByCanonicalCode } from '@/lib/album'

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
import * as profilesService from '@/services/profiles.service'
import * as tradeProposalsService from '@/services/tradeProposals.service'

import type { Tab } from '@/lib/constants'
import type { Sticker } from '@/types/album'
import type { TradeProposal, TradeProposalSticker } from '@/types/trade'


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
    isLoadingAlbum, updateStickerCount, addScannedStickers, discountStickers, handleGoToDetail, jumpToStickerCode,
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
  const [avatarKey, setAvatarKey] = useState<string | null>(null)
  const [tradeProposals, setTradeProposals] = useState<TradeProposal[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarKey(null)
      return
    }

    profilesService.getProfileSettings().then(({ avatarKey: nextAvatarKey }) => {
      setAvatarKey(nextAvatarKey)
    })
  }, [isAuthenticated])

  const {
    likedByMe, likedByThem, connections, showMatchAnimation,
    currentTradeUser, isLoadingCandidates, unreadConnectionsCount,
    handleSwipe, handleAcceptLike, handleRejectLike,
  } = useTrades(triggerCelebration)

  const { openChatWithUser, closeChat } = useChat()

  const refreshTradeProposals = async () => {
    const { data } = await tradeProposalsService.listTradeProposals()
    setTradeProposals(data)
  }

  useEffect(() => {
    if (isAuthenticated) closeChat()
  }, [isAuthenticated, closeChat])

  useEffect(() => {
    if (!isAuthenticated) {
      setTradeProposals([])
      return
    }
    refreshTradeProposals()
  }, [isAuthenticated])

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
    groupsRevision,
    activeGroupObj,
    handleFilterChange, handleCreateGroup,
    handleRemoveMember, handleDeleteGroup, refresh: refreshGroups,
  } = useGroups()

  const { leaderboard, isLoadingLeaderboard, updateUserAvatar } = useLeaderboard(compareFilter, groupsRevision)
  const handleAvatarChange = (nextAvatarKey: string | null) => {
    setAvatarKey(nextAvatarKey)
    if (sessionUserId) updateUserAvatar(sessionUserId, nextAvatarKey)
  }

  if (!authInitialized) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <LoginView />

  const receivedTradeProposals = tradeProposals.filter(item => item.direction === 'received')
  const sentTradeProposals = tradeProposals.filter(item => item.direction === 'sent')
  const pendingReceivedTradeProposals = receivedTradeProposals.filter(item => item.status === 'pending').length
  const intercambiosBadge = likedByThem.length + unreadConnectionsCount + pendingReceivedTradeProposals
  const logrosBadge = Math.max(unlockedCount - seenAchievementsCount, 0)
  const setTab = (tab: Tab) => setActiveTab(tab)
  const goToDetail = (section: string) => handleGoToDetail(section, setTab)
  const proposalItemsToAlbumItems = (items: TradeProposalSticker[]): Array<{ sticker: Sticker; quantity: number }> => {
    return items
      .map(item => {
        const sticker = getStickerByCanonicalCode(item.normalizedCode)
        return sticker ? { sticker, quantity: item.quantity || 1 } : null
      })
      .filter((item): item is { sticker: Sticker; quantity: number } => item !== null)
  }

  const handleCreateTradeProposal = async (
    targetUserId: string,
    creatorWillReceive: TradeProposalSticker[],
    creatorWillGive: TradeProposalSticker[],
  ) => {
    const result = await tradeProposalsService.createTradeProposal(targetUserId, creatorWillReceive, creatorWillGive)
    await refreshTradeProposals()
    return { error: result.error }
  }

  const handleAcceptTradeProposal = async (proposal: TradeProposal) => {
    const { error } = await tradeProposalsService.acceptTradeProposal(proposal.id)
    if (error) {
      window.alert('El canje cambió. Algunas figuritas ya no están disponibles. Revisá la propuesta antes de confirmar.')
      await refreshTradeProposals()
      return
    }
    addScannedStickers(proposalItemsToAlbumItems(proposal.creatorWillGive), { celebrate: false })
    discountStickers(proposalItemsToAlbumItems(proposal.creatorWillReceive), { celebrate: false })
    await refreshTradeProposals()
  }

  const handleRejectTradeProposal = async (proposal: TradeProposal) => {
    await tradeProposalsService.rejectTradeProposal(proposal.id)
    await refreshTradeProposals()
  }

  const handleCancelTradeProposal = async (proposal: TradeProposal) => {
    await tradeProposalsService.cancelTradeProposal(proposal.id)
    await refreshTradeProposals()
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 p-3 sm:p-4 lg:p-6 font-sans text-zinc-800 overflow-x-hidden pb-24 md:pb-8 relative">
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

      <div className="max-w-6xl mx-auto space-y-4 lg:space-y-5">
        <ContextualHeader
          activeTab={activeTab}
          userName={userName}
          avatarKey={avatarKey}
          notificationsCount={logrosBadge}
          onProfileOpen={() => setIsProfileOpen(true)}
        />

        <div className="space-y-4 lg:space-y-5 animate-in fade-in duration-500">
          <div className={`bg-transparent sm:bg-white sm:rounded-[2rem] sm:shadow-sm sm:border sm:border-zinc-200/60 p-0 sm:p-5 lg:p-4 overflow-clip sm:overflow-visible${activeTab === 'detalle' ? ' -mt-4 sm:mt-0' : ''}`}>
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
                  unlockedAchievementsCount={unlockedCount}
                  totalAchievementsCount={achievements.length}
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
                  onDiscountStickers={discountStickers}
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
                  sentProposals={sentTradeProposals}
                  receivedProposals={receivedTradeProposals}
                  unreadConnectionsCount={unreadConnectionsCount}
                  onSwipe={handleSwipe}
                  onOpenChat={(conn) => openChatWithUser(String(conn.id), conn.name)}
                  onAcceptLike={handleAcceptLike}
                  onRejectLike={handleRejectLike}
                  onAcceptProposal={handleAcceptTradeProposal}
                  onRejectProposal={handleRejectTradeProposal}
                  onCancelProposal={handleCancelTradeProposal}
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
        avatarKey={avatarKey}
        onAvatarChange={handleAvatarChange}
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
          albumData={albumData}
          onClose={() => setSelectedPublicUser(null)}
          onCreateTradeProposal={handleCreateTradeProposal}
          onViewSummary={() => {
            setActiveTab('resumen')
            setSelectedPublicUser(null)
          }}
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
