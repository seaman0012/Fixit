import { createClient } from '@/lib/supabase/server'
import UserManagementClient, { type UserRecord } from '@/components/admin/user-management-client'

export default async function AdminUserManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileQuery = user?.id
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const profileData = profileQuery.data

  const { data } = (await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      phone,
      email,
      role,
      status,
      is_active,
      room_id,
      rooms:room_id (
        room_number
      )
    `
    )
    .order('full_name', { ascending: true })) as {
    data: Array<{
      id: string
      full_name: string
      phone: string | null
      email: string
      role: string
      status: string
      is_active: boolean
      room_id: string | null
      rooms: { room_number: string } | null
    }> | null
  }

  const { data: availableRoomsData } = (await supabase
    .from('rooms')
    .select('id, room_number')
    .eq('status', 'available')
    .order('room_number', { ascending: true })) as {
    data: Array<{ id: string; room_number: string }> | null
  }

  const users: UserRecord[] = (data ?? []).map((user) => ({
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
    isActive: user.is_active,
    roomId: user.room_id,
    roomNumber: user.rooms?.room_number ?? null,
  }))

  const availableRooms = (availableRoomsData ?? []).map((room) => ({
    id: room.id,
    roomNumber: room.room_number,
  }))

  const isReadOnly = profileData?.role === 'owner'

  return (
    <UserManagementClient
      initialUsers={users}
      availableRooms={availableRooms}
      readOnly={isReadOnly}
    />
  )
}
