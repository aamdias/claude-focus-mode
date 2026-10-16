# focus-mode

A Claude Code mod for the Claude desktop app. It adds a focus mode so your running sessions don't get lost under long lists of folders in the sidebar.

- **Toggle:** a row above the prompt with a **Focus** button. `/focus`, `/focus on` and `/focus off` do the same.
- **Sidebar:** turning focus on switches the Code-tab sidebar to grouping by state with the newest first, so running sessions sit at the top. Sessions idle for more than a day are hidden. Turning it off restores the view you had before.
- **Running list:** a pane titled "Focus · running now" lists only the Code sessions that are running right now. It refreshes every 10 seconds.

## Install

At the prompt of a terminal session:

```
/plugin install focus-mode --marketplace aamdias/claude-focus-mode
```

From a shell:

```bash
claude plugin install focus-mode --marketplace aamdias/claude-focus-mode
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `aamdias/claude-focus-mode`, then Add plugin.

## Requirements and limits

- It needs the Claude desktop app's Code tab. It reads sessions and changes the sidebar through the app's own tools (`mcp__ccd_session_mgmt__list_sessions`, `mcp__ccd_sidebar__set_view`). In a plain terminal session the toggle shows an error instead.
- It lists Code-tab sessions only, not Cowork sessions.
- It reads the 30 most recent sessions. Running sessions sort first, so those are the ones it shows.
- The session you are in isn't listed: the app's session list leaves it out.
- The pane can't open other sessions. Open them from the sidebar, where focus mode puts the running ones at the top.
