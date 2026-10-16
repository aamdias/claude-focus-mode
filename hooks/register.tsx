import type { Hook, Register } from 'claude-code'

type Api = Parameters<Hook<'session.start'>>[0]
type Timer = { cancel: () => void }

/** A Code-tab session that is running right now, as the pane lists it. */
type RunningSession = {
  id: string
  title: string
  /** Last segment of the session's working directory. */
  folder: string
  branch: string | null
  /** ISO timestamp of the session's last activity. */
  lastActivityAt: string
}

/** The Code-tab sidebar's view settings, as `mcp__ccd_sidebar__set_view` reports them. */
type SidebarView = {
  group_by: string
  status: string
  sort_by: string
  last_activity: number
}

/** One row of `mcp__ccd_session_mgmt__list_sessions`; only the fields read here. */
type ListedSession = {
  sessionId: string
  title?: string
  cwd?: string
  branch?: string
  isArchived?: boolean
  isRunning?: boolean
  lastActivityAt?: string
}

const PANE = 'focus-mode'
const PANE_TITLE = 'Focus · running now'
const POLL_MS = 10_000
// The app caps a tool answer's size: 100 sessions (~51k chars) came back as
// a "saved to a file" error. The list is newest first, so running ones lead.
const LIST_LIMIT = 30
const LIST_TOOL = 'mcp__ccd_session_mgmt__list_sessions'
const VIEW_TOOL = 'mcp__ccd_sidebar__set_view'
// Running sessions float to the top under "state" grouping; one day of
// activity keeps last week's idle folders out of sight.
const FOCUS_VIEW = { group_by: 'state', status: 'active', sort_by: 'recency' }
const FOCUS_RECENCY_DAYS = 1
// $.store keys, kept across sessions so focus survives a restart and the
// person's own sidebar view comes back when focus ends.
const STORE_IS_ON = 'isOn'
const STORE_PREVIOUS_VIEW = 'previousView'

// What the band and pane draw. Module variables start over on every reload;
// session.start re-reads $.store and restarts the poll when focus was on.
// ($.state would survive a reload, but this build's test kit has no $.state.)
let isOn = false
let running: RunningSession[] = []
let idleCount = 0
let checkedAt: number | null = null
let problem: string | null = null
let poll: Timer | undefined

/**
 * Calls one of the desktop app's tools and parses its JSON answer.
 * Throws with the tool's name and its error text when the app refuses or the
 * answer is not JSON (the app's tools exist only inside the desktop app).
 *
 * @example const listed = await callAppTool($, LIST_TOOL, { limit: LIST_LIMIT })
 */
async function callAppTool($: Api, tool: string, input: Record<string, unknown>): Promise<unknown> {
  const answer = await $.tool.call({ tool, ...input } as Parameters<Api['tool']['call']>[0])
  if (answer.deny !== undefined || answer.isError === true) {
    throw new Error(`${tool} failed: ${answer.deny ?? answer.text ?? 'no error text'}`)
  }
  try {
    return JSON.parse(answer.text ?? '')
  } catch {
    throw new Error(`${tool} answered non-JSON, expected an object: ${(answer.text ?? '').slice(0, 120)}`)
  }
}

/** Applies sidebar settings; retries without `last_activity`, which the sections layout refuses. */
async function setSidebarView($: Api, view: Partial<SidebarView>): Promise<SidebarView> {
  try {
    const answer = (await callAppTool($, VIEW_TOOL, view)) as { view: SidebarView }
    return answer.view
  } catch (error) {
    if (view.last_activity === undefined) throw error
    const { last_activity: _refused, ...rest } = view
    const answer = (await callAppTool($, VIEW_TOOL, rest)) as { view: SidebarView }
    return answer.view
  }
}

function lastSegment(path: string | undefined): string {
  if (path === undefined) return ''
  return path.split('/').filter(Boolean).pop() ?? path
}

function toRunning(listed: ListedSession): RunningSession {
  return {
    id: listed.sessionId,
    title: listed.title ?? 'Untitled session',
    folder: lastSegment(listed.cwd),
    branch: listed.branch ?? null,
    lastActivityAt: listed.lastActivityAt ?? '',
  }
}

