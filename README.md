# Fixit

A simple dorm maintenance ticket app with resident and admin flows.

## Stack

- Next.js 16 + TypeScript
- Supabase (Auth, Postgres, Storage, Realtime)
- Tailwind CSS + shadcn/ui

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Optional LINE integration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_ADMIN_USER_IDS=user_id_1,user_id_2
LINE_CHANNEL_SECRET=your_line_channel_secret
```

3. Run the app.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run start` - start production server
- `npm run lint` - run ESLint

## Notes

- Residents can create and track maintenance tickets.
- Admins can manage ticket status and view analytics.
- LINE messaging is optional and environment-driven.
