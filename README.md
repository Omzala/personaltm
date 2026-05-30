# 9to5Wrapped MERN App

This app helps employees enter time-based daily tasks, then generates a polished role-aware report with AI.

## Features

- Signup and signin with email/password
- Sign in with Google using Google Identity Services
- Onboarding questions for role, seniority, normal responsibilities, tools, expectations, and reporting tone
- Daily report editor with time/task rows
- AI-generated report tailored to the employee profile
- MongoDB persistence for users and reports

## Setup

Requires Node.js 20 or newer.

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Update `server/.env` with MongoDB, JWT, Gemini, and Google values.

4. Update `client/.env` with your API URL and Google client ID.

5. Start MongoDB if you do not already have a database:

```bash
docker compose up -d mongo
```

6. Run the app:

```bash
npm run dev
```

The client runs on `http://localhost:5173` and the server runs on `http://localhost:5000`.

## AI Notes

Set `GEMINI_API_KEY` in `server/.env` to enable live AI generation. Optionally set `GEMINI_MODEL` to override the default Gemini model. If no key is present, the server returns a deterministic polished fallback so the app remains usable during development.
