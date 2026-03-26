import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

type LineWebhookEvent = {
  type: string
  replyToken?: string
  source?: {
    userId?: string
    type?: string
  }
  message?: {
    type?: string
    id?: string
    text?: string
  }
}

type LineWebhookPayload = {
  destination?: string
  events?: LineWebhookEvent[]
}

// Verifies LINE webhook signature using channel secret (HMAC-SHA256).
function verifyLineSignature(body: string, signature: string, channelSecret: string): boolean {
  const expectedSignature = createHmac('sha256', channelSecret).update(body).digest('base64')

  const expected = Buffer.from(expectedSignature, 'utf8')
  const received = Buffer.from(signature, 'utf8')

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(expected, received)
}

// POST /api/line/webhook
// Receives webhook payloads from LINE and rejects requests with invalid signatures.
export async function POST(request: Request) {
  try {
    // Keep raw body text for exact signature verification.
    const body = await request.text()
    const signature = request.headers.get('x-line-signature')
    const channelSecret = process.env.LINE_CHANNEL_SECRET

    if (!channelSecret) {
      console.error('[LINE webhook] missing LINE_CHANNEL_SECRET')
      return NextResponse.json({ error: 'LINE webhook is not configured' }, { status: 500 })
    }

    if (!signature || !verifyLineSignature(body, signature, channelSecret)) {
      console.warn('[LINE webhook] invalid signature', {
        hasSignature: Boolean(signature),
        signature: signature ?? null,
        bodyLength: body.length,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body) as LineWebhookPayload
    const events = payload.events ?? []
    const textMessageEvents = events.filter(
      (event) => event.type === 'message' && event.message?.type === 'text'
    )

    // Receive-only mode: log incoming text messages, do not save or reply.
    for (const event of textMessageEvents) {
      console.log('[LINE webhook] text message received', {
        userId: event.source?.userId ?? null,
        messageId: event.message?.id ?? null,
        text: event.message?.text ?? '',
      })
    }

    console.log('[LINE webhook] received', {
      hasSignature: true,
      signature: signature ?? null,
      verified: true,
      bodyLength: body.length,
      eventCount: events.length,
      textMessageCount: textMessageEvents.length,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[LINE webhook] error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Health check for webhook endpoint monitoring.
export async function GET() {
  return NextResponse.json({ ok: true, message: 'LINE webhook endpoint is alive' }, { status: 200 })
}
