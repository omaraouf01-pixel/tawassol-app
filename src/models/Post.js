import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    uid:        { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    major:      { type: String, default: "" },

    text:       { type: String, required: true, maxlength: 2000 },
    tag:        { type: String, default: "General" },

    likes:      { type: [String], default: [] }, // UIDs qui ont liké
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
