# GearRent Frontend

The Next.js web app for the **Equipment Rental Platform**. Renters can discover
equipment and manage rentals; Owners manage listings; Admins review and manage
the platform.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, and shadcn/ui.

## Run locally

Requires Node.js/npm and the backend API running at `http://localhost:5000`.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set
`NEXT_PUBLIC_API_URL` in `.env.local` to the backend origin if it differs from
the local default.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Check the frontend code |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |

## Project layout

```text
public/          Images and other static assets
src/app/         Routes, layouts, and global styles
src/components/  Shared layout and UI components
src/features/    Auth, equipment, and booking features
src/hooks/       Shared React hooks
src/lib/          API and service integrations
src/types/        Shared TypeScript types
src/utils/        Shared utilities
```

For deployment, set `NEXT_PUBLIC_API_URL` to the public backend HTTPS origin.
Keep secrets in the backend environment; never put them in `NEXT_PUBLIC_*`
variables.
