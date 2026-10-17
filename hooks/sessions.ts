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
  /** Set when the session opened a pull request; `prState` as GitHub spells it (`OPEN`, `MERGED`, `CLOSED`). */
  prNumber?: number
  prState?: string
  /** The session focus runs in: `list_sessions` leaves it out, `get_session("self")` adds it. */
  isSelf?: boolean
}

/** Which focus section a session is filed into; null leaves it to the app's state grouping. */
export type Placement = 'completed' | 'openPr' | null

/** How long ago a session's activity counts as recent, and when an open PR's session is old. */
export type FocusWindows = { recentMs: number; openPrAgeMs: number }

function hasOpenPr(listed: ListedSession): boolean {
  return listed.prNumber !== undefined && listed.prState !== 'MERGED' && listed.prState !== 'CLOSED'
}

/**
 * Where focus mode files a session: one whose PR is still open and that has
 * been quiet past `openPrAgeMs` goes to Open PRs, out of the app's Ready for
 * review; one that went quiet within `recentMs` goes to Recently completed.
 * A running one, a pinned one (moving it into a section would unpin it), an
 * archived one or any other stays where the app's state grouping shows it.
 *
 * @example placementOf(row, Date.now(), { recentMs: DAY, openPrAgeMs: 3 * DAY }) // 'completed'
 */
export function placementOf(listed: ListedSession, now: number, windows: FocusWindows): Placement {
  if (listed.isArchived === true || listed.pinned === true || listed.isRunning === true) return null
  const at = Date.parse(listed.lastActivityAt ?? '')
  if (Number.isNaN(at)) return null
  if (hasOpenPr(listed) && now - at > windows.openPrAgeMs) return 'openPr'
  return now - at <= windows.recentMs ? 'completed' : null
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
