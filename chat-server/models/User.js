// Lite version of the User model — used by chat-server for handshake validation
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    uid:       { type: String, required: true, unique: true, index: true },
    email:     String,
    fullName:  String,
    matricule: String,
    role:      String,
    status:    String,
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
