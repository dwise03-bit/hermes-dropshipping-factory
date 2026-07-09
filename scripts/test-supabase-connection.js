#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Verifies database connectivity and schema setup
 * Run: node scripts/test-supabase-connection.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('\n🧪 Hermes Factory - Supabase Connection Test\n');
console.log('═'.repeat(60));

// Validation
if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL in .env file');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  URL: ${SUPABASE_URL.substring(0, 40)}...`);
console.log(`  Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log('');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔗 Testing database connection...');

  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from('campaign_logs')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      console.error(`   Details: ${error.details}`);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error(`❌ Error during connection test: ${err.message}`);
    return false;
  }
}

async function testTables() {
  console.log('\n📊 Checking database schema...\n');

  const tables = [
    'trending_products',
    'validated_products',
    'campaign_logs',
    'agent_health',
    'supplier_inventory',
    'storefront_sync_status'
  ];

  let tablesFound = 0;
  let tablesMissing = 0;

  for (const tableName of tables) {
    try {
      const { data, error, status } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });

      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table missing: ${tableName}`);
        tablesMissing++;
      } else if (error) {
        console.log(`⚠️  Cannot verify ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table exists: ${tableName}`);
        tablesFound++;
      }
    } catch (err) {
      console.log(`⚠️  Error checking ${tableName}: ${err.message}`);
    }
  }

  console.log(`\nSchema Status: ${tablesFound}/${tables.length} tables found`);

  if (tablesMissing > 0) {
    console.log(`\n⚠️  ${tablesMissing} tables missing!`);
    console.log('   Run the SQL schema: supabase/schema.sql');
    return false;
  }

  return tablesFound === tables.length;
}

async function testSampleData() {
  console.log('\n📦 Checking sample data...\n');

  try {
    const { data, error, count } = await supabase
      .from('trending_products')
      .select('id, product_name, margin_percentage', { count: 'exact' });

    if (error) {
      console.log(`⚠️  Cannot read trending_products: ${error.message}`);
      return false;
    }

    if (count === 0) {
      console.log('ℹ️  No products in database (expected for new setup)');
      console.log('   Run: npm run research');
      return true;
    }

    console.log(`✅ Found ${count} products in database`);
    if (data && data.length > 0) {
      console.log(`   First product: ${data[0].product_name}`);
      console.log(`   Margin: ${data[0].margin_percentage}%`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Error reading products: ${err.message}`);
    return false;
  }
}

async function testAgentHealth() {
  console.log('\n🏥 Checking agent health...\n');

  try {
    const { data, error } = await supabase
      .from('agent_health')
      .select('*');

    if (error) {
      console.log(`⚠️  Cannot read agent_health: ${error.message}`);
      return true; // Not critical
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  No agent health records yet (expected on first run)');
      return true;
    }

    console.log(`✅ Found ${data.length} agent health records`);
    for (const agent of data) {
      console.log(
        `   ${agent.agent_name}: ${agent.status} | ` +
        `Uptime: ${agent.uptime_percentage}% | ` +
        `Runs: ${agent.success_count}/${agent.run_count}`
      );
    }
    return true;
  } catch (err) {
    console.error(`❌ Error reading agent health: ${err.message}`);
    return false;
  }
}

async function testInsertCapability() {
  console.log('\n✍️  Testing write capability...\n');

  try {
    const testLog = {
      agent_name: 'TestAgent',
      action: 'CONNECTION_TEST',
      details: { timestamp: new Date().toISOString(), test: true },
      status: 'success'
    };

    const { data, error } = await supabase
      .from('campaign_logs')
      .insert([testLog])
      .select();

    if (error) {
      console.error(`❌ Cannot write to database: ${error.message}`);
      return false;
    }

    console.log('✅ Write capability confirmed');
    console.log(`   Test log inserted with ID: ${data[0].id}`);
    return true;
  } catch (err) {
    console.error(`❌ Error writing to database: ${err.message}`);
    return false;
  }
}

async function main() {
  try {
    // Run all tests
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('\n❌ Connection test failed. Cannot continue.');
      process.exit(1);
    }

    const schemaOk = await testTables();
    const dataOk = await testSampleData();
    const healthOk = await testAgentHealth();
    const writeOk = await testInsertCapability();

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Test Summary:\n');

    const results = [
      ['Connection', connectionOk ? '✅' : '❌'],
      ['Schema', schemaOk ? '✅' : '❌'],
      ['Sample Data', dataOk ? '✅' : '⚠️ '],
      ['Agent Health', healthOk ? '✅' : '⚠️ '],
      ['Write Access', writeOk ? '✅' : '❌']
    ];

    for (const [test, result] of results) {
      console.log(`  ${result} ${test}`);
    }

    const allPassed = connectionOk && schemaOk && writeOk;

    if (allPassed) {
      console.log('\n✅ All critical tests passed!\n');
      console.log('🚀 Your Supabase is ready for Hermes Factory!\n');
      console.log('Next steps:');
      console.log('  1. npm run research    # Discover trending products');
      console.log('  2. npm run pm2:start   # Start all agents');
      console.log('  3. npm run pm2:logs    # Watch the magic happen\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please check your setup.\n');
      console.log('Troubleshooting:');
      console.log('  - Verify .env credentials: supabase/SETUP.md');
      console.log('  - Run the SQL schema: supabase/schema.sql');
      console.log('  - Check Supabase dashboard: https://app.supabase.com\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

main();
