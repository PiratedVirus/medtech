# Vercel Domain Configuration for Wildcard Subdomains

## ⚠️ CRITICAL REQUIREMENT

**For wildcard domains (`*.carediabetics.in`), Vercel REQUIRES nameserver delegation.**

> "If using your custom domain as a wildcard domain, you **must** use the **nameservers method** for verification."

**CNAME records will NOT work for wildcard domains** - you must delegate nameservers to Vercel.

## Problem
- DNS correctly resolves: `manipal.carediabetics.in` → `cname.vercel-dns.com` ✅
- Vercel shows "Invalid Configuration" for `*.carediabetics.in` ⚠️
- Visiting `manipal.carediabetics.in` returns `DEPLOYMENT_NOT_FOUND` ❌

## Root Cause
1. **Wildcard domains require nameserver delegation** - CNAME records are not supported
2. Current setup uses CNAME at GoDaddy, which won't work for wildcard verification
3. Vercel needs to manage DNS to issue wildcard SSL certificates

## Solution: Delegate Nameservers to Vercel

### Step 1: Add Domains to Vercel (Dev Project)

1. Go to your **dev** Vercel project (the one using `carediabetics.in`)
2. Navigate to **Settings** → **Domains**
3. Add the root domain: `carediabetics.in`
   - Assign to **Production** environment
4. Add the wildcard domain: `*.carediabetics.in`
   - Assign to **Production** environment
5. Vercel will show nameservers needed:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

### Step 2: Change Nameservers at GoDaddy

**Important:** This will transfer DNS management to Vercel. All existing DNS records at GoDaddy will be replaced.

#### Method 1: Via GoDaddy Domain Settings (Recommended)

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account

2. **Navigate to Domain Management**
   - Go to **My Products** → **Domains**
   - Find `carediabetics.in` and click on it
   - Click **DNS** or **Manage DNS**

3. **Change Nameservers**
   - Scroll down to find **Nameservers** section
   - Click **Change** button
   - Select **Custom** (not "Default" or "GoDaddy")
   - Enter the following nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Click **Save** or **Update**

4. **Confirm Changes**
   - GoDaddy may ask for confirmation
   - Confirm the nameserver change
   - Note: This can take 24-48 hours to propagate globally

#### Method 2: Via GoDaddy Domain Settings (Alternative Path)

If you can't find the Nameservers section:

1. Go to **My Products** → **Domains**
2. Click the **⋮** (three dots) menu next to `carediabetics.in`
3. Select **Manage DNS**
4. Look for **Nameservers** section (usually at the top)
5. Click **Change**
6. Select **Custom** and enter:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
7. Save changes

### Step 3: Wait for DNS Propagation

1. **Nameserver changes take time:**
   - Usually 1-4 hours, but can take up to 48 hours
   - Check propagation: https://www.whatsmydns.net/#NS/carediabetics.in

2. **Verify nameservers are updated:**
   ```bash
   # Check current nameservers
   nslookup -type=NS carediabetics.in
   
   # Should show:
   # ns1.vercel-dns.com
   # ns2.vercel-dns.com
   ```

### Step 4: Verify Domain in Vercel

1. **Go back to Vercel Dashboard**
   - Navigate to **Settings** → **Domains**
   - Click **Refresh** button next to `*.carediabetics.in`
   - Wait 5-10 minutes after nameserver change

2. **Check Status:**
   - Both `carediabetics.in` and `*.carediabetics.in` should show **"Valid Configuration"**
   - If still "Invalid Configuration":
     - Wait longer (nameserver propagation can be slow)
     - Click "Refresh" again
     - Verify nameservers are correct at GoDaddy

### Step 5: Configure DNS Records in Vercel

**After nameservers are delegated, Vercel manages all DNS records.**

1. **Go to Vercel Dashboard** → **Settings** → **Domains**
2. Click on `carediabetics.in` domain
3. You'll see DNS management interface
4. Vercel will automatically create necessary records for your deployment

**Note:** You can add custom DNS records in Vercel if needed (MX records for email, etc.)

### Step 6: Verify Clinic in Database

Ensure the clinic exists in your dev database:

```sql
SELECT id, name, subdomain FROM "Clinic" WHERE LOWER(subdomain) = 'manipal' AND "deletedAt" IS NULL;
```

If missing, create it via the superadmin panel or directly in the database.

## Important Notes

### What Happens When You Delegate Nameservers?

1. **Vercel takes over DNS management:**
   - All DNS records are now managed by Vercel
   - GoDaddy DNS records become inactive
   - You manage DNS through Vercel dashboard

