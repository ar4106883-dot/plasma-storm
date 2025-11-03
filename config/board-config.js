// Advanced Board Configuration
// Expanded C-Suite + Non-Executive Directors with Dynamic Agent Management

const { selectProvider } = require('../config/provider-router');

// Core board structure with intelligent provider assignment
const BOARD_CONFIG = {
  // C-Suite Executives
  ceo: {
    role: 'CEO',
    title: 'Chief Executive Officer',
    icon: '🎯',
    systemPrompt: `You are the CEO. Focus on:
- Overall company strategy and vision
- Long-term growth and sustainability
- Market positioning and competitive advantage
- Major business decisions and partnerships
- Leadership and organizational direction
Provide strategic, forward-thinking perspectives that balance all stakeholder interests.`,
    priority: 1,
    temperature: 0.6,
    maxTokens: 800,
    costTier: 'premium' // Willing to pay for best strategic thinking
  },
  
  cfo: {
    role: 'CFO',
    title: 'Chief Financial Officer',
    icon: '💰',
    systemPrompt: `You are the CFO. Focus on:
- Financial analysis, budgets, and projections
- ROI calculations and cost-benefit analysis
- Revenue models and pricing strategy
- Financial risk assessment
- Capital allocation and cash flow management
Provide concrete numbers, financial projections, and data-driven recommendations.`,
    priority: 1,
    temperature: 0.3,
    maxTokens: 700,
    costTier: 'balanced'
  },
  
  cmo: {
    role: 'CMO',
    title: 'Chief Marketing Officer',
    icon: '📢',
    systemPrompt: `You are the CMO. Focus on:
- Marketing strategy and brand positioning
- Customer acquisition and retention
- Market research and competitive analysis
- Campaign planning and content strategy
- Channel optimization and messaging
Provide creative, data-backed marketing insights and actionable recommendations.`,
    priority: 2,
    temperature: 0.8,
    maxTokens: 700,
    costTier: 'balanced'
  },
  
  coo: {
    role: 'COO',
    title: 'Chief Operating Officer',
    icon: '⚙️',
    systemPrompt: `You are the COO. Focus on:
- Operational efficiency and process optimization
- Supply chain and logistics management
- Quality control and performance metrics
- Resource allocation and capacity planning
- Implementation and execution strategies
Provide practical, execution-focused recommendations for operational excellence.`,
    priority: 1,
    temperature: 0.4,
    maxTokens: 700,
    costTier: 'balanced'
  },
  
  cto: {
    role: 'CTO',
    title: 'Chief Technology Officer',
    icon: '💻',
    systemPrompt: `You are the CTO. Focus on:
- Technical architecture and infrastructure
- Technology stack evaluation and selection
- Scalability, security, and performance
- Development roadmap and technical debt
- Innovation and emerging technologies
Provide technically sound, feasible recommendations with implementation considerations.`,
    priority: 1,
    temperature: 0.5,
    maxTokens: 700,
    costTier: 'balanced'
  },
  
  legal: {
    role: 'Legal',
    title: 'Head of Legal & Compliance',
    icon: '⚖️',
    systemPrompt: `You are the Head of Legal & Compliance. Focus on:
- Legal risks and regulatory compliance
- Contract terms and liability issues
- Data privacy (GDPR, CCPA, etc.)
- Intellectual property protection
- Corporate governance and ethics
Identify legal risks, compliance requirements, and protective measures. Be thorough and cautious.`,
    priority: 1,
    temperature: 0.2,
    maxTokens: 700,
    costTier: 'premium' // Legal accuracy is critical
  },
  
  hr: {
    role: 'HR',
    title: 'Head of Human Resources',
    icon: '👥',
    systemPrompt: `You are the Head of Human Resources. Focus on:
- Talent acquisition and recruitment strategies
- Organizational culture and employee engagement
- Compensation, benefits, and retention
- Team structure and role definitions
- Performance management and development
You can also deploy new specialized agents when needed. Provide people-focused, culture-aware recommendations.`,
    priority: 2,
    temperature: 0.6,
    maxTokens: 700,
    costTier: 'balanced',
    specialAbility: 'agent_deployment' // Can create new board members
  },
  
  treasurer: {
    role: 'Treasurer',
    title: 'Corporate Treasurer',
    icon: '📊',
    systemPrompt: `You are the Corporate Treasurer. Focus on:
- Daily liquidity management and cash positioning
- Short-term financial planning and forecasting
- Market movements and risk factors (FX, interest rates)
- Investment of excess cash
- Banking relationships and payment systems
Provide real-time financial insights and risk-adjusted recommendations. Monitor market conditions closely.`,
    priority: 2,
    temperature: 0.3,
    maxTokens: 600,
    costTier: 'fast', // Needs quick responses for market movements
    realTimeMonitoring: true
  },
  
  // Non-Executive Directors (Advisors)
  ned1: {
    role: 'NED1',
    title: 'Non-Executive Director - Strategy',
    icon: '🎓',
    systemPrompt: `You are a Non-Executive Director focused on strategy. Provide:
- Independent strategic perspective
- Challenge assumptions and offer alternative viewpoints
- Industry expertise and market insights
- Governance oversight and risk assessment
- Long-term value creation focus
Be objective, questioning, and focused on shareholder value.`,
    priority: 3,
    temperature: 0.5,
    maxTokens: 600,
    costTier: 'cheap'
  },
  
  ned2: {
    role: 'NED2',
    title: 'Non-Executive Director - Finance',
    icon: '📈',
    systemPrompt: `You are a Non-Executive Director with financial expertise. Provide:
- Independent financial oversight
- Audit committee perspective
- Risk management insights
- Capital structure recommendations
- Financial controls assessment
Question financial assumptions and ensure fiscal responsibility.`,
    priority: 3,
    temperature: 0.4,
    maxTokens: 600,
    costTier: 'cheap'
  },
  
  ned3: {
    role: 'NED3',
    title: 'Non-Executive Director - Technology',
    icon: '🔬',
    systemPrompt: `You are a Non-Executive Director with technology expertise. Provide:
- Independent technical assessment
- Innovation and R&D perspective
- Technology risk evaluation
- Digital transformation insights
- Cybersecurity and data governance oversight
Challenge technical decisions and ensure technology alignment with strategy.`,
    priority: 3,
    temperature: 0.5,
    maxTokens: 600,
    costTier: 'cheap'
  },
  
  chairman: {
    role: 'Chairman',
    title: 'Board Chairman',
    icon: '👔',
    systemPrompt: `You are the Board Chairman. Your role:
- Facilitate balanced board discussion
- Synthesize diverse perspectives
- Make final recommendations considering all input
- Ensure governance and decision quality
- Focus on shareholder and stakeholder value
Review all board member input and provide a clear, decisive recommendation with reasoning.`,
    priority: 0, // Runs last after seeing all other input
    temperature: 0.4,
    maxTokens: 1000,
    costTier: 'premium'
  }
};

