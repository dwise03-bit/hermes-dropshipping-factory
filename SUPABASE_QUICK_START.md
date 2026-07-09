# Supabase Quick Start (5 Minutes)

## 🚀 Get Your Factory Running in 5 Steps

### Step 1️⃣ Create Supabase Project (2 min)
```
Go to: https://supabase.com
→ Click "New Project"
→ Choose project name: hermes-dropshipping
→ Pick region (US East recommended)
→ Set database password (save it!)
→ Wait for initialization...
```

### Step 2️⃣ Copy API Keys (1 min)
```
In Supabase Dashboard:
→ Settings → API
→ Copy these values:

SUPABASE_URL = Project URL
SUPABASE_ANON_KEY = anon/public key
SUPABASE_SERVICE_ROLE_KEY = service_role key
```

### Step 3️⃣ Initialize Database (1 min)
```
In Supabase Dashboard:
→ SQL Editor → New Query
→ Copy contents of: supabase/schema.sql
→ Paste into editor
→ Click Run
→ Wait for ✓ success
```

**Creates:**
- ✅ 6 database tables
- ✅ Indexes for performance
- ✅ Row-level security
- ✅ Sample data

### Step 4️⃣ Configure .env (1 min)
```bash
# In your factory directory:
cp .env.example .env

# Edit .env with your Supabase credentials:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Save file
```

### Step 5️⃣ Test Connection (1 min)
```bash
npm install                      # Install dependencies
npm run test:supabase            # Run connection test

# Expected output:
# ✅ Connection successful
# ✅ Schema verified
# ✅ Write access confirmed
# 🚀 Ready to deploy!
```

---

## 🎯 Done! Your Factory is Ready

```bash
# Option A: Start research
npm run research

# Option B: Start with PM2 (production)
npm run pm2:start
npm run pm2:logs

# Option C: Start with Docker
docker-compose up -d
docker logs -f hermes-dropshipping-factory
```

---

## 📊 View Your Data in Supabase

**Check Products:**
```
Dashboard → Table Editor → trending_products
```

**Monitor Activities:**
```
Dashboard → Table Editor → campaign_logs
```

**View Agent Health:**
```
Dashboard → Table Editor → agent_health
```

---

## ❓ Stuck?

**Connection failing?**
- Check .env has correct URL and keys
- Verify keys are NOT truncated
- Try: `npm run test:supabase`

**Tables missing?**
- Go to SQL Editor
- Copy contents of `supabase/schema.sql`
- Click Run

**Still stuck?**
- Read: `supabase/SETUP.md` (detailed guide)
- Check: https://supabase.com/docs
- Ask: GitHub Issues on repository

---

**⏱️ Total Time: ~5 minutes**  
**Cost: FREE (includes 500MB database)**  
**Status: 🟢 Production Ready**

🚀 **Launch your factory now!**
