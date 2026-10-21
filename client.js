/**
 * dsh-session-list-refresh — Client half.
 *
 * Adds one refresh action to the sidebar foot (`sidebar.footer.action`).
 * Clicking it calls the Client Session service's `refresh()`, which re-pulls
 * the Host Session catalog (`session.list`) and rebuilds the list snapshot.
 *
 * Why it exists: a Session created by another process (a headless automation
 * task, `dsh --profile headless ...`) is written to the shared session store,
 * but the browser only fetches the catalog when the connection is established
 * or replaced. Workspace membership for such a Session is written in-process
 * through the GUI's own routes, so only the catalog is stale.
 */
window.__ModuleLoader__.load({
  id: 'dsh-session-list-refresh',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef } = React;

    const NS = 'sessionListRefresh';

    const en = {
      aria: 'Refresh session list',
      label: 'Refresh',
      busy: 'Refreshing…',
      added: 'Refreshed: {count} new session(s)',
      none: 'Refreshed: no new sessions',
      failed: 'Refresh failed: {message}',
    };
    const zh = {
      aria: '重新整理會話列表',
      label: '重新整理',
      busy: '正在重新整理…',
      added: '已重新整理：新增 {count} 筆會話',
      none: '已重新整理：沒有新會話',
      failed: '重新整理失敗：{message}',
    };

    const CSS = [
      '.dsl-refresh-btn{display:inline-flex;flex:none;align-self:center;align-items:center;justify-content:center;gap:8px;min-height:28px;padding:3px 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer;font-family:inherit}',
      '.dsl-refresh-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsl-refresh-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsl-refresh-btn:disabled{cursor:default;opacity:.6}',
      '.dsl-refresh-btn--wide{height:34px;padding:6px 10px;border-radius:12px;font-size:14px;line-height:22px}',
      '.dsl-refresh-btn--rail{width:36px;height:36px;padding:0;border-radius:12px}',
      '.dsl-refresh-btn svg{flex:none;display:block}',
      '.dsl-refresh-btn--busy svg{animation:dsl-refresh-spin 1s linear infinite;transform-origin:50% 50%}',
      '@keyframes dsl-refresh-spin{to{transform:rotate(360deg)}}',
      '.dsl-refresh-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:100%}',
      '.dsl-refresh-notice{position:fixed;left:12px;bottom:96px;z-index:60;max-width:300px;padding:7px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 6px 20px rgba(0,0,0,.18);font-size:12px;line-height:18px}',
      '.dsl-refresh-notice--error{color:var(--dsw-alias-state-error-primary)}',
    ].join('\n');

    /** Original refresh glyph: an open circular arrow with a chevron head. */
    function RefreshGlyph(props) {
      const size = props.size || 16;
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      },
        h('path', { d: 'M12.8 5.4A5.1 5.1 0 1 0 13 9.1' }),
        h('path', { d: 'M13.2 2.5 12.8 5.4 9.9 5.2' }),
      );
    }

    /** Fallback for the registration inject face; set by apply() below. */
    let sessionRefreshImpl = null;

    function RefreshButton(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const refreshSessions = typeof props.refreshSessions === 'function'
        ? props.refreshSessions
        : sessionRefreshImpl;
      const wide = props.wide === true;
      const [busy, setBusy] = useState(false);
      const [notice, setNotice] = useState(null);
      const timer = useRef(0);

      useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
      }, []);

      const show = (text, isError) => {
        setNotice({ text, isError: isError === true });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setNotice(null), 5000);
      };

      const onClick = async () => {
        if (busy) return;
        setBusy(true);
        try {
          if (typeof refreshSessions !== 'function') {
            throw new Error('session refresh is unavailable in this build');
          }
          const result = await refreshSessions();
          const added = result && typeof result.added === 'number' ? result.added : 0;
          show(added > 0 ? t('added', { count: added }) : t('none'));
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          show(t('failed', { message }), true);
        } finally {
          setBusy(false);
        }
      };

      const className = 'dsl-refresh-btn'
        + (wide ? ' dsl-refresh-btn--wide' : ' dsl-refresh-btn--rail')
        + (busy ? ' dsl-refresh-btn--busy' : '');

      return h(React.Fragment, null,
        h('style', { key: 'dsl-refresh-css' }, CSS),
        h('button', {
          key: 'dsl-refresh-button',
          type: 'button',
          className,
          title: busy ? t('busy') : t('aria'),
          'aria-label': t('aria'),
          'aria-busy': busy ? 'true' : undefined,
          disabled: busy,
          onClick,
        },
          h(RefreshGlyph, { size: wide ? 16 : 18 }),
          wide ? h('span', { className: 'dsl-refresh-label' }, busy ? t('busy') : t('label')) : null,
        ),
        notice
          ? h('span', {
            key: 'dsl-refresh-notice',
            className: 'dsl-refresh-notice' + (notice.isError ? ' dsl-refresh-notice--error' : ''),
            role: 'status',
          }, notice.text)
          : null,
      );
    }

    return {
      inject: ['slots', 'locale', 'sessions'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'session-list-refresh: dictionaries');

        const catalogIds = () => {
          const snapshot = ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.getSnapshot === 'function'
            ? ctx.sessions.list.getSnapshot()
            : undefined;
          return new Set(snapshot && Array.isArray(snapshot.ids) ? snapshot.ids : []);
        };

        const refreshSessions = async () => {
          const before = catalogIds();
          await ctx.sessions.refresh();
          const after = catalogIds();
          let added = 0;
          for (const id of after) {
            if (!before.has(id)) added += 1;
          }
          return { added, total: after.size };
        };

        sessionRefreshImpl = refreshSessions;

        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'session-list-refresh',
          order: 40,
          locale: NS,
          inject: () => ({ refreshSessions }),
        }, RefreshButton));
      },
    };
  },
});
