# TembeaSave - Travel Savings Application

A modern travel savings web application built with React, TypeScript, and Supabase.

## 🏗 Architecture

This is a **single-page application (SPA)** that serves both **user** and **admin** interfaces from the same codebase:

- **User Interface**: `http://localhost:8080/` → Dashboard, Trips, Wishlist, etc.
- **Admin Interface**: `http://localhost:8080/admin` → Admin Dashboard, User Management, etc.

> ⚠️ **Important**: There are NO separate ports for admin and user. Both interfaces run on the same port (8080) as part of the same Vite development server.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd T-SAVE-FRONTEND

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 8080 |
| `npm run dev:user` | Alias for `npm run dev` (same port) |
| `npm run dev:admin` | Alias for `npm run dev` (same port) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build on port 4173 |
| `npm run lint` | Run ESLint |

## 🔐 Authentication & Roles

The app uses Supabase Auth with role-based access:

| Role | Access | Redirect After Login |
|------|--------|---------------------|
| Regular User | User dashboard, trips, profile | `/dashboard` |
| Admin | Admin panel + user features | `/admin` |
| Super Admin | Full admin access | `/admin` |

### Setting Up Admin Users

1. Create a user account normally through `/auth`
2. Add their UUID to the `admin_users` table in Supabase:

```sql
INSERT INTO public.admin_users (id, role) 
VALUES ('your-user-uuid', 'admin');
-- or 'super_admin' for full access
```

## 🗂 Project Structure

```
src/
├── admin/                # Admin-specific components and pages
│   ├── components/       # AdminLayout, Sidebar, Header
│   └── pages/           # Dashboard, Users, Destinations, etc.
├── components/          # Shared UI components
├── contexts/            # React Context providers (Auth, Currency)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and Supabase client
├── pages/               # User-facing pages
└── types/               # TypeScript type definitions
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **State Management**: React Query + Context API
- **Routing**: React Router v6

## 📱 Routes

### Public Routes
- `/` - Home page
- `/trips` - Browse trips
- `/popular-destinations` - Popular destinations
- `/featured-destinations` - Featured destinations
- `/auth` - Login/Signup (unified for all users)

### Protected User Routes
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/wishlist` - Saved destinations
- `/bookings` - Trip bookings
- `/transactions` - Transaction history
- `/chat` - AI Travel Assistant

### Admin Routes (requires admin role)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/destinations` - Destination management
- `/admin/analytics` - Platform analytics
- `/admin/settings` - Admin settings

## 📄 License

This project is private and proprietary.
