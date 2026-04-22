const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    originalContent: { type: String, required: true },
    contentType: { type: String, enum: ["text", "pdf", "image", "code"], default: "text" },
    subject: String,
    difficulty: String,
    summary: String,
    concepts: [
      {
        id: String,
        label: String,
        definition: String,
        importance: Number,
      },
    ],
    relationships: [
      {
        source: String,
        target: String,
        label: String,
      },
    ],
    keyFacts: [String],
    quiz: {
      questions: [
        {
          id: Number,
          question: String,
          options: [String],
          answer: Number,
          explanation: String,
        },
      ],
    },
    visualization3D: {
      type: String,
      title: String,
      description: String,
      objects: mongoose.Schema.Types.Mixed,
      animationSpeed: Number,
      backgroundColor: String,
    },
    chatHistory: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
