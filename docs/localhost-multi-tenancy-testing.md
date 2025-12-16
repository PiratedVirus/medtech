# Testing Multi-Tenancy on Localhost

This guide explains how to test the multi-tenancy (subdomain-based clinic isolation) feature on your local development environment.

## Multi-Tenancy Model

**Key Concept**: A patient can register with the **same phone number** in multiple clinics. Each clinic maintains its own separate user record.

- **Patients**: Can have accounts in multiple clinics with the same phone number
- **Staff** (Doctors, Dieticians, etc.): Can only belong to ONE clinic
- **Unique Key**: `phoneNumber + clinicId + deletedAt` (not just phoneNumber)

## Quick Setup

### Step 1: Add Subdomain Entries to /etc/hosts

Open your terminal and edit the hosts file:

```bash
sudo nano /etc/hosts
```

Add these lines (replace `clinic1`, `clinic2` with your actual clinic subdomains):

```
# Multi-tenancy testing
127.0.0.1   clinic1.localhost
127.0.0.1   clinic2.localhost
127.0.0.1   manipal.localhost
127.0.0.1   apollo.localhost
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### Step 2: Run the Multi-Tenancy Migration (First Time Only)

Before testing, run the migration to update the database schema:

```bash
# Option 1: Using Prisma (recommended)
npx prisma db push

# Option 2: Run the SQL migration directly
psql $DATABASE_URL -f scripts/migrate-multi-tenancy.sql
```

This changes the unique constraint to allow same phone numbers in different clinics.

### Step 3: Ensure Clinics Exist in Database

Run this SQL to check your clinics and their subdomains:

```sql
SELECT id, name, subdomain FROM "Clinic" WHERE "deletedAt" IS NULL;
```

If you need to add/update subdomains:

```sql
-- Update existing clinic with subdomain
UPDATE "Clinic" SET subdomain = 'clinic1' WHERE id = 1;
UPDATE "Clinic" SET subdomain = 'clinic2' WHERE id = 2;

-- Or create new clinics
INSERT INTO "Clinic" (name, subdomain, "createdAt", "updatedAt") 
VALUES ('Clinic One', 'clinic1', NOW(), NOW());
```

### Step 4: Start Your Development Server

```bash
npm run dev
```

### Step 5: Access Different Clinic Portals

Now you can access different clinic portals:

- **Clinic 1**: http://clinic1.localhost:3000
- **Clinic 2**: http://clinic2.localhost:3000
- **Main domain** (no tenant): http://localhost:3000

## How It Works

The subdomain extraction logic (`lib/subdomain-utils.ts`) handles:

| URL | Extracted Subdomain |
|-----|---------------------|
| `clinic1.localhost:3000` | `clinic1` |
| `clinic2.localhost:3000` | `clinic2` |
| `localhost:3000` | `null` (no subdomain) |

## Testing Scenarios

### 1. Patient Registration (New Patient)

1. Go to `http://clinic1.localhost:3000/login`
2. Register a new patient with phone `9876543210`
3. Verify the patient is created with `clinicId = 1`

```sql
SELECT id, name, "phoneNumber", "clinicId" FROM "User" WHERE role = 'PATIENT' ORDER BY id DESC LIMIT 5;
```

### 2. Same Phone Number in Multiple Clinics (NEW!)

1. Register a patient on `http://clinic1.localhost:3000` with phone `9876543210`
2. Go to `http://clinic2.localhost:3000/login`
3. Login with the same phone number `9876543210`
4. You should be prompted to **register** (not denied!)
5. Complete registration - a NEW user record is created for clinic 2

```sql
-- Verify: Same phone, different clinics, different user IDs
SELECT id, name, "phoneNumber", "clinicId", role 
FROM "User" 
WHERE "phoneNumber" = '+919876543210' 
AND "deletedAt" IS NULL;
```

**Expected Result**: Two rows with different `id` and `clinicId` values, same phone number.

### 3. Staff Cannot Use Multiple Clinics

1. Create a doctor assigned to clinic 1
2. Login as that doctor on `http://clinic1.localhost:3000` → Should work
3. Try to login on `http://clinic2.localhost:3000` → Should see: **"You are registered as DOCTOR at [clinic name]. Staff accounts cannot be used across multiple clinics."**

### 4. Patient Login to Correct Clinic

1. Register patient in clinic 1
2. Register same phone in clinic 2
3. Login on `http://clinic1.localhost:3000` → Gets clinic 1 data
4. Login on `http://clinic2.localhost:3000` → Gets clinic 2 data

### 5. Admin Portal Isolation

1. Login to admin portal: `http://localhost:3000/admin/login`
2. Admin should only see data from their assigned clinic
3. If admin tries to access a different clinic's subdomain, they should be denied

## Debugging

### Check Subdomain Extraction

Add this to any API route to debug:

```typescript
import { extractSubdomain } from '@/lib/subdomain-utils';

// In your API route
const hostname = request.headers.get('host') || '';
const subdomain = extractSubdomain(hostname);
console.log('Hostname:', hostname, 'Subdomain:', subdomain);
```

### Check Clinic Lookup

```typescript
import { getClinicIdFromSubdomain } from '@/lib/clinic-auth';

const clinicId = await getClinicIdFromSubdomain('clinic1');
console.log('Clinic ID for clinic1:', clinicId);
```

### Common Issues

1. **"Clinic not found"**: Make sure the clinic exists in the database with the exact subdomain (case-insensitive)

2. **Subdomain not detected**: Check that you added the entry to `/etc/hosts` correctly

3. **Browser caching**: Clear cookies/cache when switching between subdomains

4. **Port issues**: Make sure you're using the correct port (default: 3000)

## Option 2: Using lvh.me (No /etc/hosts needed)

`lvh.me` is a domain that always resolves to `127.0.0.1`. You can use it without modifying `/etc/hosts`:

```
http://clinic1.lvh.me:3000
http://clinic2.lvh.me:3000
```

However, you'll need to update `subdomain-utils.ts` to handle this:

```typescript
// Add to extractSubdomain function
if (parts.length === 3 && parts[1] === 'lvh' && parts[2] === 'me') {
  return parts[0].toLowerCase();
}
```

## Verifying Multi-Tenancy Works

Run this query to verify data isolation:

```sql
-- Check users per clinic
SELECT 
  c.name as clinic_name, 
  c.subdomain,
  COUNT(u.id) as user_count 
FROM "Clinic" c 
LEFT JOIN "User" u ON u."clinicId" = c.id 
WHERE c."deletedAt" IS NULL 
GROUP BY c.id, c.name, c.subdomain;

-- Check if any users have mismatched clinic access
SELECT 
  u.id, 
  u.name, 
  u.role, 
  u."clinicId",
  c.subdomain
FROM "User" u
LEFT JOIN "Clinic" c ON u."clinicId" = c.id
WHERE u."deletedAt" IS NULL
ORDER BY u."clinicId", u.role;
```
