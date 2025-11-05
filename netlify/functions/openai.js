javascript
const OpenAI = require('openai');

async function call(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: request.prompt }],
    model: 'gpt-3.5-turbo',
  });

  return {
    provider: 'openai',
    content: completion.choices[0].message.content
  };
}

module.exports = { call };
