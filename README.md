# Hermes: Autonomous Dropshipping Factory Manager

**Hermes** is an AI-powered autonomous dropshipping system that discovers trending products, validates profitability, and syncs them to storefronts—all without manual intervention.

> "If it can be automated, it must be automated."

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- PM2 for process management (optional but recommended)
- Storefront API credentials (Shopify/WooCommerce/Custom)

### Installation

```bash
# Clone the repository
git clone https://github.com/wise2/dropshipping-factory.git
cd dropshipping-factory

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your Supabase and storefront credentials
nano .env
```

### Running the System

**Development Mode:**
```bash
npm run dev              # Run Hermes Manager with watch mode
npm run research         # Run Researcher agent (scan for trends)
npm run push             # Run Pusher agent (sync to storefront)
```

**Production Mode (with PM2):**
```bash
npm run pm2:start        # Start all agents with PM2
npm run pm2:logs         # View real-time logs
npm run pm2:status       # Check process health
npm run pm2:restart      # Restart after code changes
npm run pm2:stop         # Stop all agents
```

## 🏗️ Architecture

### Three Core Agents

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│ RESEARCHER  │────────▶│ HERMES MGR   │────────▶│  PUSHER    │
│ (Discover)  │         │ (Validate)   │         │  (Sync)    │
└─────────────┘         └──────────────┘         └────────────┘
      │                       │                        │
      │                       │                        │
      ▼                       ▼                        ▼
  TikTok Trends        Product Queue         Shopify/WooCommerce
  Social Media         Margin Check           Storefront Sync
  Trending APIs        Supplier Verify        Inventory Update
```

### Database Schema (Supabase)

**trending_products**
- Discovered by Researcher
- Waiting for validation
- Status: `discovered`, `validated`, `rejected`, `archived`

**validated_products**
- Approved by Hermes Manager
- Ready for storefront sync
- Status: `validated`, `syncing`, `live`, `archived`

**campaign_logs**
- Complete audit trail
- All agent activities logged
- For debugging and monitoring

## 📊 Product Validation Criteria

All products must meet these strict standards:

| Criteria | Minimum | Rationale |
|----------|---------|-----------|
| **Profit Margin** | 200% (3x markup) | Profitability threshold |
| **Product Weight** | < 2 lbs | Efficient global shipping |
| **Viral Score** | 5/10 | Advertising potential |
| **Supplier Reliability** | 95% | Consistent fulfillment |

**Example Calculation:**
```
Cost: $5.00
Retail: $15.00
Profit per unit: $10.00
Margin: ($10 / $5) = 200% ✓ APPROVED

Cost: $5.00
Retail: $12.00
Profit per unit: $7.00
Margin: ($7 / $5) = 140% ✗ REJECTED
```

## ⏰ Operational Schedule

### Researcher Agent
- **Frequency:** Every 4 hours
- **Duration:** ~5 minutes
- **Task:** Scan for trending products

### Hermes Manager
- **Frequency:** Every 30 minutes
- **Duration:** ~2 minutes
- **Task:** Validate and orchestrate workflow

### Pusher Agent
- **Frequency:** Every 2 hours
- **Duration:** ~3 minutes
- **Task:** Sync to storefront

**View Schedule:**
```bash
npm run pm2:logs         # See when each agent runs
```

## 🔧 Configuration

### Environment Variables

```bash
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Storefront (required)
STOREFRONT_TYPE=shopify      # or 'woocommerce'
SHOPIFY_API_KEY=xxx
SHOPIFY_API_PASSWORD=xxx

# Suppliers (optional)
CJ_DROPSHIPPING_API_KEY=xxx
USA_DROP_API_KEY=xxx

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
ALERT_EMAIL=alerts@yourmail.com

# Thresholds (optional, defaults shown)
MIN_MARGIN_RATIO=2.0         # 200% minimum
MAX_PRODUCT_WEIGHT_LBS=2.0   # 2 lbs max
```

### PM2 Configuration

Edit `pm2-config.json` to adjust:
- Cron schedules for agents
- Memory limits
- Log file locations
- Error handling behavior

## 📈 Monitoring

### Real-Time Logs
```bash
pm2 logs                     # All agents
pm2 logs hermes-manager      # Specific agent
pm2 logs --lines 100         # Last 100 lines
```

### Health Dashboard
```bash
pm2 status                   # Process status
pm2 monit                    # Live monitoring (Node.js CPU/Memory)
```

### Database Queries
Check agent activity in Supabase:
```sql
-- Recent agent activities
SELECT * FROM campaign_logs
ORDER BY logged_at DESC
LIMIT 50;

