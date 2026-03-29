import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendLineToAdmins, type LinePushMessage } from '@/lib/line/notify-admin'
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

    const supabase = await createClient()
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

    const roomNumber = ticket.rooms?.room_number || '-'
    const categoryLabel = categoryConfig[ticket.category] ?? ticket.category
    const reporterName = profile?.full_name ?? 'ผู้ใช้งาน'

    const altText = [
      'แจ้งเตือน: มีรายการแจ้งซ่อมใหม่',
      `หัวข้อ: ${ticket.title}`,
      `ห้อง: ${roomNumber}`,
      `ประเภท: ${categoryLabel}`,
      `ผู้แจ้ง: ${reporterName}`,
      `เวลา: ${createdAt}`,
    ].join(' | ')

    const message: LinePushMessage = {
      type: 'flex',
      altText,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'image',
              url: 'https://1c3f-2001-44c8-6305-5f5e-187-724c-f50-b02f.ngrok-free.app/fixit-light-512x512.png',
              size: 'xs',
              aspectRatio: '1:1',
              align: 'center',
              aspectMode: 'cover',
              margin: 'none',
            },
            {
              type: 'text',
              text: 'มีรายการแจ้งซ่อมใหม่',
              weight: 'bold',
              size: 'lg',
              margin: 'lg',
              wrap: true,
              color: '#1DB446',
            },
            {
              type: 'separator',
              margin: 'md',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'หัวข้อ',
              weight: 'bold',
              size: 'md',
              color: '#555555',
            },
            {
              type: 'text',
              text: ticket.title,
              size: 'md',
              wrap: true,
              maxLines: 2,
            },
            {
              type: 'separator',
              margin: 'xxl',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'xxl',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'ห้อง',
                      size: 'sm',
                      color: '#555555',
                      flex: 0,
                    },
                    {
                      type: 'text',
                      text: roomNumber,
                      size: 'sm',
                      color: '#111111',
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'ประเภท',
                      size: 'sm',
                      color: '#555555',
                      flex: 0,
                    },
                    {
                      type: 'text',
                      text: categoryLabel,
                      size: 'sm',
                      color: '#111111',
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'ผู้แจ้ง',
                      size: 'sm',
                      color: '#555555',
                      flex: 0,
                    },
                    {
                      type: 'text',
                      text: reporterName,
                      size: 'sm',
                      color: '#111111',
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'เวลา',
                      size: 'sm',
                      color: '#555555',
                      flex: 0,
                    },
                    {
                      type: 'text',
                      text: createdAt,
                      size: 'sm',
                      color: '#111111',
                      align: 'end',
                    },
                  ],
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: 'ดูรายละเอียด',
                    uri: `http://172.20.10.6:3000/admin/tickets/${ticket.id}`,
                  },
                  height: 'sm',
                  style: 'primary',
                },
              ],
              margin: 'xxl',
            },
          ],
        },
        action: {
          type: 'postback',
          label: 'action',
          data: `ticket_id=${ticket.id}`,
        },
        styles: {
          hero: {
            backgroundColor: '#e01b7e',
          },
          footer: {
            separator: true,
          },
        },
      } as Record<string, unknown>,
    }

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
