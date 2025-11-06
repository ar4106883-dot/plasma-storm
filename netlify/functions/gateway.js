javascript
const geminiHandler = require('./gemini.js');
const openaiHandler = require('./openai.js');
const anthropicHandler = require('./anthropic.js');

exports.handler = async (event, context) => {
    // Check if the request method is POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const { prompt, provider } = JSON.parse(event.body);
        console.log(`[gateway.js] Received request for provider: ${provider}`);

        let response;
        switch (provider) {
            case 'google':
                console.log("[gateway.js] Routing to geminiHandler...");
                response = await geminiHandler.handler(event, context);
                break;
            case 'openai':
                console.log("[gateway.js] Routing to openaiHandler...");
                response = await openaiHandler.handler(event, context);
                break;
            case 'anthropic':
                console.log("[gateway.js] Routing to anthropicHandler...");
                response = await anthropicHandler.handler(event, context);
                break;
            default:
                console.error(`[gateway.js] Unknown provider: ${provider}`);
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: `Unknown provider: ${provider}` })
                };
        }
        
        console.log("[gateway.js] Successfully received response from handler.");
        return response;

    } catch (error) {
        console.error('[gateway.js] Critical Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing your request in gateway.', details: error.message })
        };
    }
};
