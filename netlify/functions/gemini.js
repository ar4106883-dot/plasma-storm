javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function call(request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(request.prompt);
  const response = await result.response;
  
  return {
    provider: 'gemini',
    content: response.text()
  };
}

module.exports = { call };
