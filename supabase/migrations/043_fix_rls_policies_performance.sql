-- Fix RLS policies performance issues
-- Replace auth.uid() with (select auth.uid()) to prevent per-row evaluation

-- Fix comments table RLS policies

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

-- Re-analyze table for query planner

ANALYZE public.comments;
