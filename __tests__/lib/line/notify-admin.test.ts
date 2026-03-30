import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendLineToAdmins } from '@/lib/line/notify-admin'
import type { LinePushMessage } from '@/lib/line/notify-admin'

// Helper to build a successful fetch response
function successResponse() {
  return Promise.resolve(new Response(null, { status: 200 }))
}

// Helper to build a failed fetch response
function failResponse(status: number, body: string) {
  return Promise.resolve(new Response(body, { status }))
}

describe('sendLineToAdmins', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN
    delete process.env.LINE_ADMIN_USER_IDS
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---- Guard-clause tests -----------------------------------------------

  describe('when LINE_CHANNEL_ACCESS_TOKEN is missing', () => {
    it('returns ok:false with an informative error and does not call fetch', async () => {
      process.env.LINE_ADMIN_USER_IDS = 'U111'

      const result = await sendLineToAdmins('hello')

      expect(result.ok).toBe(false)
      expect(result.sent).toBe(0)
      expect(result.errors).toContain('LINE_CHANNEL_ACCESS_TOKEN is not configured')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('sets failed count equal to the number of configured admin IDs', async () => {
      process.env.LINE_ADMIN_USER_IDS = 'U111,U222,U333'

      const result = await sendLineToAdmins('hello')

      expect(result.failed).toBe(3)
    })
  })

  describe('when LINE_ADMIN_USER_IDS is missing or empty', () => {
    it('returns ok:false with an informative error and does not call fetch (env unset)', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'

      const result = await sendLineToAdmins('hello')

      expect(result.ok).toBe(false)
      expect(result.sent).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.errors).toContain('LINE_ADMIN_USER_IDS is empty')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('returns ok:false when LINE_ADMIN_USER_IDS is an empty string', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = ''

      const result = await sendLineToAdmins('hello')

      expect(result.ok).toBe(false)
      expect(result.errors).toContain('LINE_ADMIN_USER_IDS is empty')
    })

    it('returns ok:false when LINE_ADMIN_USER_IDS contains only commas/spaces', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = ' , , '

      const result = await sendLineToAdmins('hello')

      expect(result.ok).toBe(false)
      expect(result.errors).toContain('LINE_ADMIN_USER_IDS is empty')
    })
  })

  // ---- Message normalisation tests --------------------------------------

  describe('message normalisation via plain-string shorthand', () => {
    it('wraps a string message into a text message object', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      await sendLineToAdmins('hello world')

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.messages).toEqual([{ type: 'text', text: 'hello world' }])
    })
  })

  describe('message normalisation with a single LinePushMessage object', () => {
    it('wraps a single message object in an array', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      const msg: LinePushMessage = { type: 'text', text: 'single' }
      await sendLineToAdmins(msg)

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.messages).toEqual([msg])
    })
  })

  describe('message normalisation with a LinePushMessage array', () => {
    it('passes through an array of messages unchanged', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      const msgs: LinePushMessage[] = [
        { type: 'text', text: 'msg1' },
        { type: 'text', text: 'msg2' },
      ]
      await sendLineToAdmins(msgs)

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.messages).toEqual(msgs)
    })
  })

  // ---- Successful delivery tests ----------------------------------------

  describe('successful delivery', () => {
    it('calls fetch once per admin user ID', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111,U222,U333'
      vi.mocked(fetch)
        .mockImplementationOnce(() => successResponse())
        .mockImplementationOnce(() => successResponse())
        .mockImplementationOnce(() => successResponse())

      const result = await sendLineToAdmins('hi')

      expect(fetch).toHaveBeenCalledTimes(3)
      expect(result.ok).toBe(true)
      expect(result.sent).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('sends to the correct LINE Push API URL', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      await sendLineToAdmins('test')

      const [url] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe('https://api.line.me/v2/bot/message/push')
    })

    it('sends the Authorization header with the Bearer token', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'my-secret-token'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      await sendLineToAdmins('test')

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const headers = (init as RequestInit).headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer my-secret-token')
    })

    it('sets Content-Type to application/json', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      await sendLineToAdmins('test')

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const headers = (init as RequestInit).headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('includes the recipient user ID in the request body', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U999'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      await sendLineToAdmins('hi')

      const [, init] = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.to).toBe('U999')
    })

    it('trims whitespace from admin user IDs in the env variable', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = '  U111  ,  U222  '
      vi.mocked(fetch)
        .mockImplementationOnce(() => successResponse())
        .mockImplementationOnce(() => successResponse())

      const result = await sendLineToAdmins('hi')

      expect(result.sent).toBe(2)
      const recipients = vi.mocked(fetch).mock.calls.map(([, init]) => {
        const body = JSON.parse((init as RequestInit).body as string)
        return body.to as string
      })
      expect(recipients).toEqual(['U111', 'U222'])
    })
  })

  // ---- Partial/full failure tests ----------------------------------------

  describe('partial failure', () => {
    it('counts a 4xx response as a failure', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => failResponse(400, 'bad request'))

      const result = await sendLineToAdmins('hi')

      expect(result.ok).toBe(false)
      expect(result.sent).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors[0]).toMatch(/400/)
      expect(result.errors[0]).toMatch(/U111/)
    })

    it('counts a 5xx response as a failure', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => failResponse(500, 'server error'))

      const result = await sendLineToAdmins('hi')

      expect(result.ok).toBe(false)
      expect(result.failed).toBe(1)
    })

    it('returns partial success when some recipients succeed and some fail', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111,U222,U333'
      vi.mocked(fetch)
        .mockImplementationOnce(() => successResponse())
        .mockImplementationOnce(() => failResponse(401, 'unauthorized'))
        .mockImplementationOnce(() => successResponse())

      const result = await sendLineToAdmins('hi')

      expect(result.ok).toBe(false)
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('accumulates error messages for all failed recipients', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111,U222'
      vi.mocked(fetch)
        .mockImplementationOnce(() => failResponse(400, 'err1'))
        .mockImplementationOnce(() => failResponse(403, 'err2'))

      const result = await sendLineToAdmins('hi')

      expect(result.errors).toHaveLength(2)
    })

    it('handles a fetch network error (rejected promise) as a failure', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => Promise.reject(new Error('network error')))

      const result = await sendLineToAdmins('hi')

      expect(result.ok).toBe(false)
      expect(result.failed).toBe(1)
      expect(result.errors[0]).toContain('network error')
    })
  })

  // ---- Flex message tests -----------------------------------------------

  describe('flex message delivery', () => {
    it('sends a flex message to all admins', async () => {
      process.env.LINE_CHANNEL_ACCESS_TOKEN = 'token123'
      process.env.LINE_ADMIN_USER_IDS = 'U111'
      vi.mocked(fetch).mockImplementationOnce(() => successResponse())

      const flexMsg: LinePushMessage = {
        type: 'flex',
        altText: 'alt',
        contents: { type: 'bubble' },
      }
      const result = await sendLineToAdmins(flexMsg)

      expect(result.ok).toBe(true)
      const [, init] = vi.mocked(fetch).mock.calls[0]
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.messages[0]).toEqual(flexMsg)
    })
  })
})
