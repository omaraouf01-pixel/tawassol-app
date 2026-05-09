import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // Firebase Auth UID — used as the primary external identifier
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    matricule: {
      type: String,
      required: true,
      unique: true,
    },
    studentCardUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },
    groups: {
      type: [String],
      default: [],
    },
    onboarded: {
      type: Boolean,
      default: false,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    // ─── Profil enrichi (rempli pendant l'onboarding) ───
    university: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

// Prevent re-compiling the model during Next.js hot-reloads
export default mongoose.models.User || mongoose.model("User", UserSchema);
