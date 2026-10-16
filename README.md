# focus-mode

A Claude Code mod for the Claude desktop app. It adds a focus mode so your running sessions don't get lost under long lists of folders in the sidebar.

- **Toggle:** a row above the prompt with a **Focus** button. `/focus`, `/focus on` and `/focus off` do the same.
- **Sidebar sections:** turning focus on files running sessions under a **Running** section and sessions that finished in the last day under **Recently completed**, both above your other sessions. Turning it off puts every session back in the group it came from and removes the two sections.
- **Fresh titles:** while focus is on, each running session gets a new title written from its last few messages, so the sidebar says what it's doing now rather than how it started. It's redone at most every 15 minutes per session, after new activity, with one small Haiku call each. The new titles stay after you exit; **Restore titles** in the pane puts the originals back.
- **Running list:** a pane titled "Focus · running now" lists only the Code sessions that are running right now. It refreshes every 10 seconds.

## Screenshots

**Focus off**: the sidebar as you normally have it.

![Focus mode off](docs/focus-off.png)

**Focus on**: Running and Recently completed at the top, the toggle above the prompt, and the running list pane.

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

- It needs the Claude desktop app's Code tab. It reads sessions and changes the sidebar through the app's own tools (`mcp__ccd_session_mgmt__list_sessions`, `mcp__ccd_sidebar__set_view`). In a plain terminal session the toggle shows an error instead.
- It lists Code-tab sessions only, not Cowork sessions.
- It reads the 30 most recent sessions. Running sessions sort first, so those are the ones it shows.
- Pinned sessions stay where they are: moving one into a section would unpin it.
- One open session drives the moves and renames at a time; another takes over if that one closes.
- If you set a session's title yourself, the app asks you to approve each rename. Moving sessions can ask too, depending on the session's permission mode.
- The session you turned focus on from isn't moved or retitled: the app's session list leaves it out.
- The pane can't open other sessions. Open them from the sidebar's Running section.
