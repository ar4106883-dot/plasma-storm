// Advanced Multi-Threaded Proposal Submission
// Parallel execution with intelligent routing and cost optimization

const fetch = require('node-fetch');
const { assignProviders, getBoardMember } = require('../../config/board-config');
const { calculateCost, estimateTokens } = require('../../config/provider-router');

// Call any LLM provider with unified interface
async function callProvider(provider, model, messages, config = {}) {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  
  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}`);
  }

  const { temperature = 0.5, maxTokens = 600 } = config;

  try {
    switch(provider) {
      case 'anthropic':
        return await callAnthropic(apiKey, model, messages, temperature, maxTokens);
      case 'openai':
        return await callOpenAI(apiKey, model, messages, temperature, maxTokens);
      case 'groq':
        return await callGroq(apiKey, model, messages, temperature, maxTokens);
      case 'nvidia':
        return await callNVIDIA(apiKey, model, messages, temperature, maxTokens);
      case 'google':
        return await callGoogle(apiKey, model, messages, temperature, maxTokens);
      case 'together':
        return await callTogether(apiKey, model, messages, temperature, maxTokens);
      case 'mistral':
        return await callMistral(apiKey, model, messages, temperature, maxTokens);
      case 'cohere':
        return await callCohere(apiKey, model, messages, temperature, maxTokens);
      case 'huggingface':
        return await callHuggingFace(apiKey, model, messages, temperature, maxTokens);
      case 'replicate':
        return await callReplicate(apiKey, model, messages, temperature, maxTokens);
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error);
    return {
      response: `[Error from ${provider}: ${error.message}]`,
      tokens: { input: 0, output: 0, total: 0 },
      cost: 0
    };
  }
}

// Anthropic Claude
async function callAnthropic(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || ''
    })
  });
  
  const data = await response.json();
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = calculateCost('anthropic', model, inputTokens, outputTokens);
  
  return {
    response: data.content[0].text,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// OpenAI GPT
async function callOpenAI(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost('openai', model, inputTokens, outputTokens);
  
  return {
    response: data.choices[0].message.content,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Groq
async function callGroq(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    tokens: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0, total: data.usage?.total_tokens || 0 },
    cost: 0 // Groq is free
  };
}

// NVIDIA NIM
async function callNVIDIA(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost('nvidia', model, inputTokens, outputTokens);
  
  return {
    response: data.choices[0].message.content,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Google Gemini
async function callGoogle(apiKey, model, messages, temperature, maxTokens) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens
      }
    })
  });
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const inputTokens = data.usageMetadata?.promptTokenCount || 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('google', model, inputTokens, outputTokens);
  
  return {
    response: text,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Together AI
async function callTogether(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost('together', model, inputTokens, outputTokens);
  
  return {
    response: data.choices[0].message.content,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Mistral AI
async function callMistral(apiKey, model, messages, temperature, maxTokens) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost('mistral', model, inputTokens, outputTokens);
  
  return {
    response: data.choices[0].message.content,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Cohere
async function callCohere(apiKey, model, messages, temperature, maxTokens) {
  const message = messages[messages.length - 1].content;
  
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      message: message,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  const inputTokens = data.meta?.tokens?.input_tokens || 0;
  const outputTokens = data.meta?.tokens?.output_tokens || 0;
  const cost = calculateCost('cohere', model, inputTokens, outputTokens);
  
  return {
    response: data.text,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: cost
  };
}

// Hugging Face
async function callHuggingFace(apiKey, model, messages, temperature, maxTokens) {
  const prompt = messages.map(m => m.content).join('\n\n');
  
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        temperature: temperature,
        max_new_tokens: maxTokens
      }
    })
  });
  
  const data = await response.json();
  const text = data[0]?.generated_text || data.generated_text || '';
  const estimatedInput = estimateTokens(prompt);
  const estimatedOutput = estimateTokens(text);
  const cost = calculateCost('huggingface', model, estimatedInput, estimatedOutput);
  
  return {
    response: text,
    tokens: { input: estimatedInput, output: estimatedOutput, total: estimatedInput + estimatedOutput },
    cost: cost
  };
}

// Replicate
async function callReplicate(apiKey, model, messages, temperature, maxTokens) {
  const prompt = messages.map(m => m.content).join('\n\n');
  
  // This is simplified - Replicate requires creating a prediction and polling
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: model,
      input: {
        prompt: prompt,
        temperature: temperature,
        max_tokens: maxTokens
      }
    })
  });
  
  const data = await response.json();
  // Note: Would need to poll for completion in production
  const estimatedInput = estimateTokens(prompt);
  const estimatedOutput = 500;
  const cost = calculateCost('replicate', model, estimatedInput, estimatedOutput);
  
  return {
    response: data.output || 'Processing...',
    tokens: { input: estimatedInput, output: estimatedOutput, total: estimatedInput + estimatedOutput },
    cost: cost
  };
}

// Main handler with multithreaded execution
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { proposal, includeChairman = true, excludeRoles = [] } = JSON.parse(event.body);
    
    if (!proposal) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Proposal is required' })
      };
    }

    console.log('Assigning optimal providers...');
    const assignments = await assignProviders(proposal);
    
    // Execute all board members in parallel (multithreaded)
    console.log('Executing board consultation in parallel...');
    const boardPromises = Object.entries(assignments)
      .filter(([role]) => !excludeRoles.includes(role))
      .map(async ([role, config]) => {
        const messages = [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: proposal }
        ];
        
        const startTime = Date.now();
        const result = await callProvider(
          config.provider,
          config.model,
          messages,
          {
            temperature: config.temperature,
            maxTokens: config.maxTokens
          }
        );
        const duration = Date.now() - startTime;
        
        return {
          role: config.role,
          title: config.title,
          icon: config.icon,
          provider: config.provider,
          model: config.model,
          response: result.response,
          tokens: result.tokens,
          cost: result.cost,
          duration: duration,
          priority: config.priority
        };
      });
    
    // Wait for all responses (parallel execution)
    const responses = await Promise.all(boardPromises);
    
    // Calculate total cost
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
    
    // Get chairman's final decision if requested
    if (includeChairman) {
      const boardSummary = responses.map(r =>
        `${r.title}: ${r.response}`
      ).join('\n\n---\n\n');
      
      const chairmanPrompt = `Based on the following board discussion about this proposal:

PROPOSAL: ${proposal}

BOARD RESPONSES:
${boardSummary}

As Chairman, provide your final recommendation and decision.`;

      const chairmanConfig = getBoardMember('chairman');
      const chairmanAssignment = assignments['chairman'] || {
        provider: 'anthropic',
        model: 'claude-sonnet-4.5'
      };
      
      const chairmanResult = await callProvider(
        chairmanAssignment.provider,
        chairmanAssignment.model,
        [
          { role: 'system', content: chairmanConfig.systemPrompt },
          { role: 'user', content: chairmanPrompt }
        ],
        {
          temperature: chairmanConfig.temperature,
          maxTokens: chairmanConfig.maxTokens
        }
      );
      
      responses.push({
        role: 'Chairman',
        title: chairmanConfig.title,
        icon: chairmanConfig.icon,
        provider: chairmanAssignment.provider,
        model: chairmanAssignment.model,
        response: chairmanResult.response,
        tokens: chairmanResult.tokens,
        cost: chairmanResult.cost,
        duration: 0,
        priority: 0
      });
    }

    // Sort by priority (higher priority first)
    responses.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        responses: responses,
        totalCost: totalCost,
        executionMode: 'parallel',
        boardSize: responses.length
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
