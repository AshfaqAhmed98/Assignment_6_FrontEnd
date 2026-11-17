# Equipment Rental Platform

Product/page name: **GearRent**

Frontend stack: Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

## Structure

```text
public/
  images/                 Public image assets
src/
  app/                    Next.js App Router routes, layouts, and styles
  components/
    layout/               Shared page-level layout components
    ui/                   Reusable presentational components
  features/
    auth/                 Authentication-related UI and logic
    bookings/             Rental booking flows
    equipment/            Equipment browsing and detail features
  hooks/                  Shared React hooks
  lib/                    Client and service integrations
  types/                  Shared TypeScript types
  utils/                  Shared utility functions
```

Keep route-specific files in `src/app` and group feature-specific components,
hooks, and logic under the corresponding `src/features` directory. Add shared
components only when they are used across features.

## Development

```bash
npm install
npm run dev
```

Run `npm run build` to create a production build and `npm run lint` to check
the frontend code.
