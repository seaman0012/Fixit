import { createClient } from '@/lib/supabase/server'
import RoomManagementClient, { type RoomRecord } from '@/components/admin/room-management-client'

export default async function AdminRoomManagementPage() {
  const supabase = await createClient()

  const { data } = (await supabase
    .from('rooms')
    .select(
      `
      id,
      room_number,
      floor,
      status,
      created_at,
      profiles (
        id,
        full_name,
        role,
        is_active
      ),
      tickets (
        id,
        status
      )
    `
    )
    .order('floor', { ascending: true })
    .order('room_number', { ascending: true })) as {
    data: Array<{
      id: string
      room_number: string
      floor: string
      status: string
      created_at: string
      profiles: Array<{ id: string; full_name: string; role: string; is_active: boolean }> | null
      tickets: Array<{ id: string; status: string }> | null
    }> | null
  }

  const rooms: RoomRecord[] = (data ?? []).map((room) => {
    const occupants = (room.profiles ?? []).filter(
      (profile) => profile.role === 'resident' && profile.is_active
    )
    const activeTickets = (room.tickets ?? []).filter(
      (ticket) => ticket.status === 'pending' || ticket.status === 'in_progress'
    ).length

    return {
      id: room.id,
      roomNumber: room.room_number,
      floor: room.floor,
      status: room.status,
      roomType: 'Standard',
      currentResidentName: occupants[0]?.full_name ?? null,
      activeTicketCount: activeTickets,
      occupantCount: occupants.length,
    }
  })

  return (
    <div>
      <RoomManagementClient initialRooms={rooms} />
    </div>
  )
}
