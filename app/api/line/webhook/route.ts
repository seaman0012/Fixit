import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifyLineSignature(body: string, signature: string, channelSecret: string): boolean {
  const expectedSignature = createHmac('sha256', channelSecret).update(body).digest('base64')

  const expected = Buffer.from(expectedSignature, 'utf8')
  const received = Buffer.from(signature, 'utf8')

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(expected, received)
}

export async function POST(request: Request) {
  try {
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
        bodyLength: body.length,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[LINE webhook] received', {
      hasSignature: true,
      verified: true,
      bodyLength: body.length,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[LINE webhook] error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'LINE webhook endpoint is alive' }, { status: 200 })
}
