# Operational Protocols & Agent Specifications

## Core Agents

### Researcher Agent (`researcher.js`)
**Objective:** Identify high-potential trending dropshipping products

**Responsibilities:**
- Scan TikTok, Instagram, and trending platforms for "TikTok Made Me Buy It" products
- Cross-reference wholesale pricing via CJ Dropshipping, USA Drop, and similar APIs
- Validate product margins (minimum 3x markup: Cost $5 → Retail $15+)
- Verify weight constraints (< 2 lbs / 900g for efficient shipping)
- Assess viral potential and ad hook viability
- Output results to `trending_products` Supabase table

**Input Sources:**
- Social media trend feeds
- Wholesale supplier APIs
- Product research databases

**Output Format:**
- Table: `trending_products`
- Fields: product_name, estimated_cost, target_retail, margin_percentage, supplier_source, ad_hook_idea, discovered_at

### Hermes Manager Agent (`hermes-manager.js`)
**Objective:** Master orchestration loop managing product workflow

**Responsibilities:**
- Monitor `trending_products` queue for new discoveries
- Validate product data and margins
- Check supplier inventory and reliability
- Calculate shipping costs and logistics
- Delegate work to specialized agents
- Update product status through workflow stages
- Log progress and decisions to `campaign_logs` table
- Coordinate agent execution schedules

**Workflow Stages:**
1. `discovered` - Initial product found by researcher
2. `validating` - Checking margins and suppliers
3. `validated` - Approved for storefront
4. `campaigning` - Generating ad content
5. `syncing` - Being pushed to storefront
6. `live` - Active on storefront
7. `archived` - Removed from rotation

**Decision Logic:**
- Margin validation: `(retail_price - cost) / cost >= 2.0`
- Weight validation: `weight_lbs <= 2.0`
- Supplier check: Verify API connectivity and inventory
- Demand scoring: Assess from social signals and search volume

### Pusher Agent (`pusher.js`)
**Objective:** Synchronize validated products to storefront

**Responsibilities:**
- Read `validated_products` queue from Supabase
- Fetch product images and descriptions
- Format data for storefront platform (Shopify/WooCommerce/custom)
- Update inventory quantities
- Sync pricing and discount info
- Handle product availability status
- Log sync operations to `campaign_logs` table
- Handle sync failures and retry logic

**Output Targets:**
- Shopify: REST API integration
- WooCommerce: REST API integration
- Custom storefronts: Webhook delivery

## Operational Rules

### Database Connections
1. All core logic MUST be in `/agents` folder
2. Database connections MUST use require/import from `db.js`
3. All Supabase queries must use transactions for data consistency
4. Log every operation to `campaign_logs` for audit trail

### API Key Management
1. NEVER hardcode API keys anywhere
2. Use environment variables from `.env` file
3. Load credentials via `dotenv` package
4. Rotate keys regularly and monitor usage

### Process Management
1. PM2 is the source of truth for process health
2. Always check PM2 logs first for troubleshooting
3. Run `pm2 restart all` after any code changes
4. Configure startup scripts to enable auto-restart on server reboot

### Code Quality
1. Write clean, modular, single-responsibility functions
2. Use async/await for all I/O operations
3. Implement proper error handling and logging
4. Keep functions under 50 lines when possible
5. Use meaningful variable and function names

### Monitoring & Alerting
1. All agent actions logged to Supabase
2. Failed operations trigger alerts in campaign logs
3. Email notifications for critical failures
4. Dashboard for agent health and status

## Environment Configuration

### Required .env Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
LOG_LEVEL=info

# Supplier APIs
CJ_DROPSHIPPING_API_KEY=xxx
USA_DROP_API_KEY=xxx

# Shopify Integration (if applicable)
SHOPIFY_STORE_URL=xxx
SHOPIFY_API_KEY=xxx
SHOPIFY_API_PASSWORD=xxx

# Email Notifications
SMTP_HOST=xxx
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASSWORD=xxx
ALERT_EMAIL=xxx@example.com
```

## Scheduling

### Researcher Agent
- Runs every 4 hours to scan for new trends
- On-demand execution available
- Stores results immediately to database

### Hermes Manager
- Runs every 30 minutes for orchestration
- Processes queue in batches
- Validates and stages products

### Pusher Agent
- Runs every 2 hours to sync to storefront
- Handles retries for failed syncs
- Monitors inventory updates

## Health & Monitoring

Use PM2 for process management:
```bash
pm2 start pm2-config.json        # Start all agents
pm2 logs                          # View real-time logs
pm2 status                        # Check process status
pm2 stop all                      # Stop all agents
pm2 restart all                   # Restart after code changes
pm2 delete all                    # Remove from PM2 monitoring
```

## Troubleshooting

**Agent not running:**
1. Check PM2 status: `pm2 status`
2. View logs: `pm2 logs agent-name`
3. Verify environment variables loaded
4. Check Supabase connectivity

**Database connection failing:**
1. Verify SUPABASE_URL and keys in .env
2. Test connection: `node scripts/test-db.js`
3. Check Supabase project status
4. Review network connectivity

**Products not syncing:**
1. Check `validated_products` queue has entries
2. Verify storefront API credentials
3. Review sync logs in `campaign_logs` table
4. Check for API rate limiting issues
