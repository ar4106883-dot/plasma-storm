const fetch = require('node-fetch');

const boardMembers = {
    chairman: {
        role: 'Chairman',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        apiKey: process.env.ANTHROPIC_API_KEY,
        systemPrompt: 'You are the Chairman providing strategic oversight and governance perspective.'
    },
    ceo: {
        role: 'CEO',
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
        systemPrompt: 'You are the CEO providing executive leadership and vision.'
    },
    cfo: {
        role: 'CFO',
        provider: 'google',
        model: 'gemini-pro',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are the CFO providing financial analysis and cost optimization.'
    },
    cmo: {
        role: 'CMO',
        provider: 'anthropic',
        model: 'claude-haiku',
        apiKey: process.env.ANTHROPIC_API_KEY,
        systemPrompt: 'You are the CMO providing marketing and brand strategy.'
    },
    coo: {
        role: 'COO',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are the COO providing operational efficiency insights.'
    },
    cto: {
        role: 'CTO',
        provider: 'openai',
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        systemPrompt: 'You are the CTO providing technical architecture and innovation.'
    },
    legal: {
        role: 'Legal Counsel',
        provider: 'anthropic',
        model: 'claude-opus',
        apiKey: process.env.ANTHROPIC_API_KEY,
        systemPrompt: 'You are Legal Counsel providing compliance and risk assessment.'
    },
    hr: {
        role: 'HR Director',
        provider: 'google',
        model: 'gemini-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        systemPrompt: 'You are the HR Director providing people and culture insights.'
    },
    treasurer: {
        role: 'Treasurer',
        provider: 'mistral',
        model: 'mistral-large',
        apiKey: process.env.MISTRAL_API_KEY,
        systemPrompt: 'You are the Treasurer providing cash flow and investment analysis.'
    },
    ned1: {
        role: 'NED - Tech',
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent technology perspective.'
    },
    ned2: {
        role: 'NED - Finance',
        provider: 'groq',
        model: 'mixtral-8x7b',
        apiKey: process.env.GROQ_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent financial perspective.'
    },
    ned3: {
        role: 'NED - Strategy',
        provider: 'cohere',
        model: 'command-r-plus',
        apiKey: process.env.COHERE_API_KEY,
        systemPrompt: 'You are a Non-Executive Director providing independent strategic perspective.'
    }
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

        // Call AI providers in parallel
        const responses = await Promise.all(
            targetedMembers.map(memberId => callAIProvider(memberId, proposal, threadId))
        );

        const totalCost = responses.reduce((sum, r) => sum + (r.cost || 0), 0);

        return {
            statusCode: 200,
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
                executionMode: 'parallel'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};

async function callAIProvider(memberId, message, threadId) {
    const member = boardMembers[memberId];
    if (!member || !member.apiKey) {
        return {
            title: member?.role || memberId,
            response: 'API key not configured',
            cost: 0,
            provider: 'N/A'
        };
    }

    try {
        switch (member.provider) {
            case 'anthropic':
                return await callAnthropic(member, message);
            case 'openai':
                return await callOpenAI(member, message);
            case 'google':
                return await callGoogle(member, message);
            case 'groq':
                return await callGroq(member, message);
            default:
                return {
                    title: member.role,
                    response: `Provider ${member.provider} not yet implemented`,
                    cost: 0,
                    provider: member.provider
                };
        }
    } catch (error) {
        return {
            title: member.role,
            response: `Error: ${error.message}`,
            cost: 0,
            provider: member.provider
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
            max_tokens: 1024,
            system: member.systemPrompt,
            messages: [{ role: 'user', content: message }]
        })
    });

    const data = await response.json();
    return {
        title: member.role,
        response: data.content[0].text,
        cost: estimateCost('anthropic', member.model, message, data.content[0].text),
        provider: 'Claude',
        icon: getIcon(member.role)
    };
}

async function callOpenAI(member, message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            ]
        })
    });

    const data = await response.json();
    return {
        title: member.role,
        response: data.choices[0].message.content,
        cost: estimateCost('openai', member.model, message, data.choices[0].message.content),
        provider: 'OpenAI',
        icon: getIcon(member.role)
    };
}

async function callGoogle(member, message) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${member.model}:generateContent?key=${member.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: member.systemPrompt + '\n\n' + message }]
            }]
        })
    });

    const data = await response.json();
    return {
        title: member.role,
        response: data.candidates[0].content.parts[0].text,
        cost: estimateCost('google', member.model, message, data.candidates[0].content.parts[0].text),
        provider: 'Gemini',
        icon: getIcon(member.role)
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
            ]
        })
    });

    const data = await response.json();
    return {
        title: member.role,
        response: data.choices[0].message.content,
        cost: 0, // Groq is free
        provider: 'Groq',
        icon: getIcon(member.role)
    };
}

function estimateCost(provider, model, input, output) {
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    
    const rates = {
        'anthropic': { 'claude-sonnet-4': { input: 0.003, output: 0.015 } },
        'openai': { 'gpt-4': { input: 0.03, output: 0.06 } },
        'google': { 'gemini-pro': { input: 0.00025, output: 0.0005 } }
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
