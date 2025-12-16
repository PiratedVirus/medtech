# How to Change Nameservers in GoDaddy for Vercel Wildcard Domain

## Quick Steps

### Step 1: Access GoDaddy Domain Management

1. Go to **https://www.godaddy.com** and sign in
2. Click **My Products** (top menu or dashboard)
3. Find **Domains** section
4. Locate `carediabetics.in` in your domain list

### Step 2: Open DNS Management

**Option A: Direct DNS Access**
- Click on the domain name `carediabetics.in`
- Click **DNS** tab or **Manage DNS** button

**Option B: Via Menu**
- Click the **⋮** (three dots) menu next to the domain
- Select **Manage DNS**

### Step 3: Change Nameservers

1. Scroll down to find the **Nameservers** section
   - Usually located at the top of the DNS management page
   - May be in a separate section from DNS records

2. Click the **Change** button next to Nameservers

3. Select **Custom** option
   - **NOT** "Default" or "GoDaddy"
   - You need to select "Custom" to enter your own nameservers

4. Enter Vercel's nameservers:
   ```
   Nameserver 1: ns1.vercel-dns.com
   Nameserver 2: ns2.vercel-dns.com
   ```
   
   **Important:** 
   - Enter exactly as shown (no trailing dots)
   - You typically only need 2 nameservers
   - Some interfaces may show 4 fields - leave extras empty or duplicate

5. Click **Save** or **Update**

6. **Confirm the change** if prompted
   - GoDaddy may show a warning about DNS management transfer
   - This is expected - click **Confirm** or **Yes**

### Step 4: Verify Nameservers Are Saved

1. Go back to the Nameservers section
2. You should see:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. Status should show as "Active" or "Custom"

### Step 5: Wait for Propagation

- **Time:** 1-48 hours (usually 1-4 hours)
- **Check status:** https://www.whatsmydns.net/#NS/carediabetics.in
- **Command line check:**
  ```bash
  nslookup -type=NS carediabetics.in
  ```

## Visual Guide (What You'll See)

### Before Change:
```
Nameservers: [Change]
  ns49.domaincontrol.com
  ns50.domaincontrol.com
```

### After Change:
```
Nameservers: [Change]
  ns1.vercel-dns.com
  ns2.vercel-dns.com
```

## Important Notes

### ⚠️ What Happens When You Change Nameservers

1. **DNS Management Transfers to Vercel:**
   - All DNS records at GoDaddy become inactive
   - Vercel now manages all DNS for your domain
   - You'll manage DNS through Vercel dashboard

2. **Existing DNS Records:**
   - Current records (A, CNAME, MX, TXT) will stop working
   - You'll need to recreate them in Vercel if needed
   - **Backup your DNS records** before changing nameservers if you have important ones

3. **Email (MX Records):**
   - If you use email with this domain, you'll need to add MX records in Vercel
   - Document your current MX records before changing nameservers

### ✅ Benefits

- Automatic wildcard SSL certificates
- Automatic DNS record creation
- Better Vercel integration
- Centralized DNS management

## Troubleshooting

### Can't Find Nameservers Section

1. **Try different navigation:**
   - My Products → Domains → [Domain] → DNS
   - My Products → Domains → [⋮ Menu] → Manage DNS

2. **Check domain status:**
   - Domain must be active and unlocked
   - Some domains may have restrictions

3. **Contact GoDaddy Support:**
   - If you can't find the option, contact support
   - They can guide you or make the change for you

### Nameservers Not Saving

1. **Clear browser cache** and try again
2. **Try a different browser**
3. **Check domain lock status:**
   - Domain should be unlocked
   - Some registrars lock domains by default

### Still Showing Old Nameservers After Change

1. **Wait longer** - propagation can take up to 48 hours
2. **Check globally:** https://www.whatsmydns.net/#NS/carediabetics.in
3. **Clear DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

## After Nameserver Change

1. **Go to Vercel Dashboard**
2. **Settings → Domains**
3. **Click "Refresh"** next to `*.carediabetics.in`
4. **Wait 5-10 minutes**
5. **Status should change to "Valid Configuration"**

## Need to Revert?

If you need to go back to GoDaddy DNS:

1. GoDaddy → Domain Settings → Nameservers
2. Select **GoDaddy Default** (or **Default**)
3. Save
4. Wait for propagation
5. Recreate DNS records at GoDaddy

