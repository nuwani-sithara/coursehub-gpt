const mongoose = require("mongoose");

const requestLogSchema = new mongoose.Schema({
  openai: { type: Number, default: 0 },
  ollama: { type: Number, default: 0 },
  huggingface: { type: Number, default: 0 },
  cohere: { type: Number, default: 0 },
  keyword: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

requestLogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("RequestLog", requestLogSchema);
