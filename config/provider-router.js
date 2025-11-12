// Advanced Provider Router with Real-Time Cost Optimization
// Intelligently selects best provider based on cost, context, and availability

const PROVIDER_CONFIGS = {
  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: {
      'claude-opus-4': { inputCost: 15.00, outputCost: 75.00, contextWindow: 200000, strengths: ['complex reasoning', 'analysis', 'strategy'] },
      'claude-sonnet-4.5': { inputCost: 3.00, outputCost: 15.00, contextWindow: 200000, strengths: ['balanced', 'general', 'coding'] },
      'claude-haiku-4': { inputCost: 0.25, outputCost: 1.25, contextWindow: 200000, strengths: ['fast', 'simple', 'cheap'] }
    },
    defaultModel: 'claude-sonnet-4.5'
  },
  
  openai: {
    name: 'OpenAI GPT',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: {
      'gpt-4-turbo': { inputCost: 10.00, outputCost: 30.00, contextWindow: 128000, strengths: ['reasoning', 'general', 'creative'] },
      'gpt-4o': { inputCost: 2.50, outputCost: 10.00, contextWindow: 128000, strengths: ['balanced', 'fast', 'multimodal'] },
      'gpt-3.5-turbo': { inputCost: 0.50, outputCost: 1.50, contextWindow: 16000, strengths: ['cheap', 'fast', 'simple'] }
    },
    defaultModel: 'gpt-4o'
  },
  
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: {
      'llama-3.1-70b-versatile': { inputCost: 0.00, outputCost: 0.00, contextWindow: 32000, strengths: ['free', 'fast', 'general'] },
      'llama-3.1-8b-instant': { inputCost: 0.00, outputCost: 0.00, contextWindow: 8000, strengths: ['free', 'fastest', 'simple'] },
      'mixtral-8x7b-32768': { inputCost: 0.00, outputCost: 0.00, contextWindow: 32000, strengths: ['free', 'coding', 'technical'] }
    },
    defaultModel: 'llama-3.1-70b-versatile'
  },
  
  nvidia: {
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: {
      'meta/llama-3.1-70b-instruct': { inputCost: 0.50, outputCost: 0.50, contextWindow: 128000, strengths: ['gpu-optimized', 'fast', 'general'] },
      'meta/llama-3.1-405b-instruct': { inputCost: 1.00, outputCost: 1.00, contextWindow: 128000, strengths: ['powerful', 'reasoning', 'large'] }
    },
    defaultModel: 'meta/llama-3.1-70b-instruct'
  },
  
  google: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: {
      'gemini-2.0-flash': { inputCost: 0.00, outputCost: 0.00, contextWindow: 1000000, strengths: ['free', 'fast', 'large-context', 'multimodal'] },
      'gemini-2.0-flash-exp': { inputCost: 0.00, outputCost: 0.00, contextWindow: 1000000, strengths: ['free', 'experimental', 'multimodal'] }
    },
    defaultModel: 'gemini-2.0-flash'
  },
  
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1/chat/completions',
    models: {
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': { inputCost: 0.88, outputCost: 0.88, contextWindow: 8000, strengths: ['cheap', 'fast', 'production'] },
      'mistralai/Mixtral-8x7B-Instruct-v0.1': { inputCost: 0.60, outputCost: 0.60, contextWindow: 32000, strengths: ['cheap', 'coding', 'technical'] }
    },
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
  },
  
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: {
      'mistral-large-latest': { inputCost: 4.00, outputCost: 12.00, contextWindow: 128000, strengths: ['multilingual', 'reasoning', 'general'] },
      'mistral-small-latest': { inputCost: 1.00, outputCost: 3.00, contextWindow: 32000, strengths: ['balanced', 'fast', 'cheap'] }
    },
    defaultModel: 'mistral-small-latest'
  },
  
  cohere: {
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1/chat',
    models: {
      'command-r-plus': { inputCost: 3.00, outputCost: 15.00, contextWindow: 128000, strengths: ['reasoning', 'general', 'rag'] },
      'command-r': { inputCost: 0.50, outputCost: 1.50, contextWindow: 128000, strengths: ['cheap', 'fast', 'general'] }
    },
    defaultModel: 'command-r'
  },
  
  huggingface: {
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    models: {
      'meta-llama/Llama-3.1-70B-Instruct': { inputCost: 0.50, outputCost: 0.50, contextWindow: 8000, strengths: ['open-source', 'flexible', 'general'] }
    },
    defaultModel: 'meta-llama/Llama-3.1-70B-Instruct'
  },
  
  replicate: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1/predictions',
    models: {
      'meta/llama-3.1-70b-instruct': { inputCost: 0.65, outputCost: 2.75, contextWindow: 8000, strengths: ['pay-per-use', 'flexible', 'general'] }
    },
    defaultModel: 'meta/llama-3.1-70b-instruct'
  }
};

