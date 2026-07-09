# Supabase Setup Guide for Hermes Dropshipping Factory

This guide walks you through setting up Supabase for the Dropshipping Factory in 5 minutes.

## 📋 Prerequisites

- GitHub account (optional but recommended for Supabase)
- Access to Supabase dashboard
- Factory `.env` file ready to update

## 🚀 Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name:** `hermes-dropshipping` (or similar)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Select closest to your server (US East 1 recommended)
5. Click **"Create new project"**
6. Wait for database to initialize (2-3 minutes)

## 🔑 Step 2: Get API Credentials

Once your project is ready:

1. Go to **Settings** (bottom left sidebar)
2. Click **"API"**
3. Copy and save:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

**Example:**
```
SUPABASE_URL=https://zyxwvutsrqpo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

## 📊 Step 3: Create Database Schema

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for all tables to be created (should see ✓ checkmarks)

**What was created:**
- ✅ `trending_products` - Discovered products
- ✅ `validated_products` - Approved products
- ✅ `campaign_logs` - Activity audit trail
- ✅ `agent_health` - Agent performance tracking
- ✅ `supplier_inventory` - Supplier data
- ✅ `storefront_sync_status` - Sync tracking
- ✅ 2 views for analysis

## 🔐 Step 4: Configure .env File

1. In your factory directory, copy credentials:
```bash
cp .env.example .env
```

2. Edit `.env` and update:
```bash
# Supabase (REQUIRED)
SUPABASE_URL=https://zyxwvutsrqpo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# Environment
NODE_ENV=production

# Storefront Configuration
STOREFRONT_TYPE=shopify
# OR set to 'woocommerce' if using WooCommerce

# Shopify (if using Shopify)
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_PASSWORD=your_api_password

# Keep the rest as defaults for now
```

3. Save the file

## 🧪 Step 5: Test Connection

Run a quick connection test:

```bash
# Install dependencies first if you haven't
npm install

# Test database connection
node -e "
import('./agents/db.js').then(async (m) => {
  const { db } = m;
  try {
    const products = await db.getTrendingProducts(1);
    console.log('✅ Database connected successfully!');
    console.log('Sample products:', products);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
});
"
```

**Expected output:**
```
✅ Database connected successfully!
Sample products: [ { id: '...', product_name: 'Smart Plant...', ... } ]
```

## 🚀 Step 6: Deploy Factory

Now that Supabase is configured, start the factory:

### Option A: Local Testing
```bash
npm run research          # Run researcher agent once
npm run dev              # Run Hermes Manager in watch mode
```

### Option B: Production with Docker
```bash
docker-compose up -d     # Start all services

# Monitor logs
docker logs -f hermes-dropshipping-factory

# Check status
docker ps | grep hermes
```

### Option C: Production with PM2
```bash
npm install -g pm2       # Install PM2 globally if needed
npm run pm2:start        # Start all agents
npm run pm2:logs         # View logs
pm2 save                 # Enable auto-start on reboot
pm2 startup              # Configure auto-start
```

## 📊 Verify It's Working

### Check in Supabase Dashboard

1. Go to **"SQL Editor"**
2. Run these queries to verify:

```sql
-- Check trending products
SELECT COUNT(*) as total_products FROM trending_products;

-- Check recent logs
SELECT * FROM campaign_logs 
ORDER BY logged_at DESC 
LIMIT 10;

-- Check agent health
SELECT * FROM agent_health;
```

### Monitor Agent Activity

```bash
# View real-time logs
npm run pm2:logs

# Or if using Docker
docker logs -f hermes-dropshipping-factory

# Watch for these messages:
# ✓ Researcher Agent Ready
# 🤖 Hermes Manager Online
# ✓ Pusher Agent Ready
```

## 🔍 Troubleshooting

### Connection Error: "Missing SUPABASE_URL"
**Fix:** Make sure .env file has:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

### "Table does not exist" Error
**Fix:** 
1. Run the SQL schema again: Go to SQL Editor → Paste schema.sql → Run
2. Verify all tables: Table Editor → Should show 6 tables

### "Authentication failed" Error
**Fix:**
1. Check your SUPABASE_ANON_KEY is correct (copy from Settings → API)
2. Make sure it's not truncated in .env file
3. Test by curl-ing the API:
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/trending_products?limit=1"
```

### Empty results from queries
**Fix:** 
1. Make sure the researcher agent has run: `npm run research`
2. Check campaign_logs to see if there were any errors
3. Verify with: `SELECT * FROM trending_products;` in SQL Editor

## 📈 Next Steps

Once Supabase is working:

1. **Configure Storefront Integration**
   - For Shopify: Add API credentials to .env
   - For WooCommerce: Add store URL and credentials

2. **Set Up Email Alerts** (optional)
   - Add SMTP configuration to .env
   - Agents will email on errors

3. **Monitor Performance**
   - Dashboard: `agent_performance_summary` view
   - Check: `agent_health` table for uptime metrics

4. **Scale Up**
   - Add multiple regions to Supabase
   - Set up read replicas for performance
   - Configure backup strategy

## 🎯 Architecture After Setup

```
Hermes Factory
    ↓
[Researcher Agent] ──→ [Trending Products Table]
    ↓
[Hermes Manager] ──→ [Validated Products Table]
    ↓
[Pusher Agent] ──→ [Storefront Sync Table]
    ↓
[Audit Logs] ──→ [Campaign Logs Table]

All powered by Supabase PostgreSQL
```

## 📚 Useful Supabase Resources

- **Supabase Dashboard:** https://app.supabase.com
- **API Reference:** https://supabase.com/docs/reference/javascript/introduction
- **SQL Guide:** https://supabase.com/docs/guides/database
- **Authentication:** https://supabase.com/docs/guides/auth

## ✅ Checklist

- [ ] Supabase project created
- [ ] API credentials copied to .env
- [ ] Database schema initialized (all 6 tables)
- [ ] Connection test passed (`✅ Database connected`)
- [ ] Agents running and creating log entries
- [ ] Sample product visible in `trending_products` table
- [ ] Status check shows agent health

**Once all boxes are checked, your Hermes Factory is production-ready!** 🚀

---

**Setup Time:** ~5 minutes  
**Monthly Cost:** Free tier includes up to 500MB database  
**Support:** Supabase docs + Factory README.md
