import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "/uploads/default-avatar.png" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
