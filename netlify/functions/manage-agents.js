// Agent Management System
// Allows HR (and authorized users) to dynamically add/remove board members

const { createAgent, BOARD_CONFIG } = require('../../config/board-config');

// In-memory storage for dynamic agents (in production, use a database)
let dynamicAgents = {};

// Get all agents (core + dynamic)
function getAllAgents() {
  return {
    core: Object.entries(BOARD_CONFIG).map(([key, config]) => ({
      id: key,
      ...config,
      dynamic: false
    })),
    dynamic: Object.entries(dynamicAgents).map(([key, config]) => ({
      id: key,
      ...config,
      dynamic: true
    }))
  };
}

// Add new agent
function addAgent(agentData) {
  const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newAgent = createAgent({
    role: agentData.role || 'Custom Agent',
    title: agentData.title || 'Specialist',
    icon: agentData.icon || '🤖',
    systemPrompt: agentData.systemPrompt || 'You are a specialist advisor.',
    priority: agentData.priority || 3,
    temperature: agentData.temperature || 0.5,
    maxTokens: agentData.maxTokens || 600,
    costTier: agentData.costTier || 'balanced'
  });
  
  dynamicAgents[agentId] = newAgent;
  
  return {
    id: agentId,
    ...newAgent
  };
}

// Remove agent
function removeAgent(agentId) {
  if (dynamicAgents[agentId]) {
    delete dynamicAgents[agentId];
    return true;
  }
  return false;
}

// Update agent
function updateAgent(agentId, updates) {
  if (dynamicAgents[agentId]) {
    dynamicAgents[agentId] = {
      ...dynamicAgents[agentId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return dynamicAgents[agentId];
  }
  return null;
}

// Main handler
exports.handler = async (event, context) => {
  const { httpMethod, path } = event;
  
  try {
    // GET - List all agents
    if (httpMethod === 'GET') {
      const agents = getAllAgents();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          agents: agents,
          totalCore: agents.core.length,
          totalDynamic: agents.dynamic.length
        })
      };
    }
    
    // POST - Add new agent
    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Validate input
      if (!body.role || !body.systemPrompt) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Role and systemPrompt are required'
          })
        };
      }
      
      const newAgent = addAgent(body);
      
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Agent created successfully',
          agent: newAgent
        })
      };
    }
    
    // PUT - Update agent
    if (httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const agentId = body.agentId;
      
      if (!agentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'agentId is required' })
        };
      }
      
      // Only dynamic agents can be updated
      if (BOARD_CONFIG[agentId]) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Core board members cannot be modified'
          })
        };
      }
      
      const updatedAgent = updateAgent(agentId, body.updates);
      
      if (!updatedAgent) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Agent not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Agent updated successfully',
          agent: updatedAgent
        })
      };
    }
    
    // DELETE - Remove agent
    if (httpMethod === 'DELETE') {
      const body = JSON.parse(event.body);
      const agentId = body.agentId;
      
      if (!agentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'agentId is required' })
        };
      }
      
      // Only dynamic agents can be deleted
      if (BOARD_CONFIG[agentId]) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Core board members cannot be deleted'
          })
        };
      }
      
      const removed = removeAgent(agentId);
      
      if (!removed) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Agent not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Agent removed successfully'
        })
      };
    }
    
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
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
