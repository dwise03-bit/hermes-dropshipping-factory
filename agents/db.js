import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export a database instance with helper methods
export const db = {
  client: supabase,

  async getTrendingProducts(limit = 50) {
    const { data, error } = await supabase
      .from('trending_products')
      .select('*')
      .eq('status', 'discovered')
      .order('discovered_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch trending products: ${error.message}`);
    return data;
  },

  async getValidatedProducts(limit = 50) {
    const { data, error } = await supabase
      .from('validated_products')
      .select('*')
      .eq('status', 'validated')
      .order('validated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch validated products: ${error.message}`);
    return data;
  },

  async updateProductStatus(productId, status) {
    const { data, error } = await supabase
      .from('trending_products')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw new Error(`Failed to update product status: ${error.message}`);
    return data;
  },

  async insertTrendingProduct(product) {
    const { data, error } = await supabase
      .from('trending_products')
      .insert([{
        ...product,
        discovered_at: new Date().toISOString(),
        status: 'discovered'
      }]);

    if (error) throw new Error(`Failed to insert trending product: ${error.message}`);
    return data;
  },

  async logCampaignActivity(agentName, action, details) {
    const { data, error } = await supabase
      .from('campaign_logs')
      .insert([{
        agent_name: agentName,
        action,
        details,
        logged_at: new Date().toISOString()
      }]);

    if (error) throw new Error(`Failed to log campaign activity: ${error.message}`);
    return data;
  },

  async getAgentHealth(agentName) {
    const { data, error } = await supabase
      .from('campaign_logs')
      .select('*')
      .eq('agent_name', agentName)
      .order('logged_at', { ascending: false })
      .limit(10);

    if (error) throw new Error(`Failed to get agent health: ${error.message}`);
    return data;
  }
};

export default db;
