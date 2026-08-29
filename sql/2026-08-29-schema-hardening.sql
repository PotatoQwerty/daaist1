-- =====================================================================
-- Daa'ist schema hardening
-- 2026-08-29
--
-- ALREADY RUN. Sections 1.b, 1.c and 3.b turned out to duplicate
-- indexes that already existed but were invisible in the CREATE TABLE
-- dump they were written against; 3.c was redundant for a different
-- reason. See 2026-08-29-schema-hardening-cleanup.sql, which removes
-- the duplicates. Do not re-run this file as-is.
--
-- Run the checks in section 0 first. Sections 1 and 3 are additive and
-- reversible. Section 2 drops tables and is the only destructive part;
-- it is separated deliberately so it can be skipped or run later.
--
-- NOT included, on purpose: nothing about RLS. It was verified as
-- already enabled and denying the anon role on every table checked
-- (profiles, user_roles, files, invites, messages, students-data,
-- student_enrollments, onboarding_status, likes all return 42501;
-- clubs, events and event_participants return zero rows). The app
-- reaches those through the service-role client server-side, which is
-- why the site still works. Leave it as it is.
--
-- Also not included: the `teacher` role. public.app_role already
-- contains 'super_admin', 'admin', 'club', 'student', 'teacher', and
-- both user_roles.role and invites.role_to_assign use it, so the
-- application-side teacher work needs no migration.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. VERIFY FIRST  (read-only, changes nothing)
--
-- Every statement below should return 0. Each was 0 when this file was
-- written, but re-run them: rows may have been added since.
-- ---------------------------------------------------------------------

-- 0.a Duplicate matricules in the roster. Blocks 1.a.
SELECT count(*) AS duplicate_matricules
FROM (
  SELECT registration_number
  FROM public."students-data"
  GROUP BY registration_number
  HAVING count(*) > 1
) d;

-- 0.b Duplicate registrations per event. Blocks 1.b.
SELECT count(*) AS duplicate_event_matricules
FROM (
  SELECT event_id, registration_number
  FROM public.event_participants
  GROUP BY event_id, registration_number
  HAVING count(*) > 1
) d;

-- 0.c Same account registered twice for one event. Blocks 1.c.
SELECT count(*) AS duplicate_event_accounts
FROM (
  SELECT event_id, user_id
  FROM public.event_participants
  WHERE user_id IS NOT NULL
  GROUP BY event_id, user_id
  HAVING count(*) > 1
) d;

-- 0.d Rows in the tables section 2 drops. Both were 0.
SELECT
  (SELECT count(*) FROM public.students) AS students_rows,
  (SELECT count(*) FROM public.tasks)    AS tasks_rows;


-- ---------------------------------------------------------------------
-- 1. CONSTRAINTS  (safe, additive)
-- ---------------------------------------------------------------------

-- 1.a The roster is looked up by registration_number and the result is
--     read with .single()/.maybeSingle(), which errors rather than
--     picking one when two rows match. A duplicate import would
--     silently stop those students verifying. The column is already
--     unique in practice (1439 of 1439 distinct); this makes it a rule
--     instead of a coincidence.
ALTER TABLE public."students-data"
  ADD CONSTRAINT students_data_registration_number_key
  UNIQUE (registration_number);


-- 1.b / 1.c  One registration per person per event.
--
--     SUPERSEDED - see 2026-08-29-schema-hardening-cleanup.sql.
--
--     The claim below was wrong. Both rules already existed as unique
--     INDEXES (event_participants_event_reg_unique and
--     event_participants_event_user_unique), which a CREATE TABLE dump
--     does not display, so they were mistaken for absent. Running these
--     statements created a duplicate of each. The cleanup file drops
--     the duplicates; do not run 1.b or 1.c again.
--
--     Original, incorrect note kept for the record:
--       "/api/events/register already handles Postgres error 23505 on
--        insert, which implies a unique constraint was intended here,
--        but none exists. Today the duplicate check is
--        application-level only."
--     The 23505 branch was in fact always reachable.