2. **Existing DNS records:**
   - Records at GoDaddy (A, CNAME, MX, etc.) will stop working
   - You'll need to recreate them in Vercel if needed
   - **Important:** If you have email (MX records) or other services, recreate them in Vercel

3. **Benefits:**
   - Automatic wildcard SSL certificates
   - Automatic DNS record creation for deployments
   - Centralized DNS management
   - Better integration with Vercel features

### If You Need to Keep Some DNS Records

If you have critical DNS records (like email MX records):

1. **Before changing nameservers:**
   - Document all existing DNS records at GoDaddy
   - Note any MX, TXT, or other special records

2. **After delegating to Vercel:**
   - Go to Vercel → Settings → Domains → `carediabetics.in`
   - Add back any necessary DNS records (MX for email, etc.)

### Reverting Nameservers (If Needed)

If you need to go back to GoDaddy DNS:

1. Go to GoDaddy → Domain Settings
2. Change nameservers back to **GoDaddy Default**
3. Wait for propagation
4. Recreate DNS records at GoDaddy

## Troubleshooting

### Still Getting DEPLOYMENT_NOT_FOUND?

1. **Check Nameserver Propagation:**
   ```bash
   # Check if nameservers have propagated
   nslookup -type=NS carediabetics.in
   # Should show: ns1.vercel-dns.com and ns2.vercel-dns.com
   
   # Check propagation globally
   # Visit: https://www.whatsmydns.net/#NS/carediabetics.in
   ```

2. **Check Project Assignment:**
   - Ensure `*.carediabetics.in` is added to the **dev** project (not production)
   - Verify it's assigned to **Production** environment

3. **Refresh Domain in Vercel:**
   - Go to Vercel → Settings → Domains
   - Click "Refresh" next to `*.carediabetics.in`
   - Wait 5-10 minutes after nameserver change

4. **Check Vercel Deployment:**
   - Ensure you have a recent deployment in the dev project
   - Check that the deployment is assigned to Production environment

5. **Verify Host Header:**
   - Use debug endpoint: `http://manipal.carediabetics.in/api/debug/clinic-lookup`
   - Should return subdomain extraction and clinic lookup results

### Domain Shows "Invalid Configuration" After Nameserver Change

1. **Wait for Propagation:**
   - Nameserver changes can take 1-48 hours
   - Most changes propagate within 4-6 hours
   - Check: https://www.whatsmydns.net/#NS/carediabetics.in

2. **Verify Nameservers:**
   ```bash
   nslookup -type=NS carediabetics.in
   # Must show: ns1.vercel-dns.com and ns2.vercel-dns.com
   ```

3. **Click Refresh in Vercel:**
   - Go to Vercel → Settings → Domains
   - Click "Refresh" button
   - Wait 5-10 minutes

4. **Double-check GoDaddy:**
   - Verify nameservers are saved correctly in GoDaddy
   - Ensure you selected "Custom" (not "Default")

### Nameservers Not Propagating

1. **Check GoDaddy Settings:**
   - Ensure nameservers are saved (not just entered)
   - Try removing and re-adding nameservers
   - Clear browser cache and try again

2. **Wait Longer:**
   - Some regions take longer to update
   - Check propagation status: https://www.whatsmydns.net/#NS/carediabetics.in

3. **Contact Support:**
   - If 48+ hours and still not working, contact GoDaddy support
   - Verify domain is not locked or has restrictions

## Expected Final Configuration

### Vercel Dashboard:
- `carediabetics.in` → Valid Configuration (Production)
- `*.carediabetics.in` → Valid Configuration (Production)

### GoDaddy Nameservers:
- Nameserver 1: `ns1.vercel-dns.com`
- Nameserver 2: `ns2.vercel-dns.com`
- **Note:** DNS records are now managed in Vercel, not GoDaddy

### Vercel DNS Management:
- All DNS records managed through Vercel dashboard
- Automatic wildcard SSL certificates
- Automatic DNS record creation for deployments

### Test Results:
```bash
# Check nameservers
nslookup -type=NS carediabetics.in
# Should show: ns1.vercel-dns.com, ns2.vercel-dns.com

# Check subdomain resolution
nslookup manipal.carediabetics.in
# Should resolve to Vercel deployment

# Test website
curl -I http://manipal.carediabetics.in/
# Should return 200 OK (not 404)
```

## Quick Reference: GoDaddy Nameserver Change Steps

1. GoDaddy → My Products → Domains
2. Click `carediabetics.in` → DNS / Manage DNS
3. Find "Nameservers" section → Click "Change"
4. Select "Custom"
5. Enter:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
6. Save
7. Wait 1-48 hours for propagation
8. Refresh in Vercel dashboard

