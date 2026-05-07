import { useState } from 'react'
import type { Group } from '@/types/group'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [compareFilter, setCompareFilter] = useState<string>('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [isManagingGroup, setIsManagingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmails, setNewGroupEmails] = useState('')
  const [manageEmails, setManageEmails] = useState('')

  const activeGroupObj = groups.find(g => g.id === compareFilter) ?? null

  const handleFilterChange = (value: string) => {
    setCompareFilter(value)
    setIsManagingGroup(false)
    setShowCreateGroup(false)
  }

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    // TODO: resolve emails to user IDs via Supabase before creating group
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: newGroupName,
      members: [],
      admin: 'me',
    }

    setGroups(prev => [...prev, newGroup])
    setCompareFilter(newGroup.id)
    setShowCreateGroup(false)
    setNewGroupName('')
    setNewGroupEmails('')
  }

  const handleAddMembersToGroup = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: resolve emails to user IDs via Supabase before adding members
    setManageEmails('')
  }

  const handleRemoveMember = (memberId: number) => {
    if (!activeGroupObj) return
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupObj.id) return g
      return { ...g, members: g.members.filter(id => id !== memberId) }
    }))
  }

  const handleDeleteGroup = () => {
    if (!activeGroupObj) return
    if (window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${activeGroupObj.name}"?`)) {
      setGroups(prev => prev.filter(g => g.id !== activeGroupObj.id))
      setCompareFilter('all')
      setIsManagingGroup(false)
    }
  }

  return {
    groups,
    compareFilter,
    showCreateGroup,
    setShowCreateGroup,
    isManagingGroup,
    setIsManagingGroup,
    newGroupName,
    setNewGroupName,
    newGroupEmails,
    setNewGroupEmails,
    manageEmails,
    setManageEmails,
    activeGroupObj,
    handleFilterChange,
    handleCreateGroup,
    handleAddMembersToGroup,
    handleRemoveMember,
    handleDeleteGroup,
  }
}