-- Product status breakdown
SELECT status, COUNT(*) as count
FROM trending_products
GROUP BY status;

-- Validation success rate
SELECT
  COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(*) as total
FROM trending_products;
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t hermes-factory .

# Run container
docker run -d \
  --name hermes \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  hermes-factory

# View logs
docker logs -f hermes
```

### Server Deployment (Ubuntu 20.04+)

```bash
# SSH into server
ssh ubuntu@your-server

# Clone repo
git clone https://github.com/wise2/dropshipping-factory.git
cd dropshipping-factory

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with credentials
nano .env

# Start with PM2
npm run pm2:start
pm2 save
pm2 startup

# Verify running
pm2 status
```

## 🔍 Troubleshooting

### Agent not starting?
```bash
# Check logs
pm2 logs

# Verify environment variables
cat .env | grep SUPABASE

# Test database connection
node -e "
  import('./agents/db.js').then(m => {
    console.log('✓ DB connection OK');
  }).catch(e => console.error(e))
"
```

### Products not syncing?
```bash
# Check Supabase for validated products
SELECT * FROM validated_products WHERE status = 'validated' LIMIT 5;

# Check Pusher logs
pm2 logs pusher

# Verify storefront API credentials
echo "SHOPIFY_API_KEY: $SHOPIFY_API_KEY"
```

### High memory usage?
```bash
# Reduce batch size in .env
MIN_BATCH_SIZE=10

# Restart agents
pm2 restart all

# Monitor memory
pm2 monit
```

## 📚 Project Structure

```
dropshipping-factory/
├── agents/
│   ├── researcher.js          # Trend discovery
│   ├── hermes-manager.js      # Orchestration
│   ├── pusher.js              # Storefront sync
│   └── db.js                  # Database module
├── logs/                       # PM2 output logs
├── .env                        # Configuration (not committed)
├── .env.example               # Config template
├── .gitignore
├── package.json
├── pm2-config.json            # PM2 process config
├── CLAUDE.md                  # Project rules
├── AGENTS.md                  # Operational protocols
├── SOUL.md                    # Identity & philosophy
└── README.md                  # This file
```

## 🤖 How It Works

### 1️⃣ Discovery
**Researcher scans trending platforms:**
- TikTok trending sounds and hashtags
- Instagram Reels viral products
- Google Trends emerging searches
- Supplier bestseller lists

**Output:** Top 3-5 trending products with profit estimates

### 2️⃣ Validation
**Hermes Manager evaluates each product:**
- ✓ Margin calculation (minimum 200%)
- ✓ Weight verification (< 2 lbs)
- ✓ Supplier reliability check
- ✓ Market demand assessment
- ✓ Scoring and ranking

**Output:** Validated products ready for storefront

### 3️⃣ Campaign
**Researcher generates ad content:**
- TikTok hook variations
- Instagram Reels scripts
- YouTube Shorts concepts
- Email product descriptions

### 4️⃣ Sync
**Pusher uploads to storefront:**
- Create product listings
- Upload images
- Set pricing and inventory
- Configure fulfillment
- Enable buying

**Output:** Live products on storefront

## 🎯 Key Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Time to Market | < 48 hours | 🟢 |
| Margin Achievement | ≥ 200% | 🟢 |
| Supplier Reliability | ≥ 95% | 🟡 |
| Automation Rate | ≥ 95% | 🟢 |
| Agent Uptime | ≥ 99.5% | 🔧 |

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Local Development
```bash
# Watch mode with auto-reload
npm run dev

# Run individual agent
node agents/researcher.js
```

### Contributing
1. Create feature branch: `git checkout -b feature/xyz`
2. Commit changes: `git commit -m "Add feature xyz"`
3. Push to GitHub: `git push origin feature/xyz`
4. Create Pull Request

## 📝 License

MIT License - feel free to use and modify

## 🤝 Support

For issues, questions, or feedback:
- GitHub Issues: https://github.com/wise2/dropshipping-factory/issues
- Email: support@dropshipping-factory.dev

---

**Built by** [WISE² Inc.](https://wise2.net)  
**Managed by** Hermes - The Autonomous Dropshipping Factory Manager  
**Last Updated** July 2026
