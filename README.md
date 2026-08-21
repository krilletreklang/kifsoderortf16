# Soderort F16 Coach App

Intern webbapp for KIF Soderort F16 (tranarverktyg).

## Stack

- Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- Recharts
- Lucide React
- dnd-kit (forberett for taktiktavla)

## PHASE 1 Status

Detta ar implementerat:

- Auth-struktur med inloggning/utloggning
- Skyddade interna routes
- Mork/guld-design med desktop sidebar + mobil bottom nav
- Dashboard med nyckelkort + narvarograf
- Full databasschema-migration
- RLS-policies for team-baserad access
- Seed-data for snabb utveckling

## Miljovariabler

Kopiera [.env.example](.env.example) till `.env.local` och fyll i:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Viktigt: lagg aldrig Supabase service role key i frontend.

## Starta lokalt

```bash
npm install
npm run dev
```

Appen kor pa `http://localhost:3000`.

## Databas: migrationer

Migrationer finns i [supabase/migrations](supabase/migrations).

1. [supabase/migrations/0001_extensions_and_enums.sql](supabase/migrations/0001_extensions_and_enums.sql)
2. [supabase/migrations/0002_core_tables.sql](supabase/migrations/0002_core_tables.sql)
3. [supabase/migrations/0003_constraints_indexes.sql](supabase/migrations/0003_constraints_indexes.sql)
4. [supabase/migrations/0004_rls_policies.sql](supabase/migrations/0004_rls_policies.sql)
5. [supabase/migrations/0005_seed_dev.sql](supabase/migrations/0005_seed_dev.sql)

Applicera med Supabase CLI (exempel):

```bash
supabase db push
```

## Coach-konton och team-access

- Nar en auth-user skapas i Supabase skapas profil automatiskt via trigger.
- For dataaccess maste coachen finnas i `team_members` for laget.
- Seed-scriptet innehaller en hjalprad som kopplar tre exempel-emailadresser till teamet.
	Byt dessa till riktiga coach-mail och kor scriptet igen.

## Build och kvalitet

```bash
npm run lint
npm run build
```

Build-scriptet anvander `next build --webpack` for stabilitet i restriktiva lokala miljoer.

## Projektstruktur (PHASE 1)

- [app](app)
- [components](components)
- [lib](lib)
- [types](types)
- [supabase/migrations](supabase/migrations)

## Nasta steg

- PHASE 2: players, trainings, attendance, basic statistics
- PHASE 3: matches, uttagning, rotationsstöd
