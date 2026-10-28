# ShortStay

ShortStay is a UI Design course team prototype for comparing short-term housing options, tracking contact and verification status, and recording a provisional decision.

ShortStay 是一个 UI Design 课程团队原型，用于比较短租房源、记录联系与核实状态，并整理暂定选择的理由。

## Run locally / 本地运行

No build step, npm packages, or API keys are required. Download or clone this repository and open `dist/index.html` in a modern browser.

无需安装依赖或配置密钥，直接用浏览器打开 `dist/index.html` 即可。

For a consistent browser origin, you can also start a local server from the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/dist/>. Use the same address each time to keep the same browser-local workspace.

## Repository map / 目录说明

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Page structure, forms, dialogs, and copy |
| `dist/styles.css` | Desktop and mobile layouts and visual styles |
| `dist/app.js` | Filtering, listings, decisions, updates, undo, and browser storage |
| `tests/` | Existing regression checks and a local Chrome runner |
| `docs/DEMO_GUIDE.md` | Demo steps, fictional data, and storage notes |
| `docs/CONTRIBUTING.md` | Team workflow and review checklist |
| `docs/preview.png` | Earlier prototype screenshot; code is the current reference |

`dist/` is the editable application code in this project. Keep it in version control.

## Prototype features / 原型功能

- Compare 12 fictional NYC listings against dates and monthly rent requirements.
- Add, edit, remove, sort, and switch between compact and detailed listing views.
- Track contact status, verification, safety reminders, and a provisional first choice.
- Simulate a host update, review its effect, and apply, revert, or undo changes.
- Start an empty workspace and export a demo session as JSON.

## Data and limitations / 数据与限制

All built-in listings, dates, prices, messages, and contact states are fictional test inputs. They are not real housing listings, market estimates, or participant evidence.

Workspace data is saved only in each browser's `localStorage`. It is not synchronized between teammates or devices. This repository contains a frontend prototype without a shared backend. Host messages and reminders are manually simulated; the page does not send messages or run live notifications.

Do not commit participant records, interview exports, exported sessions, credentials, or personal contact details. Research material and large recordings remain outside this public code repository.

## Regression checks / 回归测试

The bundled runner requires macOS, zsh, Python 3, and Google Chrome. From the repository root, run:

```sh
zsh tests/run.sh
```

It tests a temporary copy of `dist/` with separate disposable Chrome profiles, including fresh and legacy saves, storage failures, mobile layout, preferences, updates, safety checks, and undo. It leaves your normal browser profile untouched and exits with a failure status when a check fails.

If Chrome is installed elsewhere, set `CHROME_BIN` to its executable path. The full runner currently targets macOS; opening the prototype itself does not require macOS.

## Team collaboration / 团队协作

Everyone can view and clone this public repository. Teammates who need to push branches should be invited by the owner as collaborators.

Use `main` for the agreed version. Make changes on a separate branch, open a pull request explaining the change and checks, and ask a teammate to review before merging. See [the contribution guide](docs/CONTRIBUTING.md).

## Project context

This public snapshot was prepared from the local ShortStay CP3 prototype on October 28, 2026. Existing local project files and their original version history are retained separately. Codex and Claude Code assisted with prototype implementation and testing; the team remains responsible for design decisions and evaluating the prototype with participants.
