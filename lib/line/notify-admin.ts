type SendLineAdminsResult = {
  ok: boolean
  sent: number
  failed: number
  errors: string[]
}

export type LinePushMessage =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'flex'
      altText: string
      contents: Record<string, unknown>
    }

type SendLineAdminsInput = string | LinePushMessage | LinePushMessage[]

// Parses comma-separated LINE user IDs from env.
function getAdminUserIds(): string[] {
  const raw = process.env.LINE_ADMIN_USER_IDS ?? ''
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

function normalizeMessages(input: SendLineAdminsInput): LinePushMessage[] {
  if (typeof input === 'string') {
    return [{ type: 'text', text: input }]
  }

  return Array.isArray(input) ? input : [input]
}

// Sends the same LINE message(s) to all configured admin LINE accounts via Push API.
// Returns aggregate success/failure stats so callers can log partial failures.
export async function sendLineToAdmins(input: SendLineAdminsInput): Promise<SendLineAdminsResult> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const adminUserIds = getAdminUserIds()
  const messages = normalizeMessages(input)

  if (!accessToken) {
    return {
      ok: false,
      sent: 0,
      failed: adminUserIds.length,
      errors: ['LINE_CHANNEL_ACCESS_TOKEN is not configured'],
    }
  }

  if (adminUserIds.length === 0) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      errors: ['LINE_ADMIN_USER_IDS is empty'],
    }
  }

  // Send in parallel and keep per-recipient result instead of failing fast.
  const results = await Promise.allSettled(
    adminUserIds.map(async (to) => {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to,
          messages,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`LINE push failed (${response.status}) for ${to}: ${body}`)
      }
    })
  )

  const sent = results.filter((result) => result.status === 'fulfilled').length
  const rejected = results.filter((result) => result.status === 'rejected')

  return {
    ok: rejected.length === 0,
    sent,
    failed: rejected.length,
    errors: rejected.map((result) => String(result.reason)),
  }
}