// Context analysis keywords for intelligent routing
const CONTEXT_KEYWORDS = {
  financial: ['financial', 'money', 'budget', 'revenue', 'profit', 'cost', 'investment', 'roi', 'pricing', 'market', 'valuation', 'liquidity', 'treasury'],
  technical: ['technical', 'code', 'software', 'api', 'algorithm', 'architecture', 'system', 'database', 'infrastructure', 'deployment'],
  legal: ['legal', 'compliance', 'regulation', 'contract', 'law', 'policy', 'gdpr', 'privacy', 'risk', 'liability', 'agreement'],
  strategy: ['strategy', 'plan', 'vision', 'mission', 'goal', 'objective', 'roadmap', 'competitive', 'market position', 'growth'],
  hr: ['hr', 'people', 'talent', 'hiring', 'recruitment', 'culture', 'team', 'employee', 'compensation', 'retention'],
  marketing: ['marketing', 'brand', 'campaign', 'content', 'social media', 'seo', 'advertising', 'customer acquisition'],
  operations: ['operations', 'process', 'efficiency', 'workflow', 'supply chain', 'logistics', 'productivity', 'optimization'],
  simple: ['simple', 'quick', 'brief', 'summarize', 'list', 'what is', 'define']
};

// Analyze query context
function analyzeContext(query) {
  const lowerQuery = query.toLowerCase();
  const contexts = [];
  
  for (const [context, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
    if (matchCount > 0) {
      contexts.push({ context, score: matchCount });
    }
  }
  
  contexts.sort((a, b) => b.score - a.score);
  return contexts.length > 0 ? contexts[0].context : 'general';
}

// Calculate cost for a query
function calculateCost(provider, model, inputTokens, outputTokens) {
  const modelConfig = PROVIDER_CONFIGS[provider]?.models[model];
  if (!modelConfig) return 0;
  
  const inputCost = (inputTokens / 1000000) * modelConfig.inputCost;
  const outputCost = (outputTokens / 1000000) * modelConfig.outputCost;
  
  return inputCost + outputCost;
}

// Estimate tokens from text (rough approximation)
function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3); // ~1.3 tokens per word
}

// Select best provider based on context, cost, and requirements
function selectProvider(query, role, maxCost = Infinity) {
  const context = analyzeContext(query);
  const estimatedInputTokens = estimateTokens(query);
  const estimatedOutputTokens = 500; // Assume 500 token response
  
  const availableProviders = Object.entries(PROVIDER_CONFIGS)
    .filter(([provider]) => process.env[`${provider.toUpperCase()}_API_KEY`])
    .map(([provider, config]) => {
      const model = config.defaultModel;
      const modelConfig = config.models[model];
      const estimatedCost = calculateCost(provider, model, estimatedInputTokens, estimatedOutputTokens);
      
      // Calculate suitability score
      let score = 0;
      
      // Cost factor (prefer cheaper)
      if (estimatedCost === 0) score += 100; // Free providers get bonus
      else score += (1 / estimatedCost) * 10;
      
      // Context matching
      if (context === 'financial' && modelConfig.strengths.includes('reasoning')) score += 20;
      if (context === 'technical' && modelConfig.strengths.includes('coding')) score += 20;
      if (context === 'simple' && modelConfig.strengths.includes('fast')) score += 15;
      if (context === 'strategy' && modelConfig.strengths.includes('reasoning')) score += 20;
      
      // General quality
      if (modelConfig.strengths.includes('balanced')) score += 10;
      
      return {
        provider,
        model,
        config: modelConfig,
        estimatedCost,
        score,
        apiKey: process.env[`${provider.toUpperCase()}_API_KEY`]
      };
    })
    .filter(p => p.estimatedCost <= maxCost)
    .sort((a, b) => b.score - a.score);
  
  return availableProviders[0] || null;
}

// Get all available providers with their costs
function getAvailableProviders() {
  return Object.entries(PROVIDER_CONFIGS)
    .filter(([provider]) => process.env[`${provider.toUpperCase()}_API_KEY`])
    .map(([provider, config]) => ({
      provider,
      name: config.name,
      models: Object.entries(config.models).map(([modelName, modelConfig]) => ({
        name: modelName,
        inputCost: modelConfig.inputCost,
        outputCost: modelConfig.outputCost,
        contextWindow: modelConfig.contextWindow,
        strengths: modelConfig.strengths
      }))
    }));
}

module.exports = {
  PROVIDER_CONFIGS,
  analyzeContext,
  calculateCost,
  estimateTokens,
  selectProvider,
  getAvailableProviders
};
