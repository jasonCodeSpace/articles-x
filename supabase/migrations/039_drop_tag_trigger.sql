-- Drop the update_article_tag trigger that references the removed tag column
DROP TRIGGER IF EXISTS trigger_update_article_tag ON articles;
DROP TRIGGER IF EXISTS update_article_tag_trigger ON articles;
DROP FUNCTION IF EXISTS update_article_tag();
DROP FUNCTION IF EXISTS assign_article_tag();
