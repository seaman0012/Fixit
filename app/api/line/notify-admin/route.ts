import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendLineToAdmins } from '@/lib/line/notify-admin'
import { categoryConfig } from '@/lib/constants'

// Request payload for triggering LINE admin notification.
type NotifyAdminRequest = {
  ticketId?: string
}

// POST /api/line/notify-admin
// Validates the current user, loads their ticket details, builds a readable message,
// and forwards it to all configured LINE admin recipients.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotifyAdminRequest
    if (!body.ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow notifying for tickets owned by the authenticated user.
    const { data: ticket, error: ticketError } = (await supabase
      .from('tickets')
      .select(
        `
        id,
        title,
        category,
        created_at,
        rooms:room_id (
          room_number
        )
      `
      )
      .eq('id', body.ticketId)
      .eq('user_id', user.id)
      .single()) as {
      data: {
        id: string
        title: string
        category: keyof typeof categoryConfig
        rooms: { room_number: string } | null
        created_at: string
      } | null
      error: { message?: string } | null
    }

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: profile } = (await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()) as {
      data: { full_name: string } | null
      error: { message?: string } | null
    }

    // Build a message for admin LINE chat with key ticket metadata.
    const createdAt = new Date(ticket.created_at).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    const message = [
      'แจ้งเตือน: มีรายการแจ้งซ่อมใหม่',
      `หัวข้อ: ${ticket.title}`,
      `ห้อง: ${ticket.rooms?.room_number || '-'}`,
      `ประเภท: ${categoryConfig[ticket.category] ?? ticket.category}`,
      `ผู้แจ้ง: ${profile?.full_name ?? 'ผู้ใช้งาน'}`,
      `เวลา: ${createdAt}`,
    ].join('\n')

    // Push the message to all configured admin LINE user IDs.
    const lineResult = await sendLineToAdmins(message)

    if (!lineResult.ok) {
      console.error('[LINE notify-admin] partial/failed', lineResult)
    }

    return NextResponse.json({ ok: true, lineResult })
  } catch (error) {
    console.error('[LINE notify-admin] unexpected error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
