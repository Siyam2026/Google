import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  groupPic: { type: String, default: "/uploads/default-group.png" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const Group = mongoose.model("Group", groupSchema);
