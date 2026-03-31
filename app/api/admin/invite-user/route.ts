import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  const canManageUsers = actor?.is_active && (actor?.role === 'admin' || actor?.role === 'owner')

  if (!canManageUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as {
    fullName?: string
    phone?: string
    email?: string
    roomId?: string
  }

  const fullName = body.fullName?.trim() || ''
  const phone = body.phone?.trim() || ''
  const email = body.email?.trim().toLowerCase() || ''
  const roomId = body.roomId?.trim() || ''

  if (!fullName || !phone || !email || !roomId) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, room_number, status')
    .eq('id', roomId)
    .single()

  if (!room || room.status !== 'available') {
    return NextResponse.json({ error: 'ห้องนี้ไม่พร้อมใช้งาน' }, { status: 400 })
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: fullName,
        phone,
        role: 'resident',
        room_id: roomId,
        is_active: true,
      },
    }
  )

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  const invitedId = inviteData.user?.id

  if (invitedId) {
    const { error: upsertError } = await adminClient.from('profiles').upsert({
      id: invitedId,
      full_name: fullName,
      email,
      phone,
      role: 'resident',
      room_id: roomId,
      is_active: true,
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    const { error: updateRoomError } = await adminClient
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', roomId)

    if (updateRoomError) {
      return NextResponse.json({ error: updateRoomError.message }, { status: 400 })
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      id: invitedId,
      fullName,
      phone,
      email,
      roomId,
      roomNumber: room.room_number,
      role: 'resident',
      isActive: true,
    },
  })
}
