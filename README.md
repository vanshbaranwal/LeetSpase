# LeetSpase

LeetSpase is a full stack platform for practicing coding problems alone or with others. It brings a problem library, code editor, judged submissions, playlists, progress tracking, and real-time collaborative **Spases** into one workspace.

**[Live app](https://leetspase.vanshbaranwal.com)**

## Contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Setup](#setup)
- [API](#api)
- [Validation](#validation)

## Overview

Users can find a problem, write and test code in the browser, submit a solution, and revisit their progress. Spases extend that workflow to a shared session: a host chooses a problem and up to four others can follow or solve alongside them. Code and results stay in sync for everyone.

## Features

### 1. Problem library

- Search and filter problems by title, topic, and difficulty.
- Read statements, examples, constraints, and available hints or editorials.
- Open the daily challenge or save problems to a personal playlist.

### 2. Code editor and submissions

- Write Python, Java, or JavaScript in a Monaco editor with syntax highlighting.
- Run sample test cases, inspect output and errors, then submit against the problem's test cases.
- Resize the description, editor, and results panels to suit the task.

### 3. Spases: collaborative problem solving

- Create a Spase with a five-character invite code and a limit of five participants.
- Choose whether guests join as editors or viewers. The host selects the problem and can remove participants.
- Edit the same code document concurrently and see participant cursors. Problem and language changes sync across the session.
- Share Run and Submit activity and results with every participant. A new tab replaces the same user's previous session; empty Spases expire after five minutes.

### 4. Playlists and progress

- Create and manage playlists for focused practice.
- Review solved problems, submissions, and activity from the profile.

### 5. Accounts and administration

- Sign in with email/password or Google; admin access is role restricted.
- Admins can manage problems and inspect Spase totals and history, including attendance and execution summaries.

## Tech stack

**Frontend:** React, Vite, React Router, Tailwind CSS, Zustand, and Monaco Editor.

**Backend:** Node.js and Express for the API; Prisma and PostgreSQL for data; the CodeBox execution engine for running and judging code.

**Collaboration:** Socket.IO synchronizes presence, cursors, problem state, and execution events. Yjs merges concurrent code edits. The API and Socket.IO use the same HTTP server, and Spase documents and session history are persisted in PostgreSQL.

**Authentication:** JWT cookies, bcrypt password hashing, and Google OAuth.

## Project structure

```text
LeetSpase/
├── backend/
│   ├── prisma/             Database schema and migrations
│   ├── src/
│   │   ├── controllers/    API handlers
│   │   ├── routes/         API endpoints
│   │   └── spases/         Live sessions, jobs, and history
│   └── scripts/            Data and Spase validation
└── frontend/
    └── src/
        ├── page/           App screens
        ├── components/     Shared UI
        ├── spases/         Collaborative editor and session UI
        └── store/          Client state
```

## Setup

You need Node.js, npm, PostgreSQL, and access to the CodeBox execution engine. Google OAuth is optional.

### Backend

From the repository root:

```bash
cd backend
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `JUDGE0_API_URL`, and `JUDGE0_API_KEY` in `backend/.env`. The example file describes the remaining settings. On PowerShell, use `Copy-Item .env.example .env` for the copy step. The API starts on `http://localhost:8080` by default.

### Frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. For Google sign-in, set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`. `VITE_SPASE_SOCKET_URL` can override the Socket.IO URL if it differs from the API host. Do not commit credentials.

## API

The Express API is mounted under `/api/v1`:

| Route | Purpose |
| --- | --- |
| `/auth` | Accounts and authentication |
| `/problems` | Library, problem details, and daily challenge |
| `/execute-code`, `/submission` | Run, submit, and review results |
| `/playlist`, `/profile` | Personal collections and progress |
| `/spases` | Spase creation and membership |
| `/admin` | Problem management and activity history |

Socket.IO handles live Spase events. `GET /health` reports backend readiness.

## Validation

```bash
cd frontend
npm run lint
npm run build

cd ../backend
npm run validate:spase-migrations
npm run validate:spases
```

The Spase validation commands require a configured local database. Additional problem-data checks are available in `backend/package.json`.

---

Built by [Vansh Baranwal](https://www.linkedin.com/in/vanshbaranwal/).