ALTER TABLE public.event_participants
  ADD CONSTRAINT event_participants_event_registration_key
  UNIQUE (event_id, registration_number);

--     Partial, because anonymous sign-ups legitimately leave user_id
--     null and a plain UNIQUE would collapse them all into one row.
CREATE UNIQUE INDEX event_participants_event_user_key
  ON public.event_participants (event_id, user_id)
  WHERE user_id IS NOT NULL;


-- 1.d OPTIONAL. The third identity the app dedupes on is email. Left
--     commented because it is the most likely to reject a real person
--     (a shared family address, a club account registering on someone's
--     behalf). Enable it only if one email per event is a rule you
--     actually want enforced.
--
-- CREATE UNIQUE INDEX event_participants_event_email_key
--   ON public.event_participants (event_id, lower(email))
--   WHERE email IS NOT NULL;


-- ---------------------------------------------------------------------
-- 2. DEAD TABLES  (destructive - review before running)
--
-- Both are empty and referenced by no code. `students` was superseded
-- by `student_enrollments`, which holds the live 27 rows and is what
-- the onboarding route writes. `tasks` is a leftover Supabase starter
-- table with a `user_id text DEFAULT (auth.jwt() ->> 'sub')` default
-- that matches nothing in this app.
--
-- RESTRICT (the default) rather than CASCADE: if anything unexpected
-- depends on these, the statement fails instead of quietly taking that
-- dependency with it.
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS public.students RESTRICT;
DROP TABLE IF EXISTS public.tasks RESTRICT;


-- ---------------------------------------------------------------------
-- 3. INDEXES  (safe, optional - performance only)
-- ---------------------------------------------------------------------

-- 3.a /courses/[level] and /docs filter on these every page load and
--     there is no index on either column today. Small tables now, so
--     this is pre-emptive rather than urgent.
CREATE INDEX IF NOT EXISTS files_level_idx    ON public.files (level);
CREATE INDEX IF NOT EXISTS files_category_idx ON public.files (category);

-- 3.b SUPERSEDED - already existed as
--     event_participants_check_in_token_uidx. Dropped again by the
--     cleanup file. Do not re-run.
CREATE UNIQUE INDEX IF NOT EXISTS event_participants_check_in_token_key
  ON public.event_participants (check_in_token);

-- 3.c SUPERSEDED - redundant. event_participants_event_checked_in_idx
--     on (event_id, checked_in_at) already serves WHERE event_id = ?
--     through its leftmost column. Dropped again by the cleanup file.
CREATE INDEX IF NOT EXISTS event_participants_event_id_idx
  ON public.event_participants (event_id);

-- 3.d Every role check in the app filters user_roles by user_id. The
--     composite primary key (user_id, role) already leads with user_id,
--     so this is covered. No index needed - noted so it is not added
--     twice by mistake.


-- ---------------------------------------------------------------------
-- 4. OPTIONAL TIDY-UP  (cosmetic, low value)
--
-- files.uploaded_by carries two foreign keys: one to profiles(user_id)
-- and one to auth.users(id). profiles.user_id already references
-- auth.users, so the second is transitively implied and costs an extra
-- constraint check on every insert. Dropping it changes no behaviour.
-- Left commented because the gain is negligible.
--
-- ALTER TABLE public.files DROP CONSTRAINT files_uploaded_by_fkey;
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 5. ROLLBACK
-- ---------------------------------------------------------------------
--
-- ALTER TABLE public."students-data"
--   DROP CONSTRAINT students_data_registration_number_key;
-- ALTER TABLE public.event_participants
--   DROP CONSTRAINT event_participants_event_registration_key;
-- DROP INDEX IF EXISTS public.event_participants_event_user_key;
-- DROP INDEX IF EXISTS public.files_level_idx;
-- DROP INDEX IF EXISTS public.files_category_idx;
-- DROP INDEX IF EXISTS public.event_participants_check_in_token_key;
-- DROP INDEX IF EXISTS public.event_participants_event_id_idx;
--
-- Section 2 cannot be rolled back. Both tables were empty, so there is
-- nothing to restore, but the definitions are in the schema dump if you
-- ever need them again.
