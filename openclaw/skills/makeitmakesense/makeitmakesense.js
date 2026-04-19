/**
 * Make It Make Sense — API helpers for OpenClaw / Discord / local scripts.
 * Requires the Next app running and (for real data) a Supabase session cookie.
 *
 * Dev: copy your browser Cookie header after login:
 *   export MAKEITMAKESENSE_COOKIE='...'
 *   (DevTools → Network → request headers → Cookie)
 *
 * Base URL:
 *   export MAKEITMAKESENSE_BASE_URL=http://localhost:3000
 */

const BASE_URL = (process.env.MAKEITMAKESENSE_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
)

function headers(json = true) {
  const h = {}
  if (json) h['Content-Type'] = 'application/json'
  const cookie =
    process.env.MAKEITMAKESENSE_COOKIE || process.env.RONTZEN_COOKIE
  if (cookie) h['Cookie'] = cookie
  return h
}

/** @param {{ doc_type?: string, message?: string, docId?: string | null, conversationId?: string | null }} args */
export async function draft_document(args = {}) {
  const message =
    args.message ||
    (args.doc_type
      ? `Draft a ${args.doc_type} for our company using our workspace context and metrics. Use Markdown.`
      : 'Draft a board memo for our company using our workspace context and metrics. Use Markdown.')

  const res = await fetch(`${BASE_URL}/api/platform/agent`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      message,
      docId: args.docId ?? undefined,
      conversationId: args.conversationId ?? undefined,
    }),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    return { ok: false, status: res.status, ...data }
  }
  return { ok: true, ...data }
}

export async function check_consistency() {
  const res = await fetch(`${BASE_URL}/api/platform/consistency/run`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, status: res.status, ...data }
  }
  return { ok: true, ...data }
}

/** @param {{ docId?: string | null }} args */
export async function get_decision_log(args = {}) {
  const q = args.docId ? `?docId=${encodeURIComponent(args.docId)}` : ''
  const res = await fetch(`${BASE_URL}/api/platform/decision-log${q}`, {
    method: 'GET',
    headers: headers(false),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, status: res.status, ...data }
  }
  return { ok: true, ...data }
}
