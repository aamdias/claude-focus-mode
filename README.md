# focus-mode

A Claude Code mod for the Claude desktop app. It adds a focus mode so your running sessions don't get lost under long lists of folders in the sidebar.

- **Toggle:** a row above the prompt with a **Focus** button. `/focus-mode`, `/focus-mode on` and `/focus-mode off` do the same (Claude Code has its own built-in `/focus`).
- **Sidebar sections:** turning focus on files running sessions under **Running**, sessions that finished in the last day under **Recently completed**, and your other recent sessions under **Other sessions**. Collapse Other sessions once and only the first two stay open while you focus. Turning focus off puts every session back in the group it came from and removes Running and Recently completed. Other sessions stays, empty, so it keeps your collapse for next time.
- **Fresh titles:** while focus is on, each running session gets a new title written from its last few messages, so the sidebar says what it's doing now rather than how it started. It's redone at most every 15 minutes per session, after new activity, with one small Haiku call each. The new titles stay after you exit; **Restore titles** next to the toggle puts the originals back.

## Screenshots

**Focus off**: the sidebar as you normally have it.

![Focus mode off](docs/focus-off.png)

**Focus on**: Running and Recently completed at the top, Other sessions collapsed, and the toggle above the prompt.

![Focus mode on](docs/focus-on.png)

## Install

From a shell:

```bash
claude plugin marketplace add aamdias/claude-focus-mode
```

```bash
claude plugin install focus-mode@alan-mods
```

At the prompt of a terminal session, the same two steps are `/plugin marketplace add aamdias/claude-focus-mode` and `/plugin install focus-mode@alan-mods`.

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `aamdias/claude-focus-mode`, then Add plugin.

New sessions load it after the install. In a session that is already open, run `/reload-plugins`.

## Requirements and limits

- It needs the Claude desktop app's Code tab. It reads sessions and changes the sidebar through the app's own tools (`mcp__ccd_session_mgmt__*` and `mcp__ccd_sidebar__*`). In a plain terminal session the toggle shows an error instead.
- In auto mode, the app's classifier refuses changes nobody asked for in the chat, so it blocks focus mode's background moves and renames. Allow these in your user settings (`permissions.allow` in `~/.claude/settings.json`): `mcp__ccd_session_mgmt__list_sessions`, `mcp__ccd_session_mgmt__get_session`, `mcp__ccd_session_mgmt__list_events`, `mcp__ccd_session_mgmt__set_session_title`, `mcp__ccd_sidebar__set_view`, `mcp__ccd_sidebar__list_groups`, `mcp__ccd_sidebar__create_group`, `mcp__ccd_sidebar__delete_group`, `mcp__ccd_sidebar__move_sessions`.
- It lists Code-tab sessions only, not Cowork sessions.
- It reads your 50 most recent sessions (30 if the app refuses 50). Older ones stay under the app's own Sessions list.
- The app gives mods no way to hide or collapse a section, or to tell which sessions need your input. Sessions waiting on you show in Running with the app's own dot.
- Pinned sessions stay where they are: moving one into a section would unpin it.
- One open session drives the moves and renames at a time; another takes over if that one closes.
- If you set a session's title yourself, the app asks you to approve each rename. Moving sessions can ask too, depending on the session's permission mode.
- The session focus runs in is filed like the others but never retitled: the app won't let a session read its own transcript that way.
