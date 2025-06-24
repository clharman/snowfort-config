# Snowfort Config — Full Specification

---

## 1 · Purpose & Scope

A lightweight, cross‑platform utility that **reads, displays and safely edits** local configuration & usage metadata for generative‑AI CLIs.

* **Supported engines v0.0.1**

  * **Claude Code CLI** – `~/.claude.json`
  * **OpenAI Codex CLI** – `~/.codex/config.json` (JSON)
* **Planned v0.1** – GitHub Copilot CLI (`~/.config/gh-copilot/config.yml`)

Two interchangeable UIs ship from day 1:

| Command        | What starts                                                       | Target user                       |
| -------------- | ----------------------------------------------------------------- | --------------------------------- |
| `sfconfig tui` | Ink‑based terminal UI                                             | Power users living in a shell/SSH |
| `sfconfig web` | Starts same service on `localhost:4040` and opens default browser | Users who prefer point‑and‑click  |

Both UIs consume a single **head‑less service daemon** (the *core*).

---

## 2 · Goals & Non‑Goals

| Goals                                                    | Non‑Goals (v0 line)                                      |
| -------------------------------------------------------- | -------------------------------------------------------- |
| One‑command install & launch (npm or Homebrew).          | Cloud‑hosted version (future).                           |
| Zero **new** telemetry; optional update check.           | Editing of log/usage JSONL files (future chart feature). |
| Safe edits with schema validation + timestamped backups. | Windows native path handling (WSL expected to suffice).  |
| Extensible adapters for new engines.                     | Enterprise SSO, network encryption (local‑only).         |

---

## 3 · Feature Matrix (v0.0.1)

| Area                  | Capability                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Global dashboard**  | First run date, # launches, plan tier, last changelog seen, update status.                                    |
| **Toggle flags**      | Check‑box list for booleans (e.g. `verbose`, `bypassPermissionsModeAccepted`).                                |
| **Tips & onboarding** | View coach‑mark counts (`tipsHistory`) and *Reset*; toggle "Completed onboarding".                            |
| **Per‑project view**  | Table per path: last run date, cost \$, duration, allowed tools, MCP servers, history inspector, purge stale. |
| **Raw editor**        | `[E]dit raw` opens `$EDITOR`, diff on save, validation errors surfaced.                                       |
| **Backup & undo**     | Timestamped `.bak` files; restore menu.                                                                       |
| **Update notice**     | Uses `update-notifier`; banner in both UIs.                                                                   |
| **CLI flags**         | `--config <path>`, `--no-update-check`.                                                                       |

---

## 4 · Architecture

```text
            ┌─────────────────────────┐
            │  TUI (Ink / Node)       │  ← sfconfig tui
            └─────────────▲───────────┘
                          │ JSON‑RPC (stdio)
            ┌─────────────┴───────────┐
            │  core‑service daemon    │  (TypeScript)
            │  • adapter registry     │
            │  • JSON/YAML schemas    │
            │  • file‑watch & diff    │
            │  • backup manager       │
            └─────────────▲───────────┘
                          │ TCP (localhost)
            ┌─────────────┴───────────┐
            │  Web UI (Vite + React)  │  ← sfconfig web
            └─────────────────────────┘
```

*Daemon lifecycle* — spawned in‑process by either UI; exits when last client disconnects.

*Adapter pattern* — each engine registers `(detect, read, validate, write)` hooks.

---

## 5 · Core Service API (IPC)

| Method                | Args → Returns                | Notes                                |
| --------------------- | ----------------------------- | ------------------------------------ |
| `getState()`          | → merged JSON (engine‑tagged) | Cached; refreshes on file‑watch.     |
| `patch(patchObj)`     | → `{success, errors[]}`       | Deep‑merge, validate, write, backup. |
| `listBackups(engine)` | → `[path, timestamp]`         |                                      |
| `restoreBackup(path)` | → `boolean`                   |                                      |
| `checkUpdate()`       | → `{latest, current, url}`    |                                      |

Errors include engine id, path, and schema pointer.

---

## 6 · User Flows (TUI)

1. Splash → global cards.
2. `Tab` cycles *Global* ↔ *Projects* ↔ *Raw*.
3. Within *Projects*, arrows select; `Enter` opens detail pane.
4. `Space` toggles booleans; `b` backup list; `u` restore.
5. `:` opens command palette (`patch key.path true`, `open web`).
6. `q` quits (prompts to save edits).

---

## 7 · Web UI UX

* React + Tailwind SPA.
* Sidebar engine list (Claude, Codex).
* Responsive; dark/light theme.
* Auto‑save; toast on success/error.

---

## 8 · Persistence & Validation

* JSON engines → AJV schema; unknown fields passthrough.
* YAML engines → parse to JSON, then same schema.
* Failed writes never overwrite original.

---

## 9 · Packaging & Distribution

| Channel             | Command                                              | Contains                                               |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **npm**             | `npm i -g @snowfort/config` / `npx @snowfort/config` | Source + pre‑built binaries (mac, linux) under `bin/`. |
| **Homebrew tap**    | `brew install snowfort-config`                       | Wraps GitHub release tarball.                          |
| **GitHub Releases** | `snowfort-config-vX.Y.Z-{macos,linux}.tar.gz`        | Stripped binaries via `pkg`.                           |

Node ≥ 18 required when running as source.

---

## 10 · Testing Requirements

| Layer           | Tests                                                   |
| --------------- | ------------------------------------------------------- |
| **Unit**        | Schema validation, diff/merge, backup rotation.         |
| **Integration** | Per‑adapter read‑patch‑read, concurrent write handling. |
| **E2E**         | Ink testing library (TUI), Playwright/Puppeteer (web).  |
| **Manual**      | Smoke on macOS 14, Ubuntu 22, WSL2; confirm colours.    |

Coverage target ≥ 80 %.

---

## 11 · Security & Privacy

* All operations local only.
* Optional update check can be disabled.
* Signed macOS binaries (Developer ID) by v1.0.

---

## 12 · Performance Targets

* TUI cold launch ≤ 300 ms on M‑series Mac.
* Web first paint ≤ 800 ms.
* Daemon idle RSS ≤ 60 MB.

---

## 13 · Roadmap

| Milestone                 | Highlights                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- |
| **v0.0.1 (MVP, 2–3 wks)** | Core, Claude + Codex adapters, TUI, Web, backups, update‑check, npm release. |
| **v0.1 (2 wks)**          | Copilot YAML adapter, dark/light theme, usage snapshot card.                 |
| **v0.2 (4 wks)**          | Historical charts in web, plugin SDK, binary auto‑update.                    |
| **v1.0**                  | Signed binaries, Homebrew, docs site, hosted beta exploration.               |

---

## 14 · Open Items / Risks

1. Codex CLI path variability (`CODEX_CONFIG`).
2. Concurrent writes by engine — handle mtime + retry.
3. Ink ↔ React code sharing — establish design system early.
4. Apple notarization lead time for signed releases.

---

### Deliverables

* **Repo** – monorepo with `/packages/core`, `/apps/tui`, `/apps/web`, tooling scripts.
* **CLI** – `sfconfig` binary.
* **Docs** – README, typedoc site.
* **CI** – GitHub Actions: lint → test → build → release artifacts.
