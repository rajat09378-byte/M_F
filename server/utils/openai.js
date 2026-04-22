const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getModel = (modelName) => {
  return modelName || process.env.OPENAI_MODEL || "gpt-4o-mini";
};

// Wraps OpenAI API calls with user-friendly error messages
const wrapOpenAICall = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    const msg = err.message || "";
    if (msg.includes("429") || msg.includes("insufficient_quota")) {
      throw new Error(
        "⚠️ OpenAI API quota exceeded or rate limit reached for this API key. " +
        "Please check your billing details at https://platform.openai.com/account/billing"
      );
    }
    if (msg.includes("401") || msg.includes("invalid_api_key")) {
      throw new Error("⚠️ Invalid OpenAI API key. Please check your OPENAI_API_KEY in server/.env");
    }
    throw err;
  }
};

const extractConcepts = async (content) => {
  const model = getModel();
  const prompt = `Analyze the following content and extract:
1. Key concepts (list of important terms/ideas)
2. Relationships between concepts
3. Definitions for each concept
4. Subject/domain detection
5. Difficulty level (beginner/intermediate/advanced)

Return ONLY valid JSON in this exact format:
{
  "subject": "detected subject area",
  "difficulty": "beginner|intermediate|advanced",
  "summary": "2-3 sentence summary of the content",
  "concepts": [
    {
      "id": "concept_id_no_spaces",
      "label": "Human Readable Label",
      "definition": "Clear definition",
      "importance": 1-10
    }
  ],
  "relationships": [
    {
      "source": "concept_id_1",
      "target": "concept_id_2",
      "label": "relationship description"
    }
  ],
  "keyFacts": ["fact 1", "fact 2", "fact 3"]
}

Content to analyze:
${content}`;

  return wrapOpenAICall(async () => {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0].message.content;
    return JSON.parse(text);
  });
};

const generateQuiz = async (concepts, subject) => {
  const model = getModel();
  const conceptList = concepts.map((c) => `${c.label}: ${c.definition}`).join("\n");

  const prompt = `Based on these concepts about ${subject}:
${conceptList}

Generate 5 multiple choice quiz questions to test understanding. Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Explanation why this answer is correct"
    }
  ]
}

Rules:
- answer is the INDEX (0-3) of the correct option
- Make questions varied: some factual, some application-based
- Distractors should be plausible but clearly wrong
- Include explanation for each answer`;

  return wrapOpenAICall(async () => {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0].message.content;
    return JSON.parse(text);
  });
};

const chat = async (message, context) => {
  const model = getModel();
  const contextStr = context
    ? `Context - Subject: ${context.subject}, Summary: ${context.summary}, Key concepts: ${context.concepts
        .slice(0, 5)
        .map((c) => c.label)
        .join(", ")}`
    : "";

  const prompt = `You are Mind Forge, an expert AI tutor. ${contextStr}

Student question: ${message}

Provide a helpful, clear, and educational response. Use examples where appropriate. 
Format your response with clear structure - use bullet points or numbered lists when explaining multiple items.
Be encouraging and supportive. Keep the response focused and concise (2-4 paragraphs max).`;

  return wrapOpenAICall(async () => {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  });
};

const generate3DConfig = async (subject, concepts) => {
  const model = getModel();
  const top5 = concepts.slice(0, 5).map((c) => c.label).join(", ");

  const prompt = `For a 3D educational visualization about "${subject}" with concepts: ${top5}

Determine the best visualization type and parameters. Return ONLY valid JSON in this exact format:
{
  "type": "solar_system|molecule|network|wave|particles",
  "title": "Visualization title",
  "description": "What this visualization shows",
  "objects": [
    {
      "name": "object name",
      "size": 1.0,
      "color": "#hexcolor",
      "description": "what it represents"
    }
  ],
  "animationSpeed": 0.5,
  "backgroundColor": "#0a0a1a"
}

Rules:
- solar_system: for physics, astronomy, planetary science
- molecule: for chemistry, biology, molecular biology
- network: for CS, networking, data structures
- wave: for physics waves, sound, light, EM spectrum
- particles: for quantum physics, particle physics, general science`;

  return wrapOpenAICall(async () => {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0].message.content;
    return JSON.parse(text);
  });
};

module.exports = { extractConcepts, generateQuiz, chat, generate3DConfig };
