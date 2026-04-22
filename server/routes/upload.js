const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { extractConcepts, generateQuiz, generate3DConfig } = require("../utils/groq");
const Session = require("../models/Session");
const { saveSession } = require("../utils/sessionStore");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["text/plain", "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.match(/\.(js|py|ts|java|cpp|c|html|css|json|md)$/)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Extract text from uploaded file
const extractTextFromFile = async (file) => {
  const mimetype = file.mimetype;
  const filepath = file.path;

  if (
    mimetype === "text/plain" ||
    file.originalname.match(/\.(js|py|ts|java|cpp|c|html|css|json|md)$/)
  ) {
    return fs.readFileSync(filepath, "utf-8");
  }

  if (mimetype === "application/pdf") {
    try {
      const pdfParse = require("pdf-parse");
      const dataBuffer = fs.readFileSync(filepath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (e) {
      return `PDF content from file: ${file.originalname}. Please analyze this as a PDF document about education.`;
    }
  }

  if (mimetype.startsWith("image/")) {
    return `[Image file: ${file.originalname}] This appears to be an educational image. Please analyze it as visual educational content and extract relevant concepts.`;
  }

  return fs.readFileSync(filepath, "utf-8");
};

// Build the session payload
const buildSessionPayload = (sessionId, content, contentType, extracted, quizData, viz3D) => ({
  sessionId,
  originalContent: content,
  contentType,
  subject: extracted.subject,
  difficulty: extracted.difficulty,
  summary: extracted.summary,
  concepts: extracted.concepts,
  relationships: extracted.relationships,
  keyFacts: extracted.keyFacts,
  quiz: quizData,
  visualization3D: viz3D,
  chatHistory: [],
});

// POST /api/upload - Handle file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let content = "";
    let contentType = "text";

    if (req.file) {
      content = await extractTextFromFile(req.file);
      if (req.file.mimetype === "application/pdf") contentType = "pdf";
      else if (req.file.mimetype.startsWith("image/")) contentType = "image";
      else if (req.file.originalname.match(/\.(js|py|ts|java|cpp|c)$/)) contentType = "code";
      // Clean up uploaded file
      fs.unlink(req.file.path, () => {});
    } else if (req.body.text) {
      content = req.body.text;
      contentType = "text";
    } else {
      return res.status(400).json({ error: "No content provided" });
    }

    if (content.length < 10) {
      return res.status(400).json({ error: "Content too short to analyze" });
    }

    const truncated = content.slice(0, 8000);

    // Run all Gemini calls
    const extracted = await extractConcepts(truncated);
    const quizData = await generateQuiz(extracted.concepts, extracted.subject);
    const viz3D = await generate3DConfig(extracted.subject, extracted.concepts);

    const sessionId = uuidv4();
    const payload = buildSessionPayload(sessionId, truncated, contentType, extracted, quizData, viz3D);
    await saveSession(Session, payload);

    res.json({
      sessionId,
      subject: extracted.subject,
      difficulty: extracted.difficulty,
      summary: extracted.summary,
      concepts: extracted.concepts,
      relationships: extracted.relationships,
      keyFacts: extracted.keyFacts,
      quiz: quizData,
      visualization3D: viz3D,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to process content" });
  }
});

// POST /api/upload/text - Handle plain text input
router.post("/text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 10) {
      return res.status(400).json({ error: "Text too short to analyze" });
    }

    const truncated = text.slice(0, 8000);
    const extracted = await extractConcepts(truncated);
    const quizData = await generateQuiz(extracted.concepts, extracted.subject);
    const viz3D = await generate3DConfig(extracted.subject, extracted.concepts);

    const sessionId = uuidv4();
    const payload = buildSessionPayload(sessionId, truncated, "text", extracted, quizData, viz3D);
    await saveSession(Session, payload);

    res.json({
      sessionId,
      subject: extracted.subject,
      difficulty: extracted.difficulty,
      summary: extracted.summary,
      concepts: extracted.concepts,
      relationships: extracted.relationships,
      keyFacts: extracted.keyFacts,
      quiz: quizData,
      visualization3D: viz3D,
    });
  } catch (error) {
    console.error("Text upload error:", error);
    res.status(500).json({ error: error.message || "Failed to process content" });
  }
});

module.exports = router;
