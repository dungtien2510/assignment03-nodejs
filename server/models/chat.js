const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  client: {
    email: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true, ref: "user" },
  },
  ad: {
    email: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, ref: "user", required: true },
  },
  messages: [
    {
      time: { type: Date, required: true },
      message: { type: String, required: true },
      from: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Chat", chatSchema);