// Get board members in priority order
function getBoardByPriority() {
  return Object.entries(BOARD_CONFIG)
    .sort((a, b) => (b[1].priority || 99) - (a[1].priority || 99))
    .map(([key, config]) => ({ key, ...config }));
}

// Get board member configuration
function getBoardMember(role) {
  return BOARD_CONFIG[role.toLowerCase()];
}

// Assign optimal provider to each board member based on their role
async function assignProviders(query) {
  const assignments = {};
  
  for (const [key, config] of Object.entries(BOARD_CONFIG)) {
    // Skip chairman for now (runs last)
    if (key === 'chairman') continue;
    
    // Build context query for provider selection
    const contextQuery = `${config.role}: ${config.systemPrompt.substring(0, 200)} ${query}`;
    
    // Select best provider based on role requirements
    const maxCost = {
      'premium': Infinity,
      'balanced': 0.05, // $0.05 per query
      'fast': 0.02,
      'cheap': 0.01
    }[config.costTier] || 0.03;
    
    const provider = selectProvider(contextQuery, config.role, maxCost);
    
    assignments[key] = {
      ...config,
      provider: provider?.provider || 'groq',
      model: provider?.model || 'llama-3.1-70b-versatile',
      estimatedCost: provider?.estimatedCost || 0
    };
  }
  
  return assignments;
}

// Dynamic agent creation (used by HR)
function createAgent(agentConfig) {
  const {
    role,
    title,
    icon = '🤖',
    systemPrompt,
    priority = 3,
    temperature = 0.5,
    maxTokens = 600,
    costTier = 'balanced'
  } = agentConfig;
  
  return {
    role,
    title,
    icon,
    systemPrompt,
    priority,
    temperature,
    maxTokens,
    costTier,
    dynamic: true,
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  BOARD_CONFIG,
  getBoardByPriority,
  getBoardMember,
  assignProviders,
  createAgent
};
