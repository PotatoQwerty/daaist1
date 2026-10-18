# Daa'ist

Course material, past exams and documents for architecture students at the
Département d'Architecture d'Alger, alongside the student clubs and the events
they run.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4,
Supabase (auth + Postgres) and Cloudflare R2 for file storage.

## Running locally

Requires Node.js and npm.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

`.env.example` lists every variable the app reads: Supabase URL and keys,
the site base URL, and the R2 bucket credentials.

Database changes live in [sql/](sql/) and are applied by hand in the Supabase
SQL editor. Read each file's header before running it.

## Scripts

| Command             | What it does              |
| ------------------- | ------------------------- |
| `npm run dev`       | Dev server                |
| `npm run build`     | Production build          |
| `npm start`         | Serve the production build |
| `npm run lint`      | ESLint                    |
| `npm run typecheck` | TypeScript check          |
| `npm test`          | Unit tests (`node --test`) |
