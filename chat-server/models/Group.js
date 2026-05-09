// Lite version of the Group model — used by chat-server to verify membership
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name:    String,
    members: [String],
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);
