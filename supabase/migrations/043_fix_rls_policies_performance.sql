-- Fix RLS policies performance issues
-- Replace auth.uid() with (select auth.uid()) to prevent per-row evaluation
-- Merge multiple permissive policies on daily_summary table

-- PART 1: Fix comments table RLS policies

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
  );

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
  )
  WITH CHECK (
    (select auth.uid()) = user_id
  );

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
  );

-- PART 2: Fix daily_summary table RLS policies

DROP POLICY IF EXISTS "Allow public read access to daily summaries" ON public.daily_summary;
DROP POLICY IF EXISTS "Allow service role to manage daily summaries" ON public.daily_summary;

CREATE POLICY "Unified daily_summary access policy" ON public.daily_summary
  FOR ALL
  TO anon, authenticated, dashboard_user, service_role
  USING (true)
  WITH CHECK (
    (select auth.jwt()->>'role') = 'service_role'
  );

-- PART 3: Re-analyze tables for query planner

ANALYZE public.comments;
ANALYZE public.daily_summary;
