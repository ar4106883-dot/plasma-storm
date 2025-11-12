const fetch = require('node-fetch');

const boardMembers = {
    chairman: {
        role: 'Chairman',
        provider: 'google',
        model: 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are the Chairman providing strategic oversight and governance perspective.',
        cost: 'Low',
        priority: 'high'
    },
    ceo: {
        role: 'CEO',
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY,
        systemPrompt: 'You are the CEO providing executive leadership and vision.',
        cost: 'Low', // $1/$5 per million tokens
        priority: 'high'
    },
    cfo: {
        role: 'CFO',
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        systemPrompt: 'You are the CFO providing financial analysis and cost optimization. Focus on numbers, ROI, and financial metrics.',
        cost: 'Ultra-Low', // $0.14/$0.28 per million tokens
        priority: 'high'
    },
    cmo: {
        role: 'CMO',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are the CMO providing marketing and brand strategy.',
        cost: 'FREE',
        priority: 'medium'
    },
    coo: {
        role: 'COO',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are the COO providing operational efficiency insights.',
        cost: 'FREE',
        priority: 'high'
    },
    cto: {
        role: 'CTO',
        provider: 'google',
        model: 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are the CTO providing technical architecture and innovation.',
        cost: 'Low',
        priority: 'high'
    },
    legal: {
        role: 'Legal Counsel',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        apiKey: process.env.ANTHROPIC_API_KEY,
        systemPrompt: 'You are Legal Counsel providing compliance, risk assessment, and regulatory guidance. Be thorough and precise.',
        cost: 'Medium', // $3/$15 per million - worth it for legal
        priority: 'critical'
    },
    hr: {
        role: 'HR Director',
        provider: 'google',
        model: 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are the HR Director providing people and culture insights.',
        cost: 'Ultra-Low',
        priority: 'medium'
    },
    treasurer: {
        role: 'Treasurer',
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        systemPrompt: 'You are the Treasurer providing cash flow and investment analysis. Focus on financial forecasting and capital management.',
        cost: 'Ultra-Low', // $0.14/$0.28 per million tokens
        priority: 'high'
    },
    ned1: {
        role: 'NED - Tech',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent technology and innovation perspective.',
        cost: 'FREE',
        priority: 'medium'
    },
    ned2: {
        role: 'NED - Finance',
        provider: 'groq',
        model: 'mixtral-8x7b-32768',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent financial perspective.',
        cost: 'FREE',
        priority: 'medium'
    },
    ned3: {
        role: 'NED - Strategy',
        provider: 'google',
        model: 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent strategic perspective.',
        cost: 'Ultra-Low',
        priority: 'medium'
    }
};

