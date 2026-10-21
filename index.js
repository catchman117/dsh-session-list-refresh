/**
 * Host half of dsh-session-list-refresh.
 *
 * This bundle needs no Host capability: the refresh action runs entirely in
 * the browser against the already-composed Client services
 * (`ctx.sessions.refresh()` re-pulls the Host Session catalog). The Client
 * half in client.js owns the button.
 */
export function apply() {}
