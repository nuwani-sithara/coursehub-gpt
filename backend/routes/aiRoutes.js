const express = require("express");
const { getAIStatus } = require("../controllers/requestLogController");

const router = express.Router();

router.get("/ai-status", getAIStatus);

module.exports = router;
