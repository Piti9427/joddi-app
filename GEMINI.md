# JoddiApp (React + Vite + Capacitor)

## Project Overview

JoddiApp is a modern, responsive web and mobile application built with React, Vite, and Capacitor. It is a personal finance app that emphasizes privacy, speed, and AI-powered convenience.

### Key Features

- **Local-First Architecture**: Uses IndexedDB for instant data access and offline capability, with background synchronization to Supabase.
- **Smart Input (AI Parsing)**: Natural language processing for adding transactions (e.g., "Coffee 65 baht").
- **OCR Receipt Scanning**: AI-powered data extraction from Thai bank slips and receipts using Google Gemini.
- **AI Insights**: Personalized financial analysis and recommendations.
- **Budget Tracking**: Real-time monitoring of spending against set limits.
- **Multi-Language & Currency**: Support for Thai/English and various currencies.

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS v4
- **State/Routing**: Custom state management with dynamic views and Framer Motion.
- **Backend/Database**: Supabase (PostgreSQL, GoTrue for Auth, Realtime).
- **Offline Storage**: IndexedDB (custom implementation in `src/lib/supabase.ts`).
- **Mobile Native**: Capacitor 8 (iOS/Android).
- **Animations**: Motion (framer-motion).
- **Icons**: Lucide React.
- **AI Integration**: Google Gemini (@google/genai) for OCR and Insights.

## Building and Running

### Prerequisites

- Node.js (Latest LTS)
- Supabase project with Email auth enabled.
- Google Gemini API Key.

### Commands

- **Install dependencies:** `npm install`
- **Run local development:** `npm run dev` (Default port: 3000)
- **Build for production:** `npm run build`
- **Check code quality:** `npm run check` (Runs lint, typecheck, and build tests)
- **Capacitor Sync:** `npm run cap:sync:ios`

## Environment Variables

Configure `.env.local`:

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key.
- `VITE_GEMINI_API_KEY`: API key for Gemini OCR and Insights.
- `VITE_SMART_INPUT_ENDPOINT`: (Optional) Custom endpoint for AI parsing.

## Development Conventions

- **Component Architecture**: Modular components in `src/components`. Use `React.lazy` for all screen components.
- **Clean Code (SonarQube Standards)**:
  - **Readonly Props**: Props must be `Readonly<{...}>`.
  - **Global Objects**: Use `globalThis` instead of `window`.
  - **Type Conversion**: Use `Number.parseInt()` / `Number.parseFloat()`.
  - **Complexity**: Keep Cognitive Complexity < 15.
  - **No Array Indexes as Keys**: Use unique IDs for lists.
  - **Security**: Never use `Math.random()` for sensitive IDs or security. Use `crypto.randomUUID()` or `crypto.getRandomValues()`.
  - **Strings**: Prefer `String.replaceAll()` over `String.replace()` with global regex for clarity and safety.
  - **Regex**: Use concise syntax (e.g., `\d` instead of `[0-9]`). Always validate regex for ReDoS (backtracking). Use `RegExp.exec()` for complex matching performance.
  - **Variables**: Remove unused assignments and dead code immediately.
- **Offline First**: Always update local state (IndexedDB) first, then sync in the background.
- **Theming**: Dark mode support via `.dark` class on `document.documentElement`.
- **Formatting**: Strict Prettier and TypeScript checks enabled.

## Architecture Notes

### Synchronization Flow

1. User performs an action (e.g., add transaction).
2. `createOptimisticTransaction` generates a temporary UI state.
3. `saveLocalTransaction` writes to IndexedDB with `syncStatus: 'pending'`.
4. `syncPendingTransactions` attempts to push changes to Supabase.
5. On success, local state is updated to `syncStatus: 'synced'`.
6. On failure, it stays `pending` or `failed` to be retried later.