// Cost optimization summary
const COST_BREAKDOWN = {
    free: ['cmo', 'coo', 'ned1', 'ned2'], // 4 members - Groq
    ultraLow: ['cfo', 'treasurer', 'hr', 'ned3'], // 4 members - DeepSeek/Gemini Flash
    low: ['chairman', 'ceo', 'cto'], // 3 members - Gemini Pro/Claude Haiku
    medium: ['legal'] // 1 member - Claude Sonnet (justified for legal)
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { proposal, targetType, targetMembers, threadId } = JSON.parse(event.body);

        // Determine which board members to consult
        let targetedMembers = [];
        if (targetType === 'full') {
            targetedMembers = Object.keys(boardMembers);
        } else if (targetType === 'group' || targetType === 'private') {
            targetedMembers = targetMembers || [];
        }

        console.log(`Processing ${targetType} request with ${targetedMembers.length} members`);

        // Call AI providers in parallel
        const startTime = Date.now();
        const responses = await Promise.all(
            targetedMembers.map(memberId => callAIProvider(memberId, proposal, threadId))
        );
        const executionTime = Date.now() - startTime;

        const totalCost = responses.reduce((sum, r) => sum + (r.cost || 0), 0);
        const freeCount = responses.filter(r => r.cost === 0).length;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                threadId,
                targetType,
                boardSize: responses.length,
                responses: responses.map((r, idx) => ({
                    memberId: targetedMembers[idx],
                    ...r
                })),
                totalCost,
                freeResponses: freeCount,
                executionTime: `${(executionTime / 1000).toFixed(2)}s`,
                executionMode: 'parallel',
                costEfficiency: `${freeCount}/${responses.length} free responses`
            })
        };

    } catch (error) {
        console.error('Handler Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};

async function callAIProvider(memberId, message, threadId) {
    const member = boardMembers[memberId];
    if (!member) {
        return {
            title: memberId,
            response: 'Board member not found',
            cost: 0,
            provider: 'N/A',
            icon: '❌'
        };
    }

    if (!member.apiKey) {
        return {
            title: member.role,
            response: `⚠️ API key not configured for ${member.provider}. Add ${member.provider.toUpperCase()}_API_KEY to environment variables.`,
            cost: 0,
            provider: member.provider,
            icon: getIcon(member.role)
        };
    }

    try {
        console.log(`Calling ${member.provider} (${member.cost} cost) for ${member.role}`);
        
        switch (member.provider) {
            case 'anthropic':
                return await callAnthropic(member, message);
            case 'google':
                return await callGoogle(member, message);
            case 'groq':
                return await callGroq(member, message);
            case 'deepseek':
                return await callDeepSeek(member, message);
            default:
                return {
                    title: member.role,
                    response: `Provider ${member.provider} not implemented`,
                    cost: 0,
                    provider: member.provider,
                    icon: getIcon(member.role)
                };
        }
    } catch (error) {
        console.error(`Error calling ${member.provider} for ${member.role}:`, error);
        return {
            title: member.role,
            response: `Error from ${member.provider}: ${error.message}`,
            cost: 0,
            provider: member.provider,
            icon: getIcon(member.role)
        };
    }
}

async function callAnthropic(member, message) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': member.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: member.model,
            max_tokens: 2048,
            system: member.systemPrompt,
            messages: [{ role: 'user', content: message }]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return {
        title: member.role,
        response: data.content[0].text,
        cost: estimateCost('anthropic', member.model, message, data.content[0].text),
        provider: 'Claude',
        icon: getIcon(member.role),
        costTier: member.cost
    };
}

async function callGoogle(member, message) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${member.model}:generateContent?key=${member.apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${member.systemPrompt}\n\nUser query: ${message}` }]
            }],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Google API');
    }

    return {
        title: member.role,
        response: data.candidates[0].content.parts[0].text,
        cost: estimateCost('google', member.model, message, data.candidates[0].content.parts[0].text),
        provider: 'Gemini',
        icon: getIcon(member.role),
        costTier: member.cost
    };
}

async function callGroq(member, message) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${member.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: member.model,
            messages: [
                { role: 'system', content: member.systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 2048,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    return {
        title: member.role,
        response: data.choices[0].message.content,
        cost: 0, // Groq is FREE
        provider: 'Groq',
        icon: getIcon(member.role),
        costTier: 'FREE'
    };
}

async function callDeepSeek(member, message) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${member.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: member.model,
            messages: [
                { role: 'system', content: member.systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 2048,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    return {
        title: member.role,
        response: data.choices[0].message.content,
        cost: estimateCost('deepseek', member.model, message, data.choices[0].message.content),
        provider: 'DeepSeek',
        icon: getIcon(member.role),
        costTier: member.cost
    };
}

function estimateCost(provider, model, input, output) {
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    
    const rates = {
        'anthropic': {
            'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
            'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 }
        },
        'google': {
            'gemini-2.0-flash': { input: 0.0, output: 0.0 },
            'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 }
        },
        'deepseek': {
            'deepseek-chat': { input: 0.00014, output: 0.00028 }
        },
        'groq': {
            'llama-3.1-70b-versatile': { input: 0, output: 0 },
            'llama-3.3-70b-versatile': { input: 0, output: 0 },
            'mixtral-8x7b-32768': { input: 0, output: 0 }
        }
    };
    
    const rate = rates[provider]?.[model] || { input: 0.001, output: 0.002 };
    return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
}

function getIcon(role) {
    const icons = {
        'Chairman': '👔', 'CEO': '🎯', 'CFO': '💰', 'CMO': '📢',
        'COO': '⚙️', 'CTO': '💻', 'Legal Counsel': '⚖️',
        'HR Director': '👥', 'Treasurer': '📊',
        'NED - Tech': '🎓', 'NED - Finance': '📈', 'NED - Strategy': '🔬'
    };
    return icons[role] || '🤖';
}
