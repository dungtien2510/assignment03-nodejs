const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  client: { type: String, required: true },
  ad: { type: String, required: true },
  messages: [
    {
      time: { type: Date, required: true },
      message: { type: String, required: true },
      from: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Chat", chatSchema);
