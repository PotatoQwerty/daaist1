-- =====================================================================
-- One files row per stored object
-- 2026-08-31
--
-- WHY
--
-- /api/files/[...filekey] resolves who may delete an object by matching
-- files.url and reading uploaded_by off the row it finds. Nothing stopped
-- two rows sharing a url, and /api/files/create accepted whatever url the
-- caller sent, so a second row could be inserted for somebody else's
-- object and used to authorise deleting it.
--
-- The application now binds the url to the caller's own key namespace on
-- insert and refuses to act on an ambiguous match. This constraint is the
-- guarantee underneath both: with it, a duplicate cannot exist at all.
--
-- Safe and additive. It will fail if duplicates already exist, which is
-- the point - section 0 finds them first.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. VERIFY FIRST  (read-only)
--
-- Expect zero rows. Anything listed here is either a genuine double
-- insert or a forged record, and has to be resolved before section 1
-- will run.
-- ---------------------------------------------------------------------

SELECT url, count(*) AS copies, array_agg(id) AS row_ids,
       array_agg(uploaded_by) AS uploaders
FROM public.files
GROUP BY url
HAVING count(*) > 1;


-- ---------------------------------------------------------------------
-- 1. CONSTRAINT
-- ---------------------------------------------------------------------

ALTER TABLE public.files
  ADD CONSTRAINT files_url_key UNIQUE (url);


-- ---------------------------------------------------------------------
-- 2. ROLLBACK
-- ---------------------------------------------------------------------
--
-- ALTER TABLE public.files DROP CONSTRAINT files_url_key;
