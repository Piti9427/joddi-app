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
- **Clean Code (SonarQube Standards)**:
  - **Readonly Props**: Always define component props as `Readonly<{...}>`.
  - **Global Objects**: Use `globalThis` instead of `window` or `self`.
  - **Type Conversion**: Use `Number.parseInt()` and `Number.parseFloat()` instead of global functions.
  - **Complexity**: Keep Cognitive Complexity low (max 15). Extract logic into helper functions or sub-components.
  - **React Keys**: Never use array index as a `key` for list items. Use unique data identifiers.
  - **Ternaries**: Do not use nested ternary operators. Use helper functions or early returns.
  - **Template Literals**: Avoid nested template literals.
  - **Conditionals**: Avoid unnecessary negated conditions and prefer positive logic.
- **Lazy Loading**: Components are lazy-loaded (`React.lazy`) to optimize performance and split bundles.
- **Offline First**: The app incorporates offline caching and optimistic UI updates for transactions, managed within `src/lib/supabase.ts` and `App.tsx`.
- **Styling**: Utility-first styling via TailwindCSS.
- **Dark Mode**: Managed via custom theme handling classes on `document.documentElement` alongside Tailwind's dark mode capabilities.
