# Daa'ist

Course material, past exams and documents for architecture students at the
Département d'Architecture d'Alger, alongside the student clubs and the events
they run.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4,
Supabase (auth + Postgres) and Cloudflare R2 for file storage.

## Checkpoint submission

Islam Alhallak — Cloud Based Web System Design

- [Live application](https://daaist.com)
- [Video presentation and demo](https://youtu.be/KEBegLt27jU)
- [Project report](docs/Islam%20Alhallak%20Cloud%20Based%20Web%20System%20Design%20Checkpoint.docx)
- [Architecture diagram](docs/daaist-architecture.png)
- [Evaluation table](docs/daaist-evaluation.png)
- [Demo event banner](docs/demo-event-assets/architecture-workshop-banner-1600x900.png)

The report and evaluation table record checks from 27 October 2026: 132 passing
tests, passing type and build checks, and 85 ESLint errors with 10 warnings.
That evaluation predates publication of the CI workflow; current hosted results
are available in [GitHub Actions](https://github.com/PotatoQwerty/daaist1/actions).
The remaining lint issues are being addressed.

## Running locally

Requires Node.js 24 and npm.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

`.env.example` lists every variable the app reads: Supabase URL and keys,
the site base URL, and the R2 bucket credentials.

An existing, configured Supabase database is required. Database migrations are
not currently included in this repository.

## Scripts

| Command             | What it does              |
| ------------------- | ------------------------- |
| `npm run dev`       | Dev server                |
| `npm run build`     | Production build          |
| `npm start`         | Serve the production build |
| `npm run lint`      | ESLint                    |
| `npm run typecheck` | TypeScript check          |
| `npm test`          | Unit tests (`node --test`) |

## Continuous integration

[CI](.github/workflows/ci.yml) installs the locked dependencies and runs lint,
type checking, tests and the production build on pushes and pull requests.
Build checks use dummy configuration and do not require production secrets.
All checks report their results even if another check fails; failures keep the
job unsuccessful. Making CI a required merge check needs GitHub branch rules.
