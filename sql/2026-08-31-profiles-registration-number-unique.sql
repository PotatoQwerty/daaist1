-- =====================================================================
-- One account per registration number
-- 2026-08-31
--
-- WHY
--
-- /api/registration/onboarding verifies a claimed matricule against
-- public."students-data" and then writes it onto the caller's profile. It
-- handles Postgres error 23505 on that write and reports "Username or
-- registration number already taken", which reads as though uniqueness is
-- enforced on both columns.
--
-- It is enforced on username. For registration_number the only uniqueness
-- added so far was on the ROSTER table, in
-- 2026-08-29-schema-hardening.sql section 1.a:
--
--     ALTER TABLE public."students-data"
--       ADD CONSTRAINT students_data_registration_number_key
--       UNIQUE (registration_number);
--
-- Nothing was added to public.profiles. So two accounts could each complete
-- onboarding with the SAME matricule: both pass the roster check, both are
-- marked isdaa, and both carry the same registration number. That matters
-- because the matricule is an identity claim - it is what ties an account to
-- a real student, and event registration dedupes on it.
--
-- Section 0 confirms whether the constraint is actually missing before
-- anything is changed. If it already exists, section 2 is a no-op.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. VERIFY FIRST  (read-only)
-- ---------------------------------------------------------------------

-- 0.a Does any uniqueness already cover the column? Expect zero rows if
--     the constraint is genuinely missing. Covers both table constraints
--     and bare indexes, because a CREATE TABLE dump shows neither.
SELECT i.relname AS index_name,
       pg_get_indexdef(i.oid) AS definition
FROM pg_index x
JOIN pg_class  i ON i.oid = x.indexrelid
JOIN pg_class  t ON t.oid = x.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'profiles'
  AND x.indisunique
  AND pg_get_indexdef(i.oid) ILIKE '%registration_number%';

-- 0.b Are there already duplicates? Every row listed here is two accounts
--     claiming the same student, and has to be resolved by hand before
--     section 2 will run. Expect zero rows.
SELECT registration_number,
       count(*)            AS accounts,
       array_agg(user_id)  AS user_ids,
       array_agg(username) AS usernames
FROM public.profiles
WHERE registration_number IS NOT NULL
  AND btrim(registration_number) <> ''
GROUP BY registration_number
HAVING count(*) > 1;


-- ---------------------------------------------------------------------
-- 1. IF 0.b RETURNED ROWS  (manual, destructive - read before running)
--
-- Decide which account is the genuine one. The other should have its
-- claim cleared rather than be deleted, so the person keeps their
-- account, their uploads and their likes, and can redo the DAA step:
--
--   UPDATE public.profiles
--      SET registration_number = NULL
--    WHERE user_id = '<the account that should not hold it>';
--
--   UPDATE public.student_enrollments
--      SET isdaa = false
--    WHERE user_id = '<same account>';
--
--   DELETE FROM public.onboarding_status
--    WHERE user_id = '<same account>';   -- lets them onboard again
--
-- Leave this section alone if 0.b was empty.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 2. CONSTRAINT  (safe, additive)
--
-- A partial unique index rather than a table constraint, because
-- registration_number is NULL for every non-DAA account. Postgres already
-- treats NULLs as distinct under UNIQUE, so a plain constraint would also
-- work - the WHERE clause is here to say so out loud, and to keep the
-- index off the many null rows.
--
-- IF NOT EXISTS so this is safe to re-run and safe if 0.a found that the
-- guarantee was there all along under a different name.
-- ---------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS profiles_registration_number_key
  ON public.profiles (registration_number)
  WHERE registration_number IS NOT NULL;


-- ---------------------------------------------------------------------
-- 3. CONFIRM  (read-only, run after section 2)
--
-- Expect exactly one row: profiles_registration_number_key.
-- ---------------------------------------------------------------------

SELECT i.relname AS index_name,
       pg_get_indexdef(i.oid) AS definition
FROM pg_index x
JOIN pg_class  i ON i.oid = x.indexrelid
JOIN pg_class  t ON t.oid = x.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'profiles'
  AND x.indisunique
  AND pg_get_indexdef(i.oid) ILIKE '%registration_number%';


-- ---------------------------------------------------------------------
-- 4. ROLLBACK
-- ---------------------------------------------------------------------
--
-- DROP INDEX IF EXISTS public.profiles_registration_number_key;
