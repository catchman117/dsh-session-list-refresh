# dsh-session-list-refresh

一个极小的 DeepSeek Harness（DSH）前端插件：在侧边栏底部添加一个**刷新**操作，重新拉取会话目录，让「由另一个进程创建的会话」——尤其是 DSH headless 自动任务——立刻显示出来，无需刷新页面。

[English](README.md) | [繁體中文](README.zh-TW.md)

---

## 为什么需要

DSH 对同一个 `DSH_HOME` 下的所有进程共用一份会话存储。headless 自动任务（`dsh --profile headless …`）会把会话写进去；如果该任务收尾时做了工作区归属登记，归属也是正确的。但**浏览器只在建立连接时拉取会话目录**（`session.list` 在连接／重连时拉一次，之后只接收 GUI 自己创建的会话）。

所以当自动任务在 GUI 打开期间跑完时：

- 会话已经在磁盘上，
- 它的工作区归属可能也已正确，
- 但侧边栏仍然没有它的行——因为前端没有这个 session id 的 summary。

目前只能靠刷新页面、WebSocket 重连或重启 DSH 才能看到。本插件补上「一键等价操作」，而且不会丢掉你当前的画面、草稿或滚动位置。

## 你会得到

- 侧边栏底部（「设置」旁，`sidebar.footer.action`）一个刷新图标。
  - 侧边栏展开：图标 ＋「刷新」。
  - 侧边栏收起（56px 窄栏）：36×36 图标按钮。
- 点击 → 图标旋转 → 左下角短暂显示结果：
  - `已刷新：新增 2 个会话`
  - `已刷新：没有新会话`
  - `刷新失败：…`
- **零写入**：只调用前端已有的 `ctx.sessions.refresh()`，不动会话日志、工作区记录或配置。

## 环境要求

- DSH 0.2.x（桌面端或 Web）——在 Windows 桌面端 `0.2.1-rc.2` 上开发并验证。
- 无依赖、无网络请求、无需构建。

## 安装

### 桌面端

设置 → **插件** → 通过 `github:catchman117/dsh-session-list-refresh` 添加，或指向本地 checkout 的目录。

安装后请刷新页面一次（Ctrl+R / Cmd+R），让浏览器加载新的 client 模块。如果 Host 行没有热加载，重启 DSH 一次。

### 命令行 profile

```bash
dsh plugin --profile web add github:catchman117/dsh-session-list-refresh
```

刷新后若按钮仍未出现，重启对应的 Web runtime。

## 使用

点击侧边栏底部的刷新图标，列表会就地重新拉取：

- 会话出现在所属工作区分组——若没有任何归属记录，则落在 **未分组（Ungrouped）**；
- 提示文字／无障碍标签跟随当前语言（`en` / `zh`，DSH 内置中文为简体中文）；
- 重复点击成本很低且幂等（显示「没有新会话」）。

> 小提示：侧边栏底部太挤时，把侧边栏收成窄栏会看到 36×36 的紧凑版本。

## 工作方式

`client.js` 通过 `ctx.slots.inject` ＋ `ctx.slots.register`，把一个 React 组件注册进 root 作用域的 `sidebar.footer.action` 列表槽位。点击时调用 `ctx.sessions.refresh()`，它会重新发出 Host 的 `session.list` RPC，并重建前端的会话快照。

两个常见问题：

- **为什么不直接刷新页面？** 刷新页面确实也会重新拉取目录，但会丢掉 UI 状态（滚动位置、草稿、打开中的面板），而且慢得多。
- **为什么不一起刷新工作区？** 工作区归属由 Workspace Controller 的 `follow()` 流推送；只要变更发生在同一个 Host 进程内，就会实时更新。前端没有工作区刷新 API，这里也不需要。

本插件刻意**不做**的事：

- 不创建工作区归属。若会话的拥有者从未登记归属，它会出现在「未分组」。
- 不定时自动刷新。（未来版本可加 interval 或 focus/visibility 触发。）

## 限制

- `ctx.sessions.refresh()` 是 Client Session Controller 的方法，官方 UI（例如会话管理器）也在用，但它不在 live Service 检视目录中。未来 DSH 若改名，按钮会 fail-soft（显示错误提示），不会弄坏应用。
- 侧边栏会话列表的**标题栏**没有扩展点——Workspace browser 在该处刻意不提供 action surface。要把按钮放进标题栏只能整块 shadow，因此本插件使用底部位置。
- 只影响显示状态：不修改会话、工作区或配置数据。

## 开发

```bash
node --check index.js
node --check client.js
```

CI 会跑同样的语法与 manifest 校验（见 `.github/workflows/check.yml`）。

| 文件 | 用途 |
| --- | --- |
| `cordis.patch.yml` | Bundle patch：插入插件行。 |
| `index.js` | Host 半。导出空的 `apply()`——本插件不需要 Host 能力。 |
| `client.js` | 浏览器半：`window.__ModuleLoader__` factory、槽位注册、刷新动作。 |
| `locale/en.json`、`locale/zh.json` | 插件管理器显示用元数据。 |
| `icon.svg` | 插件图标。 |

## 许可证

[MIT](LICENSE)
