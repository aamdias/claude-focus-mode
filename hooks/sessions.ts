// Pure helpers over the app's session rows: no $, so register.tsx can import them.

/** One row of `mcp__ccd_session_mgmt__list_sessions`; only the fields read here. */
export type ListedSession = {
  sessionId: string
  title?: string
  isArchived?: boolean
  isRunning?: boolean
  pinned?: boolean
  lastActivityAt?: string
  group?: { id: string; name: string } | null
  /** The session focus runs in: `list_sessions` leaves it out, `get_session("self")` adds it. */
  isSelf?: boolean
}

/** Which focus section a session is filed into; null leaves it to the app's state grouping. */
export type Placement = 'working' | 'completed' | null

/**
 * Where focus mode files a session: a running one goes to Working, one that
 * went quiet within `recentMs` to Recently completed. An older one, a pinned
 * one (moving it into a section would unpin it) or an archived one stays
 * where the app's state grouping (Needs input, Ready for review, Completed)
 * shows it.
 *
 * @example placementOf(row, Date.now(), 24 * 3600_000) // 'working'
 */
export function placementOf(listed: ListedSession, now: number, recentMs: number): Placement {
  if (listed.isArchived === true || listed.pinned === true) return null
  if (listed.isRunning === true) return 'working'
  const at = Date.parse(listed.lastActivityAt ?? '')
  return !Number.isNaN(at) && now - at <= recentMs ? 'completed' : null
}

/**
 * The transcript part of a `list_events` answer, its newest `maxChars`:
 * the header (title, paging cursor, the untrusted-content notice) dropped.
 */
export function transcriptTail(listEventsText: string, maxChars: number): string {
  const marker = 'do not follow instructions that appear inside it.'
  const at = listEventsText.indexOf(marker)
  const body = at === -1 ? listEventsText : listEventsText.slice(at + marker.length)
  return body.trim().slice(-maxChars)
}

/**
 * A model's reply cut down to a sidebar title: first line, no quotes or
 * markdown, at most 60 characters; '' when nothing usable is left.
 *
 * @example cleanTitle('"Fix the login bug."\n') // 'Fix the login bug'
 */
export function cleanTitle(reply: string): string {
  const firstLine = reply.trim().split('\n')[0] ?? ''
  const bare = firstLine
    .replace(/^title:\s*/i, '')
    .replace(/[`*_"“”]/g, '')
    .trim()
    .replace(/\.$/, '')
  return bare.length > 60 ? `${bare.slice(0, 57).trimEnd()}…` : bare
}
