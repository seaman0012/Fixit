import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'

// ---------------------------------------------------------------------------
// Type for the mock JSON response returned by the NextResponse stub.
// ---------------------------------------------------------------------------
type MockResponse = { body: Record<string, unknown>; status: number }

// ---------------------------------------------------------------------------
// Minimal NextResponse stub – only the methods used in the route under test.
// ---------------------------------------------------------------------------
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json(body: Record<string, unknown>, init?: { status?: number }): MockResponse {
        return {
          body,
          status: init?.status ?? 200,
        }
      },
    },
  }
})

// Import the route handlers after mocking next/server
import { POST, GET } from '@/app/api/line/webhook/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a valid LINE webhook signature for the given body+secret. */
function makeSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64')
}

/** Create a minimal Request-like object that the route expects. */
function buildRequest(body: string, signature: string | null): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (signature !== null) {
    headers.set('x-line-signature', signature)
  }
  return new Request('https://example.com/api/line/webhook', {
    method: 'POST',
    headers,
    body,
  })
}

/** Cast the route return value to MockResponse for easy assertions. */
function asMock(res: unknown): MockResponse {
  return res as MockResponse
}

const CHANNEL_SECRET = 'test-channel-secret'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/line/webhook', () => {
  it('returns 200 with a health check message', async () => {
    const res = asMock(await GET())
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, message: 'LINE webhook endpoint is alive' })
  })
})

describe('POST /api/line/webhook', () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = CHANNEL_SECRET
  })

  afterEach(() => {
    delete process.env.LINE_CHANNEL_SECRET
    vi.restoreAllMocks()
  })

  // ---- Configuration guard -----------------------------------------------

  it('returns 500 when LINE_CHANNEL_SECRET is not configured', async () => {
    delete process.env.LINE_CHANNEL_SECRET
    const body = JSON.stringify({ destination: 'dest', events: [] })
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(500)
    expect(String(res.body.error)).toMatch(/not configured/i)
  })

  // ---- Signature validation ----------------------------------------------

  it('returns 401 when the x-line-signature header is missing', async () => {
    const body = JSON.stringify({ destination: 'dest', events: [] })
    const req = buildRequest(body, null)

    const res = asMock(await POST(req))

    expect(res.status).toBe(401)
    expect(String(res.body.error)).toMatch(/invalid signature/i)
  })

  it('returns 401 when the signature is wrong', async () => {
    const body = JSON.stringify({ destination: 'dest', events: [] })
    const req = buildRequest(body, 'wrong-signature')

    const res = asMock(await POST(req))

    expect(res.status).toBe(401)
    expect(String(res.body.error)).toMatch(/invalid signature/i)
  })

  it('returns 401 when the signature was computed with a different secret', async () => {
    const body = JSON.stringify({ destination: 'dest', events: [] })
    const req = buildRequest(body, makeSignature(body, 'different-secret'))

    const res = asMock(await POST(req))

    expect(res.status).toBe(401)
  })

  // ---- Successful requests -----------------------------------------------

  it('returns 200 ok for a valid empty-events payload', async () => {
    const body = JSON.stringify({ destination: 'dest', events: [] })
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('accepts a payload with a text message event', async () => {
    const payload = {
      destination: 'Udeadbeef',
      events: [
        {
          type: 'message',
          replyToken: 'reply-token',
          source: { type: 'user', userId: 'U123' },
          message: { type: 'text', id: 'msg-1', text: 'Hello' },
        },
      ],
    }
    const body = JSON.stringify(payload)
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('accepts a payload with a non-text message event (no crash)', async () => {
    const payload = {
      destination: 'Udeadbeef',
      events: [
        {
          type: 'message',
          source: { type: 'user', userId: 'U123' },
          message: { type: 'image', id: 'msg-2' },
        },
      ],
    }
    const body = JSON.stringify(payload)
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(200)
  })

  it('accepts a payload without an events array', async () => {
    const body = JSON.stringify({ destination: 'dest' })
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(200)
  })

  it('returns 500 when the request body is not valid JSON', async () => {
    const body = 'not-valid-json'
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(500)
    expect(String(res.body.error)).toMatch(/internal server error/i)
  })

  // ---- Signature exactness ------------------------------------------------

  it('accepts exactly the same body used to compute the signature', async () => {
    // Even one character difference would invalidate the signature
    const body = '{"destination":"U1","events":[]}'
    const req = buildRequest(body, makeSignature(body, CHANNEL_SECRET))

    const res = asMock(await POST(req))

    expect(res.status).toBe(200)
  })
})
