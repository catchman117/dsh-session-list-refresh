# dsh-session-list-refresh

一個極小的 DeepSeek Harness（DSH）前端插件：在側欄底部加一個**重新整理**動作，重新抓取會話目錄，讓「由另一個進程建立的會話」——尤其是 DSH headless 自動任務——立即出現，不必重新載入頁面。

[English](README.md) | [简体中文](README.zh-CN.md)

---

## 為什麼需要

DSH 對同一個 `DSH_HOME` 下的所有進程共用一份會話儲存。headless 自動任務（`dsh --profile headless …`）會把會話寫進去；若該任務收尾時有做工作區歸屬登記，歸屬也會是正確的。但**瀏覽器只在連線建立時抓取會話目錄**（`session.list` 於連線／重連時抓一次，之後只接收 GUI 自己建立的會話）。

所以當自動任務在 GUI 開著時跑完：

- 會話已經在磁碟上，
- 它的工作區歸屬可能也已正確，
- 但側欄仍然沒有它的列——因為前端沒有這個 session id 的 summary。

目前只能靠重新載入頁面、WebSocket 重連或重啟 DSH 才看得到。本插件補上「一鍵等價操作」，而且不會丟掉你目前的畫面、草稿或捲動位置。

## 你會得到

- 側欄底部（Settings 旁，`sidebar.footer.action`）一個刷新圖示。
  - 側欄展開：圖示 ＋「刷新」。
  - 側欄收合（56px rail）：36×36 圖示按鈕。
- 點擊 → 圖示旋轉 → 左下角短暫顯示結果：
  - `已刷新：新增 2 个会话`
  - `已刷新：没有新会话`
  - `刷新失败：…`
- **零寫入**：只呼叫前端既有的 `ctx.sessions.refresh()`，不動會話日誌、工作區紀錄或設定。

> 介面文字跟隨 DSH 內建語系（`en` / `zh`）。DSH 內建的 `zh` 是**簡體中文、採大陸用語**，所以上方引號內是實際顯示字串；本插件不另外提供繁體中文介面。

## 需求

- DSH 0.2.x（Desktop 或 Web）——於 Windows 的 `0.2.1-rc.2` Desktop 開發與驗證。
- 無依賴、無網路請求、無建置步驟。

## 安裝

### Desktop

設定 → **插件** → 以 `github:catchman117/dsh-session-list-refresh` 加入，或指向本機 checkout 的目錄。

安裝後請重新載入頁面一次（Ctrl+R / Cmd+R），讓瀏覽器載入新的 client 模組。若 Host 行沒有熱載入，重啟 DSH 一次。

### CLI profile

```bash
dsh plugin --profile web add github:catchman117/dsh-session-list-refresh
```

重新載入後若按鈕仍未出現，重啟對應的 Web runtime。

## 使用

點側欄底部的刷新圖示，清單會就地重抓：

- 會話出現在所屬工作區分組——若沒有任何歸屬紀錄，則落在 **未分組（Ungrouped）**；
- 提示文字／無障礙標籤跟隨目前語系（`en` / `zh`；`zh` 為簡體中文、採大陸用語，見上方註記）；
- 重複點擊成本低且冪等（顯示「沒有新會話」）。

> 小提示：側欄底部太擠時，把側欄收合成 rail 會看到 36×36 的緊湊版本。

## 運作方式

`client.js` 透過 `ctx.slots.inject` ＋ `ctx.slots.register`，把一個 React 元件註冊進 root 範圍的 `sidebar.footer.action` 清單槽。點擊時呼叫 `ctx.sessions.refresh()`，它會重新發出 Host 的 `session.list` RPC，並重建前端的會話快照。

兩個常見問題：

- **為什麼不直接重新載入頁面？** 重新載入確實也會重抓目錄，但會丟掉 UI 狀態（捲動位置、草稿、開啟中的面板），而且慢得多。
- **為什麼不一起刷新工作區？** 工作區歸屬由 Workspace Controller 的 `follow()` 串流推送；只要變更發生在同一個 Host 進程內，就會即時更新。前端沒有工作區刷新 API，這裡也不需要。

本插件刻意**不做**的事：

- 不建立工作區歸屬。若會話的擁有者從未登記歸屬，它會出現在「未分組」。
- 不定時自動刷新。（未來版本可加 interval 或 focus/visibility 觸發。）

## 限制

- `ctx.sessions.refresh()` 是 Client Session Controller 的方法，出貨 UI（例如會話管理器）也在用，但它不在 live Service 檢視目錄中。未來 DSH 若改名，按鈕會 fail-soft（顯示錯誤提示），不會弄壞應用。
- 側欄會話清單的**標題列**沒有擴充點——Workspace browser 在該處刻意不提供 action surface。要把按鈕放進標題列只能整塊 shadow，因此本插件使用底部位置。
- 只影響顯示狀態：不修改會話、工作區或設定資料。

## 開發

```bash
node --check index.js
node --check client.js
```

CI 會跑同樣的語法與 manifest 檢查（見 `.github/workflows/check.yml`）。

| 檔案 | 用途 |
| --- | --- |
| `cordis.patch.yml` | Bundle patch：插入插件列。 |
| `index.js` | Host 半。匯出空的 `apply()`——本插件不需要 Host 能力。 |
| `client.js` | 瀏覽器半：`window.__ModuleLoader__` factory、槽註冊、刷新動作。 |
| `locale/en.json`、`locale/zh.json` | 插件管理員顯示用 metadata。 |
| `icon.svg` | 插件圖示。 |

## 授權

[MIT](LICENSE)
