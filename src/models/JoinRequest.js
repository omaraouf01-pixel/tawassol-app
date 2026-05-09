import mongoose from "mongoose";

const JoinRequestSchema = new mongoose.Schema(
  {
    groupId:   { type: String, required: true, index: true },
    groupName: { type: String, required: true },

    userId:    { type: String, required: true, index: true },
    userName:  { type: String, required: true },
    matricule: { type: String, default: "" },

    answers:   { type: [String], default: [] },

    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

JoinRequestSchema.index({ groupId: 1, status: 1 });
// Empêche les doublons: un user ne peut avoir qu'une demande pending par groupe
JoinRequestSchema.index(
  { groupId: 1, userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.models.JoinRequest || mongoose.model("JoinRequest", JoinRequestSchema);
