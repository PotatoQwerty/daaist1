-- =====================================================================
-- Cleanup for 2026-08-29-schema-hardening.sql
-- 2026-08-29
--
-- WHY THIS EXISTS
--
-- The hardening file added uniqueness to event_participants on the
-- belief that none existed. That belief came from reading a CREATE
-- TABLE dump, which by construction lists only columns, primary keys,
-- foreign keys and inline constraints. It never lists indexes.
--
-- event_participants already had all three, created as unique indexes
-- rather than table constraints, so they were invisible in that dump:
--
--   event_participants_event_reg_unique      (event_id, registration_number)
--   event_participants_event_user_unique     (event_id, user_id) WHERE user_id IS NOT NULL
--   event_participants_check_in_token_uidx   (check_in_token)
--
-- So the guarantees were in place all along, the 23505 branch in
-- /api/events/register was always reachable, and the hardening file
-- simply created a second copy of each. This drops the copies.
--
-- Nothing here changes what the database enforces. Every rule stays;
-- only the redundant duplicate of each is removed.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. VERIFY FIRST  (read-only)
--
-- Confirm each pair really is a duplicate before dropping either half.
-- Expect two rows per group, with matching definitions apart from the
-- index name.
-- ---------------------------------------------------------------------

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'event_participants'
ORDER BY indexdef, indexname;


-- ---------------------------------------------------------------------
-- 1. DROP THE REDUNDANT COPIES
--
-- The pre-existing index is kept in each pair and the one added on
-- 2026-08-29 is dropped, so the database ends up as it was plus the
-- genuinely new constraints in section 2 of the hardening file.
--
-- Each drop is wrapped because the object may be either a constraint or
-- a bare index depending on which statement created it, and an index
-- backing a constraint cannot be dropped with DROP INDEX. Trying the
-- constraint form first and falling through to the index form handles
-- both without needing to know which it is.
-- ---------------------------------------------------------------------

DO $$
DECLARE
  dup text;
BEGIN
  FOREACH dup IN ARRAY ARRAY[
    -- duplicate of event_participants_event_reg_unique
    'event_participants_event_registration_key',
    -- duplicate of event_participants_event_user_unique
    'event_participants_event_user_key',
    -- duplicate of event_participants_check_in_token_uidx
    'event_participants_check_in_token_key',
    -- redundant: (event_id, checked_in_at) and (event_id,
    -- registration_number) both already serve WHERE event_id = ?
    -- through their leftmost column
    'event_participants_event_id_idx'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.event_participants DROP CONSTRAINT %I', dup);
      RAISE NOTICE 'dropped constraint %', dup;
    EXCEPTION WHEN undefined_object THEN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', dup);
      RAISE NOTICE 'dropped index %', dup;
    END;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- 2. KEPT  (no action needed - listed so the net effect is clear)
--
-- These were genuinely new and are staying:
--
--   students_data_registration_number_key   the roster had no uniqueness
--                                           on registration_number at all
--   files_level_idx                         files had only its primary key
--   files_category_idx                      same
--
-- And from the same file, the two empty tables dropped: public.students
-- (superseded by student_enrollments) and public.tasks.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 3. CONFIRM  (read-only, run after section 1)
--
-- Expect exactly one index per rule on event_participants: the primary
-- key, one on (event_id, registration_number), one partial on
-- (event_id, user_id), one on (check_in_token), plus the pre-existing
-- (event_id, checked_in_at) and (user_id).
-- ---------------------------------------------------------------------

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'event_participants'
ORDER BY indexname;
