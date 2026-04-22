const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const { findSession, listSessions } = require("../utils/sessionStore");

// GET /api/session/:sessionId
router.get("/:sessionId", async (req, res) => {
  try {
    const session = await findSession(Session, req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      sessionId: session.sessionId,
      subject: session.subject,
      difficulty: session.difficulty,
      summary: session.summary,
      concepts: session.concepts,
      relationships: session.relationships,
      keyFacts: session.keyFacts,
      quiz: session.quiz,
      visualization3D: session.visualization3D,
      contentType: session.contentType,
      createdAt: session.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/session - List all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await listSessions(Session);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
