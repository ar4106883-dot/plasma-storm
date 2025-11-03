// Real-Time Cost Analysis and Provider Comparison
// Shows cheapest providers for different query types

const { getAvailableProviders, selectProvider, PROVIDER_CONFIGS } = require('../../config/provider-router');

exports.handler = async (event, context) => {
  try {
    const { query, maxCost } = event.queryStringParameters || {};
    
    // Get all available providers
    const availableProviders = getAvailableProviders();
    
    // If query provided, analyze best options
    let recommendations = null;
    if (query) {
      const selected = selectProvider(query, 'analysis', maxCost ? parseFloat(maxCost) : Infinity);
      
      // Get top 5 alternatives
      const alternatives = Object.entries(PROVIDER_CONFIGS)
        .filter(([provider]) => process.env[`${provider.toUpperCase()}_API_KEY`])
        .map(([provider, config]) => {
          const model = config.defaultModel;
          const modelConfig = config.models[model];
          const estimatedInput = Math.ceil((query.split(/\s+/).length) * 1.3);
          const estimatedOutput = 500;
          const estimatedCost = ((estimatedInput / 1000000) * modelConfig.inputCost) +
                               ((estimatedOutput / 1000000) * modelConfig.outputCost);
          
          return {
            provider,
            model,
            estimatedCost: estimatedCost.toFixed(6),
            strengths: modelConfig.strengths
          };
        })
        .sort((a, b) => parseFloat(a.estimatedCost) - parseFloat(b.estimatedCost))
        .slice(0, 5);
      
      recommendations = {
        optimal: selected,
        alternatives: alternatives,
        queryAnalysis: {
          estimatedTokens: Math.ceil((query.split(/\s+/).length) * 1.3),
          queryLength: query.length
        }
      };
    }
    
    // Provider pricing table
    const pricingTable = {};
    for (const [provider, config] of Object.entries(PROVIDER_CONFIGS)) {
      if (!process.env[`${provider.toUpperCase()}_API_KEY`]) continue;
      
      pricingTable[provider] = {
        name: config.name,
        models: Object.entries(config.models).map(([name, modelConfig]) => ({
          name,
          inputCost: `$${modelConfig.inputCost.toFixed(2)}/M`,
          outputCost: `$${modelConfig.outputCost.toFixed(2)}/M`,
          contextWindow: `${(modelConfig.contextWindow / 1000).toFixed(0)}K`,
          strengths: modelConfig.strengths
        }))
      };
    }
    
    // Cost comparison for standard query
    const standardQuery = "Analyze our Q4 strategy";
    const standardTokens = 100; // Approximate
    const standardOutput = 500;
    
    const costComparison = Object.entries(PROVIDER_CONFIGS)
      .filter(([provider]) => process.env[`${provider.toUpperCase()}_API_KEY`])
      .map(([provider, config]) => {
        const model = config.defaultModel;
        const modelConfig = config.models[model];
        const cost = ((standardTokens / 1000000) * modelConfig.inputCost) +
                    ((standardOutput / 1000000) * modelConfig.outputCost);
        
        return {
          provider: config.name,
          model,
          costPerQuery: `$${cost.toFixed(6)}`,
          costPer1000Queries: `$${(cost * 1000).toFixed(2)}`,
          tier: cost === 0 ? 'FREE' : cost < 0.001 ? 'CHEAP' : cost < 0.01 ? 'BALANCED' : 'PREMIUM'
        };
      })
      .sort((a, b) => parseFloat(a.costPerQuery.replace('$', '')) - parseFloat(b.costPerQuery.replace('$', '')));
    
    // Monthly cost estimates for different usage levels
    const monthlyEstimates = [100, 500, 1000, 5000, 10000].map(queries => {
      const estimates = costComparison.map(provider => ({
        provider: provider.provider,
        queries: queries,
        monthlyCost: (parseFloat(provider.costPerQuery.replace('$', '')) * queries).toFixed(2)
      }));
      
      return {
        queries: queries,
        providers: estimates
      };
    });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        summary: {
          totalProviders: availableProviders.length,
          freeProviders: costComparison.filter(p => p.tier === 'FREE').length,
          cheapProviders: costComparison.filter(p => p.tier === 'CHEAP').length
        },
        recommendations: recommendations,
        pricingTable: pricingTable,
        costComparison: costComparison,
        monthlyEstimates: monthlyEstimates,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
