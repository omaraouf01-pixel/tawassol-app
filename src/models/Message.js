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
    // Référence au Group._id (en string pour faciliter les requêtes)
    groupId:  { type: String, required: true, index: true },

    uid:      { type: String, required: true },
    userName: { type: String, required: true },

    text:     { type: String, default: "" },
    imageUrl: { type: String, default: null },

    replyTo:  { type: ReplySchema, default: null },
  },
  { timestamps: true }
);

// Index composé pour pagination (chronologique par groupe)
MessageSchema.index({ groupId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
