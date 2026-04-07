import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type InviteBody = {
  fullName?: string
  phone?: string
  email?: string
  roomId?: string
}

type CancelInviteBody = {
  userId?: string
}

type ToggleUserActiveBody = {
  userId?: string
  isActive?: boolean
}

async function assertCanManageUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: actor } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  const canManageUsers = actor?.is_active && (actor?.role === 'admin' || actor?.role === 'owner')

  if (!canManageUsers) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase }
}

export async function POST(request: Request) {
  const access = await assertCanManageUsers()
  if ('error' in access) {
    return access.error
  }

  const appOrigin = new URL(request.url).origin

  const supabase = access.supabase
  const body = (await request.json()) as InviteBody

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
      redirectTo: `${appOrigin}/auth/update-password`,
      data: {
        full_name: fullName,
        phone,
        role: 'resident',
        room_id: roomId,
        is_active: false,
        status: 'pending',
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
      is_active: false,
      status: 'pending',
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
      isActive: false,
      status: 'pending',
    },
  })
}

export async function DELETE(request: Request) {
  const access = await assertCanManageUsers()
  if ('error' in access) {
    return access.error
  }

  const supabase = access.supabase
  const body = (await request.json()) as CancelInviteBody
  const userId = body.userId?.trim() || ''

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, room_id, status')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'ไม่พบคำเชิญนี้' }, { status: 404 })
  }

  if (profile.status !== 'pending') {
    return NextResponse.json(
      { error: 'ยกเลิกได้เฉพาะคำเชิญที่อยู่ในสถานะ pending' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  if (profile.room_id) {
    const { error: updateRoomError } = await adminClient
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', profile.room_id)

    if (updateRoomError) {
      return NextResponse.json({ error: updateRoomError.message }, { status: 400 })
    }
  }

  const { error: deleteProfileError } = await adminClient.from('profiles').delete().eq('id', userId)
  if (deleteProfileError) {
    return NextResponse.json({ error: deleteProfileError.message }, { status: 400 })
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(profile.id)
  if (deleteAuthError) {
    return NextResponse.json({ error: deleteAuthError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const access = await assertCanManageUsers()
  if ('error' in access) {
    return access.error
  }

  const body = (await request.json()) as ToggleUserActiveBody
  const userId = body.userId?.trim() || ''
  const isActive = body.isActive

  if (!userId || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'userId and isActive are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: targetUser, error: targetUserError } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (targetUserError || !targetUser) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 })
  }

  if (targetUser.role === 'admin' || targetUser.role === 'owner') {
    return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนสถานะผู้ดูแลระบบได้' }, { status: 400 })
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      is_active: isActive,
      status: isActive ? 'active' : 'inactive',
    })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    user: {
      id: userId,
      isActive,
      status: isActive ? 'active' : 'inactive',
    },
  })
}
