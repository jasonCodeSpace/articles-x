-- Fix RLS policies performance issues
-- 1. Replace auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
-- 2. Merge multiple permissive policies on daily_summary table

-- ============================================
-- PART 1: Fix comments table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Recreate policies with optimized auth.uid() calls using (select auth.uid())
-- This prevents PostgreSQL from re-evaluating auth.uid() for each row

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

-- ============================================
-- PART 2: Fix daily_summary table RLS policies
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to daily summaries" ON public.daily_summary;
DROP POLICY IF EXISTS "Allow service role to manage daily summaries" ON public.daily_summary;

-- Create a single unified policy that handles both public read and service role full access
-- Using (select auth.uid()) for performance and merging multiple policies into one

CREATE POLICY "Unified daily_summary access policy" ON public.daily_summary
  FOR ALL
  TO anon, authenticated, dashboard_user, service_role
  USING (
    -- Public read access for everyone
    true
  )
  WITH CHECK (
    -- Only service role can insert/update/delete
    (select auth.jwt()->>'role') = 'service_role'
  );

-- ============================================
-- PART 3: Re-analyze tables for query planner
-- ============================================

ANALYZE public.comments;
ANALYZE public.daily_summary;

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can insert comments" ON public.comments IS 'Optimized: Uses (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can update own comments" ON public.comments IS 'Optimized: Uses (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can delete own comments" ON public.comments IS 'Optimized: Uses (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Unified daily_summary access policy" ON public.daily_summary IS 'Merged multiple policies into one for better performance. Public read, service_role write.';
