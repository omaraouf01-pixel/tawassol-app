import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    text:     { type: String, default: "" },
    userName: { type: String, default: "" },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    groupId:  { type: String, required: true, index: true },
    uid:      { type: String, required: true },
    userName: { type: String, required: true },
    text:     { type: String, default: "" },
    imageUrl: { type: String, default: null },
    replyTo:  { type: ReplySchema, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ groupId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
