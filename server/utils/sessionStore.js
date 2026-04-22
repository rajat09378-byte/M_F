// In-memory session store — used when MongoDB is not available
const memoryStore = new Map();

const isMongoConnected = () => {
  try {
    const mongoose = require("mongoose");
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

const saveSession = async (SessionModel, data) => {
  if (isMongoConnected()) {
    const session = new SessionModel(data);
    await session.save();
    return session;
  } else {
    // Fallback to memory
    memoryStore.set(data.sessionId, { ...data, createdAt: new Date(), updatedAt: new Date() });
    return data;
  }
};

const findSession = async (SessionModel, sessionId) => {
  if (isMongoConnected()) {
    return await SessionModel.findOne({ sessionId });
  } else {
    return memoryStore.get(sessionId) || null;
  }
};

const updateSession = async (SessionModel, sessionId, update) => {
  if (isMongoConnected()) {
    return await SessionModel.findOneAndUpdate({ sessionId }, update, { new: true });
  } else {
    const existing = memoryStore.get(sessionId);
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date() };
    memoryStore.set(sessionId, updated);
    return updated;
  }
};

const listSessions = async (SessionModel) => {
  if (isMongoConnected()) {
    return await SessionModel.find({}, "sessionId subject difficulty summary contentType createdAt")
      .sort({ createdAt: -1 })
      .limit(20);
  } else {
    return [...memoryStore.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(({ sessionId, subject, difficulty, summary, contentType, createdAt }) => ({
        sessionId, subject, difficulty, summary, contentType, createdAt,
      }));
  }
};

module.exports = { saveSession, findSession, updateSession, listSessions, memoryStore };
