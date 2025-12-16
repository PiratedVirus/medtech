# Troubleshooting: Clinic Not Found Error

## Problem
Domain loads successfully (`https://manipal.carediabetics.in/`), but shows "Clinic Not Found" error even though the clinic exists in the database.

## Quick Diagnosis Steps

### Step 1: Test Debug Endpoint

Visit the debug endpoint to see what's happening:

```
https://manipal.carediabetics.in/api/debug/clinic-lookup
```

This will show:
- Extracted subdomain from hostname
- Exact match attempt
- Case-insensitive match attempt
- All clinics in database
- Database connection status

**Expected Output:**
```json
{
  "searchedSubdomain": "manipal",
  "hostname": "manipal.carediabetics.in",
  "exactMatch": { "id": 9, "name": "Manipal Hospitals", "subdomain": "manipal" },
  "caseInsensitiveMatch": { "id": 9, "name": "Manipal Hospitals", "subdomain": "manipal" },
  "allClinics": [...],
  "totalClinics": 6
}
```

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Look for logs containing `[Clinic Lookup]`

**What to look for:**
- `[Clinic Lookup] Subdomain "manipal" not found in database`
- `[Clinic Lookup] Available subdomains: [...]`
- `[Clinic Lookup] Database URL: SET` or `NOT SET`
- Any error messages

### Step 3: Verify Database Connection

**Check Environment Variables in Vercel:**

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set correctly
3. Verify `DIRECT_URL` is set (if using connection pooling)
4. **Important:** Ensure these are set for the **Production** environment

**Common Issues:**
- `DATABASE_URL` points to wrong database (dev vs prod)
- `DATABASE_URL` missing or incorrect
- Database credentials expired or incorrect

### Step 4: Verify Clinic in Database

**Check if clinic exists with correct subdomain:**

```sql
-- Check exact subdomain
SELECT id, name, subdomain, "deletedAt" 
FROM "Clinic" 
WHERE subdomain = 'manipal';

-- Check case-insensitive
SELECT id, name, subdomain, "deletedAt" 
FROM "Clinic" 
WHERE LOWER(subdomain) = LOWER('manipal');

-- Check all clinics with subdomains
SELECT id, name, subdomain, "deletedAt" 
FROM "Clinic" 
WHERE subdomain IS NOT NULL 
AND "deletedAt" IS NULL;
```

**Common Issues:**
- Subdomain has extra spaces: `"manipal "` instead of `"manipal"`
- Subdomain is null
- Clinic has `deletedAt` set (soft-deleted)
- Subdomain is different case (though code handles this)

### Step 5: Check Subdomain Extraction

The middleware extracts subdomain from hostname. Test extraction:

**Visit:** `https://manipal.carediabetics.in/api/debug/clinic-lookup`

Check the `searchedSubdomain` field - it should be exactly `"manipal"` (lowercase, no spaces).

**Common Issues:**
- Hostname header not being passed correctly
- Subdomain extraction logic failing
- HTTPS redirect issues

## Common Causes & Solutions

### Cause 1: Wrong Database Environment

**Symptom:** Clinic exists in local database but not in Vercel's database

**Solution:**
1. Check which database Vercel is connecting to
2. Verify `DATABASE_URL` in Vercel environment variables
3. Ensure clinic exists in the **production** database (not just dev)

**Fix:**
- Update `DATABASE_URL` in Vercel to point to correct database
- Or create the clinic in the production database

### Cause 2: Database Connection Failure

**Symptom:** Logs show database errors or connection timeouts

**Solution:**
1. Check database is accessible from Vercel
2. Verify database credentials
3. Check if database allows connections from Vercel IPs
4. If using connection pooling, verify `DIRECT_URL` is set

**Fix:**
- Update database firewall rules
- Regenerate database credentials
- Verify connection string format

### Cause 3: Subdomain Mismatch

**Symptom:** Clinic exists but subdomain doesn't match exactly

**Solution:**
1. Check subdomain in database (no spaces, correct case)
2. Verify subdomain extraction from hostname
3. Check for hidden characters

**Fix:**
```sql
-- Update subdomain to exact match
UPDATE "Clinic" 
SET subdomain = TRIM(LOWER('manipal'))
WHERE id = 9;
```

### Cause 4: Soft-Deleted Clinic

**Symptom:** Clinic exists but has `deletedAt` set

**Solution:**
```sql
-- Check if clinic is soft-deleted
SELECT id, name, subdomain, "deletedAt" 
FROM "Clinic" 
WHERE subdomain = 'manipal';

-- If deletedAt is not null, restore it
UPDATE "Clinic" 
SET "deletedAt" = NULL 
WHERE subdomain = 'manipal';
```

### Cause 5: Cache Issues

**Symptom:** Clinic was just created but not found

**Solution:**
- Clinic lookup uses 5-minute cache
- Wait 5 minutes or restart Vercel deployment
- Cache is in-memory, so deployment restart clears it

## Step-by-Step Fix

### If Clinic Doesn't Exist in Production Database:

1. **Connect to production database**
2. **Create or verify clinic:**
   ```sql
   INSERT INTO "Clinic" (name, subdomain, "createdAt", "updatedAt")
   VALUES ('Manipal Hospitals', 'manipal', NOW(), NOW())
   ON CONFLICT (subdomain) DO NOTHING;
   ```

### If Database Connection is Wrong:

1. **Go to Vercel Dashboard** → Project → Settings → Environment Variables
2. **Check `DATABASE_URL`:**
   - Should point to production database
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
3. **Update if incorrect**
4. **Redeploy** (or wait for auto-redeploy)

### If Subdomain Has Issues:

1. **Check exact subdomain in database:**
   ```sql
   SELECT id, name, subdomain, LENGTH(subdomain) as len
   FROM "Clinic" 
   WHERE id = 9;
   ```

2. **Fix if needed:**
   ```sql
   UPDATE "Clinic" 
   SET subdomain = TRIM(LOWER('manipal'))
   WHERE id = 9;
   ```

## Verification

After fixing, verify:

1. **Debug endpoint works:**
   ```
   https://manipal.carediabetics.in/api/debug/clinic-lookup
   ```
   Should show clinic found

2. **Website loads:**
   ```
   https://manipal.carediabetics.in/
   ```
   Should show login/home page (not clinic-not-found)

3. **Check Vercel logs:**
   Should see: `[Clinic Lookup] Found clinic ID 9 for subdomain "manipal"`

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Look for detailed error messages
   - Check database connection errors
   - Verify environment variables

2. **Test Database Connection:**
   ```sql
   -- Run this in your database to verify clinic exists
   SELECT * FROM "Clinic" WHERE subdomain = 'manipal' AND "deletedAt" IS NULL;
   ```

3. **Compare Environments:**
   - Does it work locally? (`localhost:3000`)
   - Does it work in preview deployment?
   - Only fails in production?

4. **Check Middleware Execution:**
   - Verify middleware is running
   - Check if subdomain extraction works
   - Verify clinic lookup is being called