function ago(at: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000))
  if (Number.isNaN(seconds)) return ''
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  return `${Math.round(seconds / 3600)}h ago`
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function refresh($: Api): Promise<void> {
  try {
    const listed = (await callAppTool($, LIST_TOOL, { limit: LIST_LIMIT })) as ListedSession[]
    const live = listed.filter(one => one.isRunning === true && one.isArchived !== true)
    running = live.map(toRunning)
    idleCount = listed.length - live.length
    checkedAt = await $.clock.now()
    problem = null
    $.ui.status(`Focus · ${live.length} running`)
  } catch (error) {
    problem = describeError(error)
  }
  $.ui.invalidate('ui.render')
}

async function startFocus($: Api): Promise<void> {
  isOn = true
  void $.ui.open({ id: PANE, title: PANE_TITLE })
  poll?.cancel()
  poll = $.clock.every(POLL_MS, () => void refresh($))
  await refresh($)
}

async function turnOn($: Api): Promise<string> {
  if (isOn) return 'Focus mode is already on.'
  // set_view has no read: re-applying "active" (the default) answers the
  // current settings, saved so turning focus off restores them.
  const before = await setSidebarView($, { status: 'active' })
  await $.store.set(STORE_PREVIOUS_VIEW, before)
  await setSidebarView($, { ...FOCUS_VIEW, last_activity: FOCUS_RECENCY_DAYS })
  await $.store.set(STORE_IS_ON, true)
  await startFocus($)
  return 'Focus mode on: the sidebar lists running sessions first.'
}

async function turnOff($: Api): Promise<string> {
  poll?.cancel()
  poll = undefined
  const previous = (await $.store.get(STORE_PREVIOUS_VIEW)) as SidebarView | undefined
  if (previous !== undefined) await setSidebarView($, previous)
  await $.store.delete(STORE_PREVIOUS_VIEW)
  await $.store.set(STORE_IS_ON, false)
  isOn = false
  $.ui.status(undefined)
  $.ui.invalidate('ui.render')
  await $.ui.close({ id: PANE })
  return 'Focus mode off: your sidebar view is back.'
}

async function toggle($: Api): Promise<string> {
  try {
    return isOn ? await turnOff($) : await turnOn($)
  } catch (error) {
    problem = describeError(error)
    $.ui.invalidate('ui.render')
    $.ui.toast(`Focus mode: ${problem}`)
    return `Focus mode could not switch: ${problem}`
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'focus',
      description: 'Toggle focus mode: running sessions first, everything else out of the way',
      argumentHint: '[on|off]',
    })
    if ((await $.store.get(STORE_IS_ON)) === true) await startFocus($)

    return next(e)
  })

  on('command.run', { command: 'focus' }, async ($, e) => {
    const wanted = e.args.trim().toLowerCase()
    if ((wanted === 'on' && isOn) || (wanted === 'off' && !isOn)) {
      return { text: `Focus mode is already ${wanted}.` }
    }
    return { text: await toggle($) }
  })

  // The floating toggle: one row above the prompt, in every session the mod loads in.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>{isOn ? `Focus · ${running.length} running ` : 'Focus mode off '}</Text>
        {isOn && (
          <Button key="show" label="Show running" dimColor onPress={() => void $.ui.open({ id: PANE, title: PANE_TITLE })} />
        )}
        <Button key="toggle" label={isOn ? 'Exit focus' : 'Focus'} onPress={() => void toggle($)} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const checked = checkedAt === null ? '' : ` · checked ${ago(checkedAt, now)}`

    return (
      <Box flexDirection="column">
        <Text bold>Running now ({running.length})</Text>
        {checkedAt === null && problem === null && <Text dimColor>Checking sessions…</Text>}
        {checkedAt !== null && running.length === 0 && <Text dimColor>Nothing else is running right now.</Text>}
        {running.map(one => (
          <Box key={one.id} flexDirection="column" marginTop={1}>
            <Text bold>{one.title}</Text>
            <Text dimColor>
              {[one.folder, one.branch, ago(Date.parse(one.lastActivityAt), now)].filter(Boolean).join(' · ')}
            </Text>
          </Box>
        ))}
        {problem !== null && (
          <Box marginTop={1}>
            <Text color="red">{problem}</Text>
          </Box>
        )}
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>{`${idleCount} idle hidden (of the ${LIST_LIMIT} most recent) · this session not counted${checked}`}</Text>
          <Text dimColor>Open one from the sidebar's running group.</Text>
        </Box>
        <Box marginTop={1}>
          <Button key="refresh" label="Refresh" dimColor onPress={() => void refresh($)} />
          <Text> </Text>
          <Button key="exit" label="Exit focus" onPress={() => void toggle($)} />
        </Box>
      </Box>
    )
  })
}
