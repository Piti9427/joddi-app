# JoddiApp (React + Vite + Capacitor)

## Project Overview

JoddiApp is a modern, responsive web and mobile application built with React, Vite, and Capacitor. It appears to be a personal finance or transaction tracking app with features like "Add Transaction", "Review Receipt", "Budget", "Analytics Dashboard", and "Categories Management". It supports offline-first/local-only mode and syncs with Supabase.

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS (v4)
- **State/Routing**: Custom state management, likely utilizing React hooks (`useState`, `useEffect`) and dynamic views.
- **Backend/Database**: Supabase (PostgreSQL, GoTrue for Auth)
- **Mobile Native**: Capacitor (iOS configured)
- **Animations**: Motion (framer-motion compatible)
- **Icons**: Lucide React
- **AI Integration**: `@google/genai` (used for AI Studio integrations)

## Building and Running

### Prerequisites

- Node.js
- Supabase project with Email auth enabled

### Commands

- **Install dependencies:**

  ```bash
  npm install
  ```

- **Run local development server:**

  ```bash
  npm run dev
  ```

- **Build for production:**

  ```bash
  npm run build
  ```

- **Preview production build:**

  ```bash
  npm run preview
  ```

- **Capacitor Commands (iOS):**
  - Sync iOS project: `npm run cap:sync:ios`
  - Open in Xcode: `npm run cap:open:ios`

## Environment Variables

The application requires the following environment variables. Use `.env.local` or `.env` to configure:

- `GEMINI_API_KEY`: API key for Gemini integrations.
- Supabase variables (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) as indicated by typical Supabase setups and the `.env.example` file.

## Development Conventions

- **Component Architecture**: The UI is divided into modular components located in the `src/components` directory (e.g., `Dashboard`, `AddTransaction`, `AnalyticsDashboard`).
- **Lazy Loading**: Components are lazy-loaded (`React.lazy`) to optimize performance and split bundles.
- **Offline First**: The app incorporates offline caching and optimistic UI updates for transactions, managed within `src/lib/supabase.ts` and `App.tsx`.
- **Styling**: Utility-first styling via TailwindCSS.
- **Dark Mode**: Managed via custom theme handling classes on `document.documentElement` alongside Tailwind's dark mode capabilities.
