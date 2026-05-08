export interface GroupMember {
  email: string
  userId: string | null
  joinedAt: string | null
}

export interface Group {
  id: string
  name: string
  ownerId: string
  members: GroupMember[]
}
