# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TriBeCa is a modern React/TypeScript application for musical event management designed for bands, musicians, and event organizers. It uses Supabase as the backend service with PostgreSQL database and authentication.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint on the codebase
- `npm run check` - TypeScript type checking without emitting files
- `npm run preview` - Preview production build locally

## Key Architecture

### Frontend Stack
- React 18 + TypeScript + Vite
- TailwindCSS with custom TriBeCa color palette
- React Router for navigation
- Zustand for state management
- React Hook Form for form handling
- React Hot Toast for notifications

### Backend & Database
- Supabase (Backend-as-a-Service)
- PostgreSQL with Row Level Security (RLS)
- Authentication handled by Supabase Auth

### Project Structure
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── [feature]/       # Feature-specific components
├── pages/               # Main page components
├── store/               # Zustand stores (currently authStore.ts)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
│   ├── supabase.ts      # Supabase client and types
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
```

## Configuration Files

- `tsconfig.json` - TypeScript configuration with path mapping (`@/*` → `./src/*`)
- `tailwind.config.js` - Custom TriBeCa color palette and typography
- `vite.config.ts` - Vite configuration with React plugin and path resolution
- `eslint.config.js` - ESLint configuration for React/TypeScript
- `.env` - Environment variables for Supabase connection

## Environment Variables

Required environment variables (see `.env.example`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

Main entities:
- `profiles` - User profiles with roles and permissions
- `events` - Musical events with financial tracking
- `musicians` - Band member information
- `event_musicians` - Many-to-many relationship for event assignments
- `musician_substitutes` - Substitute musician relationships

## State Management

Authentication state is managed via Zustand store (`src/store/authStore.ts`):
- User session management
- Profile data fetching
- Sign in/out functionality
- Password updates

## Custom Color Palette

TriBeCa brand colors (defined in `tailwind.config.js`):
- Celeste: `#2DB2CA` (primary)
- Rojo: `#E58483` (accents/alerts)  
- Naranja: `#BDB3A4` (secondary elements)
- Amarillo: `#FAF9ED` (main background)
- Blanco: `#FFFFFF` (cards/content)

## Development Notes

- TypeScript strict mode is disabled in the current configuration
- Path aliases are configured for clean imports (`@/` maps to `src/`)
- The app uses a simplified dashboard-centric architecture
- Authentication is required for all routes except `/login`
- Row Level Security (RLS) is enabled on all database tables

## Testing

Currently, there are manual test scripts in the root:
- `test-supabase.js` - Tests Supabase connection and basic queries
- `test-band-format.js` - Tests band format calculations

No formal test framework is currently configured.