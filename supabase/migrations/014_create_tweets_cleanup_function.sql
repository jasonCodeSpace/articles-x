-- Create function to clean up non-article tweets older than 48 hours
CREATE OR REPLACE FUNCTION cleanup_non_article_tweets()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete tweets that are not articles and are older than 48 hours
    DELETE FROM public.tweets 
    WHERE has_article = false 
    AND created_at < NOW() - INTERVAL '48 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO public.cleanup_logs (operation_type, deleted_count, executed_at)
    VALUES ('tweets_cleanup', deleted_count, NOW());
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup logs table to track cleanup operations
CREATE TABLE IF NOT EXISTS public.cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type TEXT NOT NULL,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Create index for cleanup logs
CREATE INDEX IF NOT EXISTS cleanup_logs_operation_type_idx ON public.cleanup_logs (operation_type);
CREATE INDEX IF NOT EXISTS cleanup_logs_executed_at_idx ON public.cleanup_logs (executed_at);

-- Enable RLS for cleanup logs
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write cleanup logs
CREATE POLICY "Service role can manage cleanup logs"
ON public.cleanup_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.cleanup_logs TO service_role;

-- Add comments
COMMENT ON FUNCTION cleanup_non_article_tweets() IS 'Deletes non-article tweets older than 48 hours and logs the operation';
COMMENT ON TABLE public.cleanup_logs IS 'Tracks cleanup operations performed on the database';
COMMENT ON COLUMN public.cleanup_logs.operation_type IS 'Type of cleanup operation (e.g., tweets_cleanup)';
COMMENT ON COLUMN public.cleanup_logs.deleted_count IS 'Number of records deleted in this operation';
COMMENT ON COLUMN public.cleanup_logs.executed_at IS 'When the cleanup operation was executed';