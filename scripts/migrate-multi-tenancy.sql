-- ============================================================================
-- MULTI-TENANCY MIGRATION: Same phone number can exist in multiple clinics
-- ============================================================================
--
-- This migration changes the unique constraint from:
--   @@unique([phoneNumber, deletedAt])
-- To:
--   @@unique([phoneNumber, clinicId, deletedAt])
--
-- This allows patients to register with the same phone number in multiple clinics.
--
-- IMPORTANT: Run this migration during a maintenance window
-- ============================================================================

-- Step 1: Check for any existing conflicts (same phone, same clinic, not deleted)
-- If this returns any rows, you need to resolve these duplicates first
SELECT 
    "phoneNumber", 
    "clinicId", 
    COUNT(*) as duplicate_count,
    STRING_AGG(CAST(id AS TEXT), ', ') as user_ids
FROM "User"
WHERE "deletedAt" IS NULL
GROUP BY "phoneNumber", "clinicId"
HAVING COUNT(*) > 1;

-- Step 2: Drop the old unique constraint
-- Note: The constraint name might be different in your database
-- Check with: \d "User" in psql to find the exact constraint name
DROP INDEX IF EXISTS "User_phoneNumber_deletedAt_key";

-- Step 3: Create the new unique constraint
CREATE UNIQUE INDEX "User_phoneNumber_clinicId_deletedAt_key" 
ON "User" ("phoneNumber", "clinicId", "deletedAt");

-- Step 4: Add an index for efficient lookup by phone + clinic
CREATE INDEX IF NOT EXISTS "User_phoneNumber_clinicId_idx" 
ON "User" ("phoneNumber", "clinicId");

-- Step 5: Verify the new constraint is in place
-- This should show the new constraint
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'User' 
AND indexname LIKE '%phoneNumber%';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If you need to rollback this migration:
--
-- DROP INDEX IF EXISTS "User_phoneNumber_clinicId_deletedAt_key";
-- DROP INDEX IF EXISTS "User_phoneNumber_clinicId_idx";
-- CREATE UNIQUE INDEX "User_phoneNumber_deletedAt_key" ON "User" ("phoneNumber", "deletedAt");
-- ============================================================================
