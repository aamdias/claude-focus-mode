# focus-mode

A Claude Code mod for the Claude desktop app. It adds a focus mode so your running sessions don't get lost under long lists of folders in the sidebar.

- **Toggle:** a row above the prompt with a **Focus** button. `/focus-mode`, `/focus-mode on` and `/focus-mode off` do the same (Claude Code has its own built-in `/focus`).
- **Sidebar:** turning focus on switches the session list to the app's own state grouping (**Running**, **Needs input**, **Completed**), which the app keeps live, and files sessions that finished in the last day into a **Recently completed** section above it. Turning focus off puts those sessions back in the groups they came from, removes the section and brings your folders back.
- **Fresh titles:** while focus is on, each running session gets a new title written from its last few messages, so the sidebar says what it's doing now rather than how it started. It's redone at most every 15 minutes per session, after new activity, with one small Haiku call each. The new titles stay after you exit; **Restore titles** next to the toggle puts the originals back.

## Screenshots

**Focus off**: the sidebar as you normally have it.

![Focus mode off](docs/focus-off.png)

**Focus on**: Recently completed on top, then Running, Needs input and Completed, and the toggle above the prompt.

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
- It reads your 50 most recent sessions (30 if the app refuses 50) to fill Recently completed.
- The app doesn't tell mods which sessions need your input, so Needs input is the app's own section. A session that finished its turn waiting on you may land in Recently completed instead.
- The app gives mods no way to reorder, hide or rename its own sections.
- Pinned sessions stay where they are: moving one into a section would unpin it.
- One open session drives the moves and renames at a time; another takes over if that one closes.
- If you set a session's title yourself, the app asks you to approve each rename. Moving sessions can ask too, depending on the session's permission mode.
- The session focus runs in is filed like the others but never retitled: the app won't let a session read its own transcript that way.
- A session that starts running again moves from Recently completed back to Running within about 10 seconds.
