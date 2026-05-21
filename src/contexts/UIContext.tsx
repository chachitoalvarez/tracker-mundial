import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPathForTab, getTabFromPath, type Tab, type IntercambiosTab } from '@/lib/constants'
import type { LeaderboardEntry } from '@/types/user'

interface UIContextValue {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  intercambiosTab: IntercambiosTab
  setIntercambiosTab: (tab: IntercambiosTab) => void
  isProfileOpen: boolean
  setIsProfileOpen: (v: boolean) => void
  selectedPublicUser: LeaderboardEntry | null
  setSelectedPublicUser: (user: LeaderboardEntry | null) => void
  resetUI: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  const getInitialTab = () => getTabFromPath(window.location.pathname) ?? 'resumen'
  const [activeTab, setActiveTabState] = useState<Tab>(getInitialTab)
  const [intercambiosTab, setIntercambiosTab] = useState<IntercambiosTab>('explorar')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedPublicUser, setSelectedPublicUser] = useState<LeaderboardEntry | null>(null)

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabState(tab)
    const nextPath = getPathForTab(tab)
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }, [])

  const resetUI = useCallback(() => {
    const tabFromPath = getTabFromPath(window.location.pathname)
    const nextTab = tabFromPath ?? 'resumen'
    setActiveTabState(nextTab)
    if (!tabFromPath) {
      window.history.replaceState({}, '', getPathForTab(nextTab))
    }
    setIntercambiosTab('explorar')
    setIsProfileOpen(false)
    setSelectedPublicUser(null)
  }, [])

  useEffect(() => {
    const tabFromPath = getTabFromPath(window.location.pathname)
    if (!tabFromPath) {
      window.history.replaceState({}, '', getPathForTab('resumen'))
      setActiveTabState('resumen')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const tabFromPath = getTabFromPath(window.location.pathname)
      if (tabFromPath) {
        setActiveTabState(tabFromPath)
      } else {
        window.history.replaceState({}, '', getPathForTab('resumen'))
        setActiveTabState('resumen')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fires on every transition to authenticated (login + session restore on reload)
  useEffect(() => {
    if (isAuthenticated) resetUI()
  }, [isAuthenticated, resetUI])

  return (
    <UIContext.Provider value={{
      activeTab, setActiveTab,
      intercambiosTab, setIntercambiosTab,
      isProfileOpen, setIsProfileOpen,
      selectedPublicUser, setSelectedPublicUser,
      resetUI,
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
