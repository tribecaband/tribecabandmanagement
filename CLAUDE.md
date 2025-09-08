# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript band management application for managing events, accounting, and user administration. The app uses Supabase as the backend database and authentication provider, with a Node.js/Express server for additional API endpoints.

## Development Commands

### Core Development
- `npm run dev` - Start both client and server in development mode using concurrently
- `npm run client:dev` - Start only the Vite development server (port 5173)
- `npm run server:dev` - Start only the Node.js server using nodemon (port 3001)

### Building and Quality Checks
- `npm run build` - Build the production version (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint on the codebase
- `npm run check` - Run TypeScript type checking without emitting files
- `npm run preview` - Preview the production build locally

## Architecture

### Full-Stack Setup
- **Frontend**: React 18 with TypeScript, using Vite as the build tool
- **Backend**: Express.js server (`server.js`) running on port 3001
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based permissions
- **API Proxy**: Vite development server proxies `/api/*` requests to the Express server

### Key Technologies
- **State Management**: Zustand for client-side state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom components
- **Maps**: React Leaflet for location visualization
- **Charts**: Recharts for data visualization
- **UI Library**: Custom components with Lucide React icons

### Project Structure
- `src/` - React application source code
  - `components/` - Reusable UI components organized by feature
  - `pages/` - Route-based page components (dashboard, events, admin, etc.)
  - `contexts/` - React contexts (AuthContext for authentication)
  - `hooks/` - Custom React hooks (useEvents, useTheme)
  - `lib/` - External library configurations (supabase client)
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions and helpers
- `server.js` - Express API server for server-side operations
- `supabase/migrations/` - Database schema and migration files

### Authentication & Permissions
The app uses a role-based permission system:
- **Roles**: `admin` and `user`
- **Permissions**: Fine-grained permissions for events, accounting, and user management
- **Protection**: Routes are protected using `ProtectedRoute` component with role/permission checks
- **User Invitation**: Admin users can invite new users via `/api/invite-user` endpoint

### Database Schema
Main tables:
- `events` - Band event information with location, billing, and member assignment
- `user_profiles` - User profile information linked to Supabase auth
- `user_permissions` - Granular permission settings per user
- `event_types` - Categorization for different event types

### API Endpoints
- `/api/health` - Health check endpoint
- `/api/invite-user` - Admin endpoint for user invitations (requires service role key)

## Environment Variables

Required environment variables (see `.env.example`):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (server-side only)
```

Optional:
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GEOCODING_API_KEY=your_opencage_api_key
PORT=3001 (server port)
```

## Development Notes

### TypeScript Configuration
- Uses strict mode disabled for flexibility during development
- Path aliases configured: `@/*` maps to `./src/*`
- Includes both `src` and `api` directories

### Code Quality
- ESLint with TypeScript rules and React-specific plugins
- React Hooks and React Refresh plugins enabled
- Type checking available via `npm run check`

### Database Migrations
Database schema is managed through Supabase migrations in `supabase/migrations/`. The project has evolved through multiple migration files that handle user roles, permissions, and RLS policies.

### Concurrent Development
The development setup uses `concurrently` to run both client and server simultaneously. The Vite dev server proxies API calls to the Express server, enabling full-stack development with hot reload.