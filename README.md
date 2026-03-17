# UniOS — University All-in-One Desktop App

A personal academic hub built with **Tauri + React + TypeScript + Tailwind CSS**.  
All data is stored **locally** on your machine using `localStorage` via Zustand persist.

---

## Features

| Module | Description |
|---|---|
| 📊 Dashboard | Overview with stats, upcoming deadlines, activity heatmap, course quick-view |
| 📅 Calendar | Monthly calendar with events, exam markers, task due dates |
| 🗓 Timetable | Visual weekly timetable builder with drag-to-see class slots |
| ✅ Tasks | Kanban board (To Do / In Progress / Done) with priority & deadline tracking |
| 📝 Notes | Markdown editor with live preview, tags, and course linking |
| 📁 Projects | Group/individual project manager with per-project kanban board |
| 📚 Courses | Course manager with learning objectives & grade tracker (weighted GPA) |
| 🗄 Exam Papers | Store past paper links by course, year, and semester |
| 🔗 Resources | Save & categorize links (videos, articles, books, papers, tools) |
| 🔍 Search | Global full-text search across all modules |
| 🔥 Heatmap | Activity heatmap on dashboard showing daily productivity |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (stable)
- Tauri CLI prerequisites: https://tauri.app/v1/guides/getting-started/prerequisites

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (opens desktop window)
npm run tauri dev

# 3. Build production app
npm run tauri build
```

The built installers will be in `src-tauri/target/release/bundle/`.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Desktop | Tauri v1 | Lightweight, Rust-powered, local-first |
| Frontend | React 18 + TypeScript | Mature ecosystem, type safety |
| Styling | Tailwind CSS | Utility-first, dark theme friendly |
| State | Zustand + persist | Simple, no boilerplate, localStorage backed |
| Routing | React Router v6 | Clean SPA routing |
| Date Utils | date-fns | Lightweight date manipulation |
| Icons | Lucide React | Consistent icon set |

---

## Data Storage

All data lives in your browser's `localStorage` under the key `uni-os-storage`.  
No server, no account, no internet required.

To back up your data: export the localStorage key via browser devtools.  
To reset: clear localStorage for the app.

---

## Project Structure

```
src/
├── components/     # Shared UI (Layout, Sidebar, Modal)
├── pages/          # One file per module
├── store/          # Zustand store with all state & actions
├── types/          # TypeScript interfaces
└── index.css       # Global styles + Tailwind
```
