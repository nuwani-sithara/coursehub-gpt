const RequestLog = require("../models/requestLog");

let requestCount = {
  openai: 0,
  ollama: 0,
  huggingface: 0,
  cohere: 0,
  keyword: 0,
  total: 0
};

// Load request count on server start
async function initRequestCount() {
  const log = await RequestLog.findOne();
  if (log) {
    requestCount = log.toObject();
    console.log("Loaded request counts from DB:", requestCount);
  } else {
    await new RequestLog(requestCount).save();
    console.log("Initialized request counts in DB");
  }
}

// Increment and save request counts
async function updateRequestCount(provider) {
  requestCount[provider]++;
  requestCount.total++;

  await RequestLog.findOneAndUpdate(
    {},
    { $set: requestCount },
    { upsert: true, new: true }
  );
}

// Get status
async function getAIStatus(req, res) {
  try {
    const log = await RequestLog.findOne();
    res.status(200).json({
      requestCount: log || requestCount,
      maxRequests: 250,
      remainingRequests: 250 - (log?.total || requestCount.total)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching request status", error: error.message });
  }
}

module.exports = { initRequestCount, updateRequestCount, getAIStatus, requestCount };
