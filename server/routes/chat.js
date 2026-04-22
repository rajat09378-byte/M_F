const express = require("express");
const router = express.Router();
const { chat } = require("../utils/groq");
const Session = require("../models/Session");
const { findSession, updateSession } = require("../utils/sessionStore");

// POST /api/chat/:sessionId
router.post("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const session = await findSession(Session, sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const context = {
      subject: session.subject,
      summary: session.summary,
      concepts: session.concepts,
      keyFacts: session.keyFacts,
    };

    const response = await chat(message, context);

    // Save to chat history
    const newHistory = [
      ...(session.chatHistory || []),
      { role: "user", content: message, timestamp: new Date() },
      { role: "assistant", content: response, timestamp: new Date() },
    ];

    await updateSession(Session, sessionId, { chatHistory: newHistory });

    res.json({ response, sessionId });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// GET /api/chat/:sessionId/history
router.get("/:sessionId/history", async (req, res) => {
  try {
    const session = await findSession(Session, req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ history: session.chatHistory || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
