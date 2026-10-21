# dsh-session-list-refresh

A tiny DeepSeek Harness (DSH) client plugin that adds a **refresh** action to the sidebar foot. It re-pulls the session catalog so sessions created by another process — most notably DSH headless automation tasks — show up immediately, without reloading the page.

[繁體中文](README.zh-TW.md)

---

## Why

DSH keeps one shared session store for every process using the same `DSH_HOME`. A headless automation run (`dsh --profile headless …`) writes its session there, and the running GUI can even own the workspace membership write — but the **browser only fetches the session catalog when the connection is established** (`session.list` on connect/reconnect, plus live additions for sessions the GUI itself creates).

So when an automation task finishes while the GUI is open:

- the session exists on disk,
- its workspace membership may already be correct,
- and the sidebar still shows no row for it, because the client has no summary for that session id.

Today the only ways to see it are a page reload, a WebSocket reconnect, or restarting DSH. This plugin adds the missing one-click equivalent — without losing your view, drafts, or scroll position.

## What you get

- A refresh icon in the sidebar foot (`sidebar.footer.action`, beside Settings).
  - Expanded sidebar: icon + “Refresh”.
  - Collapsed 56 px rail: a 36×36 icon button.
- Click → the icon spins → a short result notice appears at the lower left:
  - `Refreshed: 2 new session(s)`
  - `Refreshed: no new sessions`
  - `Refresh failed: …`
- **Zero writes.** The action only calls the client’s existing `ctx.sessions.refresh()`; it does not touch session logs, workspace records, or configuration.

## Requirements

- DSH 0.2.x (Desktop or Web) — developed and tested against `0.2.1-rc.2` Desktop on Windows.
- No dependencies, no network calls, no build step.

## Install

### Desktop

Settings → **Plugins** → add the bundle from `github:catchman117/dsh-session-list-refresh`, or point it at a local checkout of this repository.

After install, reload the page once (Ctrl+R / Cmd+R) so the browser loads the new client module. If the Host row did not hot-load, restart DSH once.

### CLI profile

```bash
dsh plugin --profile web add github:catchman117/dsh-session-list-refresh
```

Then restart the Web runtime if the button does not appear after a reload.

## Usage

Click the refresh icon at the bottom of the sidebar. The list is re-fetched in place:

- sessions appear under their workspace group — or under **Ungrouped** when no workspace membership has been recorded for them;
- the tooltip / accessible label follows the active locale (`en` / `zh`);
- repeated clicks are cheap and idempotent (“no new sessions”).

> Tip: if the sidebar footer is crowded, the compact 36×36 variant appears when the sidebar is collapsed to its rail.

## How it works

`client.js` registers a React component into the root-scoped `sidebar.footer.action` list slot through `ctx.slots.inject` + `ctx.slots.register`. On click it calls `ctx.sessions.refresh()`, which re-issues the Host `session.list` RPC and rebuilds the client-side session snapshot.

Two nearby questions, answered:

- **Why not just reload the page?** A reload does the same catalog fetch but throws away UI state (scroll position, drafts, open panels) and takes far longer.
- **Why not refresh the workspace too?** Workspace membership is pushed by the Workspace Controller’s `follow()` stream and updates live whenever the change happens inside the same Host process. There is no client-side workspace refresh, and none is needed here.

Gaps this plugin deliberately does **not** fill:

- It does not create workspace membership. A session whose owner never registered one will appear under “Ungrouped”.
- It does not run on a timer. If you want automatic refresh, a future version could add an interval or a focus/visibility trigger.

## Limitations

- `ctx.sessions.refresh()` is a Client Session Controller method used by shipped UI (e.g. the session manager), but it is not part of the live Service inspection catalog. A future DSH release could rename it; the button fails soft (an error notice) instead of breaking the app.
- The sidebar’s session-list **header** has no extension point — the Workspace browser exposes no action surface there. Adding a button inside the header would mean shadowing the whole browser, so this plugin uses the footer seat instead.
- Display state only: no session, workspace, or configuration data is modified.

## Development

```bash
node --check index.js
node --check client.js
```

CI runs the same syntax and manifest checks (see `.github/workflows/check.yml`).

| File | Purpose |
| --- | --- |
| `cordis.patch.yml` | Bundle patch: inserts the plugin row. |
| `index.js` | Host half. Exports an empty `apply()` — this plugin needs no Host capability. |
| `client.js` | Browser half: `window.__ModuleLoader__` factory, slot registration, and the refresh action. |
| `locale/en.json`, `locale/zh.json` | Plugin Manager display metadata. |
| `icon.svg` | Plugin icon. |

## License

[MIT](LICENSE)
