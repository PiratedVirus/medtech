-- Quick SQL to verify clinic exists in production database
-- Run this in your production database

-- 1. Check if clinic exists
SELECT 
  id, 
  name, 
  subdomain, 
  "deletedAt",
  LENGTH(subdomain) as subdomain_length,
  subdomain = 'manipal' as exact_match,
  LOWER(TRIM(subdomain)) = 'manipal' as normalized_match
FROM "Clinic" 
WHERE LOWER(TRIM(subdomain)) = 'manipal';

-- 2. Check all clinics with subdomains
SELECT 
  id, 
  name, 
  subdomain,
  "deletedAt"
FROM "Clinic" 
WHERE subdomain IS NOT NULL
ORDER BY id;

-- 3. If clinic doesn't exist, create it (adjust values as needed)
-- INSERT INTO "Clinic" (name, subdomain, "createdAt", "updatedAt")
-- VALUES ('Manipal Hospitals', 'manipal', NOW(), NOW())
-- ON CONFLICT (subdomain) DO UPDATE 
-- SET name = EXCLUDED.name, "updatedAt" = NOW();

-- 4. If clinic is soft-deleted, restore it
-- UPDATE "Clinic" 
-- SET "deletedAt" = NULL 
-- WHERE subdomain = 'manipal' AND "deletedAt" IS NOT NULL;

