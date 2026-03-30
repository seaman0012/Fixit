import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Type for the mock JSON response returned by the NextResponse stub.
// ---------------------------------------------------------------------------
type MockResponse = { body: Record<string, unknown>; status: number }

// ---------------------------------------------------------------------------
// Stubs for Next.js server modules
// ---------------------------------------------------------------------------
vi.mock('next/server', () => ({
  NextResponse: {
    json(body: Record<string, unknown>, init?: { status?: number }): MockResponse {
      return { body, status: init?.status ?? 200 }
    },
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Supabase server client mock – helpers defined first so the mock factory
// can reference them without hoisting issues.
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn()
const mockTicketSingle = vi.fn()
const mockProfileSingle = vi.fn()

/** Build the chain: .select().eq().eq().single() → mockTicketSingle */
function buildTicketChain() {
  const single = { single: mockTicketSingle }
  const eqUser = { eq: () => single }
  const eqId = { eq: () => eqUser }
  return { select: () => eqId }
}

/** Build the chain: .select().eq().single() → mockProfileSingle */
function buildProfileChain() {
  const single = { single: mockProfileSingle }
  const eqId = { eq: () => single }
  return { select: () => eqId }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === 'tickets') return buildTicketChain()
        if (table === 'profiles') return buildProfileChain()
        return {}
      },
    })
  ),
}))

// ---------------------------------------------------------------------------
// LINE notify-admin lib mock
// ---------------------------------------------------------------------------
const mockSendLineToAdmins = vi.fn()
vi.mock('@/lib/line/notify-admin', () => ({
  sendLineToAdmins: (...args: unknown[]) => mockSendLineToAdmins(...args),
}))

// Import route AFTER mocks are registered
import { POST } from '@/app/api/line/notify-admin/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(body: unknown): Request {
  return new Request('https://example.com/api/line/notify-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Cast the route return value to MockResponse for easy assertions. */
function asMock(res: unknown): MockResponse {
  return res as MockResponse
}

const MOCK_USER = { id: 'user-1' }
const MOCK_TICKET = {
  id: 'ticket-1',
  title: 'Water leak',
  category: 'plumbing' as const,
  rooms: { room_number: '101' },
  created_at: new Date('2024-01-15T10:00:00Z').toISOString(),
}
const MOCK_PROFILE = { full_name: 'John Doe' }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/line/notify-admin', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockTicketSingle.mockResolvedValue({ data: MOCK_TICKET, error: null })
    mockProfileSingle.mockResolvedValue({ data: MOCK_PROFILE, error: null })
    mockSendLineToAdmins.mockResolvedValue({ ok: true, sent: 1, failed: 0, errors: [] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ---- Validation ---------------------------------------------------------

  it('returns 400 when ticketId is missing', async () => {
    const res = asMock(await POST(buildRequest({})))
    expect(res.status).toBe(400)
    expect(String(res.body.error)).toMatch(/ticketId is required/i)
  })

  it('returns 400 when request body has no ticketId field', async () => {
    const res = asMock(await POST(buildRequest({ someOtherField: 'value' })))
    expect(res.status).toBe(400)
  })

  // ---- Authentication checks ----------------------------------------------

  it('returns 401 when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(401)
    expect(String(res.body.error)).toMatch(/unauthorized/i)
  })

  it('returns 401 when auth returns an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'auth error' } })

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(401)
  })

  // ---- Ticket lookup ------------------------------------------------------

  it('returns 404 when the ticket is not found', async () => {
    mockTicketSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const res = asMock(await POST(buildRequest({ ticketId: 'nonexistent' })))

    expect(res.status).toBe(404)
    expect(String(res.body.error)).toMatch(/ticket not found/i)
  })

  it('returns 404 when ticket data is null without an error', async () => {
    mockTicketSingle.mockResolvedValue({ data: null, error: null })

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(404)
  })

  // ---- Successful notification --------------------------------------------

  it('returns 200 with ok:true on a successful notification', async () => {
    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('calls sendLineToAdmins with a flex message containing ticket details', async () => {
    await POST(buildRequest({ ticketId: 'ticket-1' }))

    expect(mockSendLineToAdmins).toHaveBeenCalledOnce()
    const [message] = mockSendLineToAdmins.mock.calls[0] as [Record<string, unknown>]
    expect(message.type).toBe('flex')
    expect(String(message.altText)).toContain('Water leak')
    expect(String(message.altText)).toContain('101')
    expect(String(message.altText)).toContain('John Doe')
  })

  it('includes the LINE result in the response body', async () => {
    const lineResult = { ok: true, sent: 2, failed: 0, errors: [] }
    mockSendLineToAdmins.mockResolvedValue(lineResult)

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.body.lineResult).toEqual(lineResult)
  })

  it('uses a fallback room number "-" when rooms is null', async () => {
    mockTicketSingle.mockResolvedValue({
      data: { ...MOCK_TICKET, rooms: null },
      error: null,
    })

    await POST(buildRequest({ ticketId: 'ticket-1' }))

    const [message] = mockSendLineToAdmins.mock.calls[0] as [Record<string, unknown>]
    expect(String(message.altText)).toContain('-')
  })

  it('uses a fallback reporter name when profile is null', async () => {
    mockProfileSingle.mockResolvedValue({ data: null, error: null })

    await POST(buildRequest({ ticketId: 'ticket-1' }))

    const [message] = mockSendLineToAdmins.mock.calls[0] as [Record<string, unknown>]
    expect(String(message.altText)).toContain('ผู้ใช้งาน')
  })

  it('still returns 200 when sendLineToAdmins reports partial failure', async () => {
    mockSendLineToAdmins.mockResolvedValue({
      ok: false,
      sent: 0,
      failed: 1,
      errors: ['some error'],
    })

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  // ---- Error handling -----------------------------------------------------

  it('returns 500 on an unexpected error', async () => {
    mockGetUser.mockRejectedValue(new Error('unexpected'))

    const res = asMock(await POST(buildRequest({ ticketId: 'ticket-1' })))

    expect(res.status).toBe(500)
    expect(String(res.body.error)).toMatch(/internal server error/i)
  })
})
