# Project Structure

This is the current project structure overview for the Fixit workspace.

```
Fixit/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  │  └─ page.tsx
│  │  └─ register/
│  │     └─ page.tsx
│  ├─ admin/
│  │  ├─ analytics/
│  │  │  └─ page.tsx
│  │  ├─ tickets/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ api/
│  │  └─ line/
│  │     ├─ notify-admin/
│  │     │  └─ route.ts
│  │     └─ webhook/
│  │        └─ route.ts
│  ├─ resident/
│  │  ├─ tickets/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  ├─ new/
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ _utils/
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ admin/
│  │  ├─ admin-nav.tsx
│  │  ├─ analytics-charts.tsx
│  │  └─ status-update-form.tsx
│  ├─ resident/
│  │  ├─ comment-section.tsx
│  │  └─ resident-nav.tsx
│  ├─ ui/
│  │  ├─ avatar.tsx
│  │  ├─ badge.tsx
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ dialog.tsx
│  │  ├─ dropdown-menu.tsx
│  │  ├─ input.tsx
│  │  ├─ label.tsx
│  │  ├─ mode-toggle.tsx
│  │  ├─ select.tsx
│  │  ├─ separator.tsx
│  │  ├─ table.tsx
│  │  ├─ tabs.tsx
│  │  └─ textarea.tsx
│  └─ theme-provider.tsx
├─ lib/
│  ├─ line/
│  │  └─ notify-admin.ts
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ proxy.ts
│  │  └─ server.ts
│  ├─ constants.ts
│  └─ utils.ts
├─ public/
├─ schema/
│  └─ supabase-schema.sql
├─ types/
│  ├─ database.types.ts
│  └─ index.ts
├─ .env.example
├─ .env.local
├─ .gitignore
├─ components.json
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
├─ proxy.ts
├─ README.md
└─ tsconfig.json
```

## Notes

- Generated from the current workspace state.
- Intended for architecture overview, onboarding, and planning refactors.
