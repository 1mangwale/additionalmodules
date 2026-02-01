-- ============================================================================
-- CLEANUP DUPLICATES: Remove duplicate test data
-- ============================================================================

-- Remove duplicate services (keep first occurrence)
DELETE FROM services_catalog WHERE id IN (8, 9);

-- Remove duplicate venue (keep id=2, remove id=10)
DELETE FROM venue_types WHERE id = 10;

-- Verify cleanup
DO $$
BEGIN
    RAISE NOTICE '✅ Duplicates cleaned up!';
END $$;
