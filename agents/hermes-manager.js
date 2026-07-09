import db from './db.js';
import cron from 'node-cron';

class HermesManager {
  constructor() {
    this.name = 'HermesManager';
    this.minMargin = 2.0; // 200% minimum margin
    this.maxWeight = 2.0; // 2 lbs maximum
  }

  async initialize() {
    await db.logCampaignActivity(this.name, 'INIT', 'Hermes Manager initialized');
    console.log('🤖 Hermes Manager Online');
    console.log('   Monitoring product queue...');
    console.log('   Orchestrating agent workflows...');
    console.log('   Standing by for strategic decisions');
  }

  validateProductMetrics(product) {
    const marginRatio = (product.target_retail - product.estimated_cost) / product.estimated_cost;
    const hasValidMargin = marginRatio >= this.minMargin;
    const hasValidWeight = product.weight_lbs <= this.maxWeight;

    return {
      valid: hasValidMargin && hasValidWeight,
      marginRatio,
      marginPercentage: (marginRatio * 100).toFixed(1),
      meetsMargin: hasValidMargin,
      meetsWeight: hasValidWeight
    };
  }

  calculateProductScore(product, metrics) {
    let score = 0;

    // Margin score (40% weight)
    const marginScore = Math.min((metrics.marginRatio / 3) * 100, 100); // 3x = 100%
    score += marginScore * 0.4;

    // Viral score (30% weight)
    const viralScore = (product.viral_score || 5) * 10; // Out of 10
    score += viralScore * 0.3;

    // Weight efficiency (20% weight)
    const weightScore = ((2.0 - product.weight_lbs) / 2.0) * 100;
    score += weightScore * 0.2;

    // Ad hook quality (10% weight)
    const adHookScore = (product.ad_hook_idea?.length || 0) > 20 ? 90 : 70;
    score += adHookScore * 0.1;

    return score.toFixed(1);
  }

  async processProductQueue() {
    try {
      console.log('\n📋 Processing product queue...');

      const trendingProducts = await db.getTrendingProducts();

      if (trendingProducts.length === 0) {
        console.log('   Queue is empty - researcher should scan for trends');
        return { processed: 0, validated: 0 };
      }

      console.log(`   Found ${trendingProducts.length} products in queue`);

      let validated = 0;
      const decisions = [];

      for (const product of trendingProducts) {
        const metrics = this.validateProductMetrics(product);
        const score = this.calculateProductScore(product, metrics);

        const decision = {
          product: product.product_name,
          margin: `${metrics.marginPercentage}%`,
          weight: `${product.weight_lbs} lbs`,
          score: score,
          valid: metrics.valid,
          action: metrics.valid ? 'VALIDATE' : 'REJECT'
        };

        decisions.push(decision);

        if (metrics.valid) {
          // Move to validated queue
          await db.updateProductStatus(product.id, 'validated');
          console.log(`   ✓ VALIDATED: ${product.product_name} (Score: ${score}, Margin: ${metrics.marginPercentage}%)`);
          validated++;
        } else {
          // Reject with reason
          const reason = !metrics.meetsMargin
            ? `Margin too low (${metrics.marginPercentage}%)`
            : `Weight too heavy (${product.weight_lbs} lbs)`;

          await db.updateProductStatus(product.id, 'rejected');
          console.log(`   ✗ REJECTED: ${product.product_name} - ${reason}`);
        }
      }

      // Log batch processing
      await db.logCampaignActivity(this.name, 'QUEUE_PROCESSED', {
        total_processed: trendingProducts.length,
        validated,
        decisions
      });

      return { processed: trendingProducts.length, validated };
    } catch (error) {
      console.error('❌ Queue processing failed:', error.message);
      await db.logCampaignActivity(this.name, 'ERROR', {
        action: 'QUEUE_PROCESSING',
        error: error.message
      });
      throw error;
    }
  }

  async monitorAgentHealth() {
    try {
      console.log('\n🏥 Checking agent health...');

      const researcherLogs = await db.getAgentHealth('Researcher');
      const pusherLogs = await db.getAgentHealth('Pusher');

      const lastResearcher = researcherLogs?.[0]?.logged_at;
      const lastPusher = pusherLogs?.[0]?.logged_at;

      console.log(`   Researcher: Last activity ${lastResearcher ? '(active)' : '(idle)'}`);
      console.log(`   Pusher: Last activity ${lastPusher ? '(active)' : '(idle)'}`);

      await db.logCampaignActivity(this.name, 'HEALTH_CHECK', {
        researcher_active: !!lastResearcher,
        pusher_active: !!lastPusher,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }

  async orchestrationCycle() {
    try {
      console.log('\n🔄 ORCHESTRATION CYCLE');
      console.log('═'.repeat(50));

      // Process the product queue
      const { processed, validated } = await this.processProductQueue();

      // Monitor agent health
      await this.monitorAgentHealth();

      // Log cycle completion
      await db.logCampaignActivity(this.name, 'ORCHESTRATION_CYCLE', {
        products_processed: processed,
        products_validated: validated,
        timestamp: new Date().toISOString()
      });

      console.log('\n✅ Orchestration cycle complete');
      console.log('═'.repeat(50));
    } catch (error) {
      console.error('Orchestration cycle failed:', error);
    }
  }

  async run() {
    try {
      await this.initialize();

      // Run initial orchestration cycle
      await this.orchestrationCycle();

      // Schedule recurring orchestration (every 30 minutes)
      console.log('\n⏰ Scheduling orchestration cycles...');
      cron.schedule('*/30 * * * *', () => {
        this.orchestrationCycle();
      });

      console.log('✓ Hermes Manager is running and monitoring...\n');

      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Hermes Manager shutting down gracefully...');
        process.exit(0);
      });
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  }
}

// Execute if run directly
const hermes = new HermesManager();
hermes.run();

export default HermesManager;
