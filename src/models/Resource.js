import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema(
  {
    groupId:  { type: String, required: true, index: true },

    name:     { type: String, required: true },
    url:      { type: String, required: true }, // URL Cloudinary

    uid:      { type: String, required: true }, // uploader UID
    uploader: { type: String, required: true }, // uploader name

    status:   { type: String, enum: ["pending", "approved"], default: "pending" },
  },
  { timestamps: true }
);

ResourceSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);
