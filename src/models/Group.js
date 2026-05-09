import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["Leader", "Member"], default: "Member" },
  },
  { _id: false }
);

const GroupSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    subject:     { type: String, required: true },
    description: { type: String, default: "" },
    rules:       { type: String, default: "" },
    tags:        { type: [String], default: [] },
    questions:   { type: [String], default: [] },
    maxMembers:  { type: Number, default: 30, min: 2, max: 200 },

    leaderId:    { type: String, required: true, index: true },
    leaderName:  { type: String, required: true },

    // Liste plate des UIDs (pour les requêtes "groupes de l'user")
    members:     { type: [String], default: [], index: true },
    memberCount: { type: Number, default: 1 },
    membersList: { type: [MemberSchema], default: [] },

    status:      { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);
