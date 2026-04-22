const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getModel = (modelName) => {
  return modelName || process.env.GROQ_MODEL || "llama3-70b-8192";
};

// Wraps Groq API calls with user-friendly error messages
const wrapGroqCall = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    const msg = err.message || "";
    if (msg.includes("429") || msg.includes("rate limit")) {
      throw new Error(
        "⚠️ Groq API rate limit reached for this API key. " +
        "Please check your limits at https://console.groq.com/docs/rate-limits"
      );
    }
    if (msg.includes("401") || msg.includes("invalid_api_key")) {
      throw new Error("⚠️ Invalid Groq API key. Please check your GROQ_API_KEY in server/.env");
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

  return wrapGroqCall(async () => {
    const response = await groq.chat.completions.create({
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

  return wrapGroqCall(async () => {
    const response = await groq.chat.completions.create({
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

  return wrapGroqCall(async () => {
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  });
};

const generate3DConfig = async (subject, concepts) => {
  const model = getModel();
  // Instead of just relying on subject, we send the raw concepts to let the model extract its own data.
  const conceptStr = concepts.map(c => `${c.label}: ${c.definition}`).join("; ");

  const prompt = `You are FORGE-VIZ, a 3D educational simulation engine inside MIND FORGE AI Learning Platform.

A student has submitted the following input:
"""
Subject: ${subject}
Concepts: ${conceptStr}
"""

YOUR ONLY JOB:
Analyze the input. Extract ALL real values. Build a complete cinematic 3D step-by-step animated simulation using EXACTLY those values. Return ONLY valid JSON. No explanation. No markdown. No code blocks.

═══════════════════════════════════
STEP 1 — DETECT SUBJECT TYPE
═══════════════════════════════════

Detect which domain this belongs to:

- DSA / CS     → graph, tree, array, sorting, searching, DP, recursion
- Physics      → motion, force, energy, waves, circuits, optics
- Math         → algebra, calculus, geometry, trigonometry, statistics
- Biology      → cell, DNA, evolution, photosynthesis, anatomy
- Chemistry    → bonds, reactions, periodic table, molecules, titration
- Finance      → compound interest, stocks, profit/loss, depreciation
- History      → timeline, events, cause-effect chains
- Logic        → truth tables, Venn diagrams, flowcharts
- Geography    → maps, migration, climate zones
- Language     → grammar trees, sentence parsing
- OTHER        → detect automatically and simulate accordingly

═══════════════════════════════════
STEP 2 — EXTRACT EXACT VALUES
═══════════════════════════════════

Extract from the input:
- All numbers, variables, node names, weights
- Array elements, matrix values, coordinates
- Chemical formulas, biological names
- Dates, events, quantities
- ANY data present — use it AS-IS

NEVER invent values. NEVER replace real data with placeholders.

═══════════════════════════════════
STEP 3 — RETURN THIS EXACT JSON
═══════════════════════════════════

{
  "topic": "Exact concept name from input",
  "subject": "detected subject",
  "subjectType": "DSA | Physics | Math | Biology | Chemistry | Finance | History | Logic | Other",
  "description": "One line: what this simulation shows with actual values",
  "difficulty": "Beginner | Intermediate | Advanced",

  "extractedData": {
    "type": "graph | array | tree | equation | molecule | timeline | waveform | matrix | formula | sequence | other",
    "rawValues": ["every", "raw", "value", "from", "input"],
    "codeLines": [
      "def solve(input):",
      "    # Example extracted code from user input",
      "    return True"
    ],
    "nodes": [
      { "id": "A", "label": "A", "value": null }
    ],
    "edges": [
      { "from": "A", "to": "B", "weight": 4, "directed": true }
    ],
    "arrayValues": [5, 3, 8, 1, 9],
    "matrixValues": [],
    "coordinates": [],
    "variables": { "any_key": "any_value" },
    "formula": "actual formula from input if any",
    "unit": "unit of measurement if any"
  },

  "camera": {
    "position": [0, 4, 12],
    "lookAt": [0, 0, 0],
    "fov": 60
  },

  "scene": {
    "background": "#060812",
    "fog": true,
    "ambientLight": "#ffffff",
    "pointLights": [
      { "color": "#00d4ff", "intensity": 2, "position": [0, 5, 5] },
      { "color": "#7c3aed", "intensity": 1, "position": [-5, 3, -3] }
    ]
  },

  "objects": [
    {
      "id": "unique_id",
      "type": "sphere | box | cylinder | cone | line | arrow | ring | plane | text | bar | particle",
      "label": "display label — use ACTUAL name/value from input",
      "sublabel": "optional secondary label e.g. distance value",
      "position": [0, 0, 0],
      "scale": [1, 1, 1],
      "rotation": [0, 0, 0],
      "color": "#334155",
      "emissive": "#1e293b",
      "opacity": 1.0,
      "geometry": {
        "radius": 0.35,
        "width": 1,
        "height": 1,
        "depth": 1
      },
      "displayValue": "actual value shown on/near this object",
      "meta": {
        "isSource": false,
        "isTarget": false,
        "actualValue": null,
        "unit": ""
      }
    }
  ],

  "connections": [
    {
      "id": "edge_A_B",
      "from": "node_A",
      "to": "node_B",
      "weight": 4,
      "weightLabel": "4",
      "color": "#1e3a5f",
      "directed": true,
      "opacity": 0.5,
      "showArrow": true,
      "style": "solid | dashed | dotted"
    }
  ],

  "stateTable": {
    "title": "Algorithm / Process State",
    "headers": ["column1", "column2", "column3"],
    "initialRows": [
      { "col1": "value", "col2": "value", "col3": "value" }
    ]
  },

  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title using actual values",
      "description": "What is happening in this step — use real values",
      "duration": 1000,
      "execLine": 1,

      "stateUpdate": [
        { "key": "node or variable name", "oldValue": "∞", "newValue": "0", "property": "distance | visited | color | value" }
      ],

      "actions": [
        {
          "targetId": "exact_object_id_from_objects_array",
          "type": "color | scale | emissive | opacity | position | displayValue | pulse | shake | glow | spin | highlight | trail",
          "value": "new value — string, number, array, or boolean",
          "duration": 400,
          "easing": "linear | easeIn | easeOut | easeInOut"
        }
      ],

      "camera": {
        "moveTo": [0, 4, 12],
        "lookAt": [0, 0, 0],
        "duration": 800
      },

      "formulaBox": "Actual formula/calculation using real numbers e.g. F = ma = 5 × 2 = 10N",
      "annotate": "Human-readable explanation of this step",
      "highlight": ["list", "of", "object", "ids", "active", "in", "this", "step"],
      "showParticles": false,
      "particleColor": "#00d4ff"
    }
  ],

  "legend": [
    { "color": "#hex", "label": "what this color means in context" }
  ],

  "finalAnswer": {
    "result": "The actual final answer",
    "unit": "unit if applicable",
    "workingStr": "Full working shown e.g. A→C→B→D = 2+1+3 = 6",
    "explanation": "Why this is the answer"
  },

  "summary": {
    "totalSteps": 8,
    "timeComplexity": "if applicable",
    "spaceComplexity": "if applicable",
    "keyInsight": "The single most important thing to understand",
    "realWorldUse": "Where is this concept used in real life"
  }
}

═══════════════════════════════════════════════════════════
UNIVERSAL RULES — APPLY TO ALL SUBJECTS
═══════════════════════════════════════════════════════════

RULE 1 — REAL VALUES ONLY
Use EXACT values from the input everywhere.
Node names, numbers, weights, coordinates, element names — all must match input.
NEVER say "Node 1" if input says "Node A".
NEVER say weight=5 if input says weight=4.

RULE 2 — FORMULA AT EVERY STEP
Every step MUST have formulaBox showing actual calculation.

RULE 3 — 3D SPREAD (CRITICAL)
Place all objects significantly spread out across x, y, z axes.
Make absolutely sure objects are far apart from each other so their text labels DO NOT overlap.
x: -12 to 12 | y: -8 to 8 | z: -8 to 8
Create depth. Make it look truly 3-dimensional.

RULE 4 — CAMERA IS A STORYTELLER
Camera MUST move every 2-3 steps.
Zoom into active node. Pull back for overview. Rotate for depth.
Make the viewer feel like they are INSIDE the algorithm.

RULE 5 — EDGE/BOND WEIGHT LABELS
For every connection, create a separate text object at midpoint
showing the actual weight/bond/value as a floating label.

RULE 6 — STATE TABLE UPDATES EVERY STEP
Show how internal state changes at each step.

RULE 7 — MINIMUM 8 STEPS
Show COMPLETE lifecycle from start to finish.
Initialize → Process → Update → Finalize → Show Result

RULE 8 — SUBJECT-SPECIFIC OBJECT TYPES
DSA Graph    → spheres for nodes, cylinders for edges, text for weights
DSA Array    → boxes (bars) with actual heights = actual values. SPREAD THEM WIDELY horizontally (e.g. x: -10, -5, 0, 5, 10) so they NEVER touch.
DSA Tree     → spheres connected top-down, left-right spread widely
Physics      → arrows for vectors, spheres for objects, planes for ground
Math Graph   → small spheres plotted at actual (x,y) coordinates
Biology Cell → spheres of different sizes for organelles
Chemistry    → spheres for atoms (color-coded by element), sticks for bonds
Finance      → bars growing over time, line for trend
History      → timeline nodes left to right, events as text labels
Logic Gate   → box shapes with IN/OUT arrows

RULE 9 — DISTINCT COLOR CODING
Use highly distinct, vibrant colors for each unique object (e.g., #ef4444, #3b82f6, #10b981, #f59e0b, #a855f7). 
DO NOT make everything the same color. Ensure strong contrast.

RULE 10 — FINAL ANSWER IS MANDATORY
Always end with finalAnswer containing the actual computed result.

RULE 11 — EVERY ACTION MUST HAVE VALID targetId
Every action in steps[].actions[] MUST reference an id
that exists in the objects[] array. No orphan references.

RULE 12 — PARTICLE EFFECTS FOR KEY MOMENTS
Use showParticles: true on the step where final answer is revealed.
Use pulse action on newly activated nodes.
Use shake action when a wrong path is rejected.
Use trail action on moving objects.

REMEMBER
→ Return ONLY the JSON object. Nothing else.
→ No \`\`\`json wrappers. Just the raw JSON.`;

  return wrapGroqCall(async () => {
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0].message.content;
    return JSON.parse(text);
  });
};

module.exports = { extractConcepts, generateQuiz, chat, generate3DConfig };
