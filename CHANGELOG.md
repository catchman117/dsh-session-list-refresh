# Changelog

## 1.1.0 — 2026-10-21

- Localize the plugin's Chinese copy to **Simplified Chinese with Mainland terminology**:
  `刷新会话列表` / `刷新` / `正在刷新…` / `已刷新：新增 N 个会话` /
  `已刷新：没有新会话` / `刷新失败：…`.
  DSH ships a single built-in Chinese locale (`zh`) and it is Simplified, so the
  previous Traditional Chinese strings were inconsistent with the rest of the UI.
- Update the plugin display metadata (`locale/zh.json`) to Simplified Chinese.
- Add `README.zh-CN.md` (Simplified Chinese, Mainland terminology) and cross-link
  the three READMEs.

## 1.0.0 — 2026-10-21

- First public release.
- Sidebar-foot refresh action that re-pulls the DSH session catalog
  (`ctx.sessions.refresh()`), so sessions created by other processes
  (headless automation tasks) appear without reloading the page.
- Expanded (icon + label) and collapsed-rail (36×36 icon) presentations.
- English and Chinese display metadata, plugin icon, MIT license.
