-- =====================================================================
-- Confirm whether public.users still exists
-- 2026-08-31
--
-- READ-ONLY. This file changes nothing. It exists to answer one
-- question that cannot be answered from the source tree.
--
-- WHY
--
-- Two API routes read and write a table called `users`:
--
--   src/app/api/users/[username]/route.ts        SELECT * ... eq(username)
--   src/app/api/files/like/[fileId]/route.ts     users.likedposts read+write
--
-- No client code calls either one, and `users` does not appear in the
-- schema inventory recorded in 2026-08-29-schema-hardening.sql, which
-- lists profiles, user_roles, files, invites, messages, students-data,
-- student_enrollments, onboarding_status, likes, clubs, events,
-- event_participants and club_members. The live "like" path is
-- /api/files/like against the `likes` table.
--
-- So both are almost certainly dead code left over from an earlier
-- schema. They have NOT been deleted, because "almost certainly" is not
-- the standard for removing something, and because a route returning a
-- confusing error is a smaller problem than deleting one that turns out
-- to be load-bearing.
--
-- Both have been secured in the meantime:
--   /api/users/[username]      now requires a session AND admin rights,
--                              and no longer relays the raw error text
--                              (audit finding H6)
--   /api/files/like/[fileId]   already required a session; now rate
--                              limited too (audit finding L2)
--
-- Run section 0. If it returns NULL, delete both route files.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. THE QUESTION
--
-- NULL  => the table does not exist. Both routes are dead. Delete them.
-- a name => the table exists. Do NOT delete; run sections 1 and 2 to see
--           what is in it and who still writes to it.
-- ---------------------------------------------------------------------

SELECT to_regclass('public.users') AS users_table;


-- ---------------------------------------------------------------------
-- 1. IF IT EXISTS: what is in it?
-- ---------------------------------------------------------------------

-- 1.a Columns, so the `likedposts` reference can be checked.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 1.b Row count, and how many rows actually carry likes. If both are 0
--     the table is an empty leftover and can be dropped along with the
--     routes.
SELECT count(*) AS total_rows
FROM public.users;


-- ---------------------------------------------------------------------
-- 2. IF IT EXISTS: is RLS on?
--
-- Both routes reach it through the service-role client, which bypasses
-- RLS, so this matters for anything ELSE that touches the table.
-- Expect rowsecurity = true, matching every other table in the schema.
-- ---------------------------------------------------------------------

SELECT relname, relrowsecurity AS rls_enabled
FROM pg_class
WHERE oid = 'public.users'::regclass;


-- ---------------------------------------------------------------------
-- 3. CLEANUP, once section 0 returns NULL
--
-- Nothing to run here - the change is in the repository, not the
-- database:
--
--   rm -r "src/app/api/users/[username]"
--   rm -r "src/app/api/files/like/[fileId]"
--
-- Then drop them from the allowlists in tests/security-invariants.test.ts
-- (INTENTIONALLY_PUBLIC_ROUTES / UNLIMITED_WRITE_ROUTES) so the suite
-- stops accounting for routes that no longer exist.
-- ---------------------------------------------------------------------
