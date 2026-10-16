import { expect, mock, test } from 'claude-code/testing'

const VIEW_TOOL = 'mcp__ccd_sidebar__set_view'
const LIST_TOOL = 'mcp__ccd_session_mgmt__list_sessions'
const PANE = {
  plugin: 'focus-mode',
  component: 'Pane',
  requestId: 'focus-mode',
  props: { title: 'Focus', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
const RUN = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const

const SESSIONS = [
  { sessionId: 'local_a', title: 'Ship the parser', cwd: '/w/app', isRunning: true, isArchived: false, lastActivityAt: '2026-10-16T21:00:00.000Z' },
  { sessionId: 'local_b', title: 'Old idea', cwd: '/w/notes', isRunning: false, isArchived: false, lastActivityAt: '2026-10-01T10:00:00.000Z' },
]

test('focus switches the sidebar to running-first, lists only running sessions, and restores the view', async ($, on) => {
  mock.clock(on, { now: Date.parse('2026-10-16T21:05:00.000Z') })
  mock.store(on)
  // This build's kit answers no ui calls: stand in for the surface.
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('ui.close', () => ({ value: undefined }) as never)
  on('ui.status', () => ({ value: undefined }) as never)
  on('ui.invalidate', () => ({ value: undefined }) as never)
  on('ui.toast', () => ({ value: undefined }) as never)
  let view = { group_by: 'project', status: 'active', sort_by: 'recency', last_activity: 0 }
  on('tool.call', { tool: VIEW_TOOL }, (_$, e) => {
    const { tool: _tool, tool_use_id: _id, ...asked } = e as unknown as Record<string, unknown>
    view = { ...view, ...asked }
    const text = JSON.stringify({ changed: 1, view })
    return { result: text, text } as never
  })
  on('tool.call', { tool: LIST_TOOL }, () => {
    const text = JSON.stringify(SESSIONS)
    return { result: text, text } as never
  })

  const turnedOn = await $.command.run({ ...RUN, command: 'focus', args: 'on' })
  expect(turnedOn.text).toContain('Focus mode on')
  expect(view.group_by).toBe('state')

  for (const surface of ['terminal', 'desktop'] as const) {
    const drawn = JSON.stringify(await $.ui.render({ ...PANE, surface } as never))
    expect(drawn).toContain('Ship the parser')
    expect(drawn).not.toContain('Old idea')
    expect(drawn).toContain('1 idle hidden')
  }

  const turnedOff = await $.command.run({ ...RUN, command: 'focus', args: 'off' })
  expect(turnedOff.text).toContain('Focus mode off')
  expect(view.group_by).toBe('project')
})
