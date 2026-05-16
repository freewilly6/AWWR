# Database backups

The GitHub Actions workflow at `.github/workflows/backup.yml` runs a weekly
backup of the Supabase Postgres database (Sundays at 03:00 UTC) using the
Supabase CLI's `db dump` command. It produces three files — `roles.sql`,
`schema.sql`, `data.sql` — and uploads them as a GitHub Actions artifact.
Artifacts are scoped to the repo and retained for 90 days on the free plan.

## One-time setup

1. **Get the connection string** from the Supabase dashboard:
   `Project Settings` → `Database` → `Connection string`. Either the direct
   connection or the Session pooler will work — the Supabase CLI handles
   routing. The string looks like:

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres
   ```

   Replace `[YOUR-PASSWORD]` with the actual database password.

2. **Add it to GitHub**: in the repo, go to
   `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

   - Name: `SUPABASE_DB_URL`
   - Value: the full connection string

3. **Test it**: `Actions` tab → `Supabase backup` → `Run workflow`. After
   ~1 minute the artifact appears at the bottom of the run page as
   `supabase-backup-<timestamp>`. Click to download.

## Downloading a backup

`Actions` tab → `Supabase backup` → pick a run → scroll to the bottom →
download the `supabase-backup-<timestamp>` artifact. You get a zip containing:

- `roles.sql` — Supabase roles and permissions
- `schema.sql` — table definitions, indexes, policies, triggers, functions
- `data.sql` — every row, written as `COPY` statements

## Restoring a backup

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) locally.
2. Unzip the downloaded artifact.
3. Run the three files **in order** against your target database (typically
   a fresh Supabase project):

```bash
export TARGET_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.NEW_PROJECT_REF.supabase.co:5432/postgres"

supabase db execute --db-url "$TARGET_DB_URL" -f roles.sql
supabase db execute --db-url "$TARGET_DB_URL" -f schema.sql
supabase db execute --db-url "$TARGET_DB_URL" -f data.sql
```

Order matters: roles → schema → data.

Restoring into a non-empty database can conflict with existing tables.
Practice on a throwaway project first.

## What's included

- The entire `public` schema (your `posts` table, indexes, RLS policies,
  triggers, functions).
- Supabase roles and grants (`roles.sql`).
- Every row of data (`data.sql`).

**Not included**:

- `auth.users` — Supabase manages this; restoring it to a different project
  would conflict with their internal triggers. For account migration use the
  Supabase auth admin API.
- Storage buckets and uploaded files — owned by Supabase Storage, would need
  a separate sync step. Not relevant right now (no media in the project).

## If 90 days isn't enough retention

Easiest free upgrade: push the dump to a **separate private** repo on each
run (don't push to this one — it's public). Unlimited retention, full git
history of every backup. Ask for that change when you need it.
