import { useState, useEffect, useCallback } from 'react'
import * as groupsService from '@/services/groups.service'
import { parseEmails } from '@/services/groups.service'
import type { Group } from '@/types/group'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)
  const [compareFilter, setCompareFilter] = useState<string>('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [isManagingGroup, setIsManagingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmails, setNewGroupEmails] = useState('')
  const [manageEmails, setManageEmails] = useState('')

  const activeGroupObj = groups.find(g => g.id === compareFilter) ?? null

  const refresh = useCallback(async () => {
    const { data, error } = await groupsService.listGroups()
    if (!error) setGroups(data)
  }, [])

  useEffect(() => {
    groupsService.listGroups().then(({ data, error }) => {
      if (!error) setGroups(data)
      setIsLoadingGroups(false)
    })
  }, [])

  const handleFilterChange = (value: string) => {
    setCompareFilter(value)
    setIsManagingGroup(false)
    setShowCreateGroup(false)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setIsCreatingGroup(true)
    setCreateGroupError(null)

    const emails = parseEmails(newGroupEmails)
    const { data, error } = await groupsService.createGroup(newGroupName, emails)

    setIsCreatingGroup(false)
    if (error) {
      setCreateGroupError(error)
      return
    }
    if (data) {
      await refresh()
      setCompareFilter(data.id)
      setShowCreateGroup(false)
      setNewGroupName('')
      setNewGroupEmails('')
    }
  }

  const handleAddMembersToGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeGroupObj || !manageEmails.trim()) return
    const emails = parseEmails(manageEmails)
    const { error } = await groupsService.addMembersToGroup(activeGroupObj.id, emails)
    if (!error) {
      await refresh()
      setManageEmails('')
    }
  }

  const handleRemoveMember = async (email: string) => {
    if (!activeGroupObj) return
    const { error } = await groupsService.removeMember(activeGroupObj.id, email)
    if (!error) await refresh()
  }

  const handleDeleteGroup = async () => {
    if (!activeGroupObj) return
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${activeGroupObj.name}"?`)) return
    const { error } = await groupsService.deleteGroup(activeGroupObj.id)
    if (!error) {
      await refresh()
      setCompareFilter('all')
      setIsManagingGroup(false)
    }
  }

  return {
    groups,
    isLoadingGroups,
    isCreatingGroup,
    createGroupError,
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
