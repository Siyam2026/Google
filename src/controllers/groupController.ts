import { Request, Response } from "express";
import { Group } from "../models/Group.ts";

export const createGroup = async (req: any, res: Response) => {
  const { name, members } = req.body;
  try {
    const group = await Group.create({
      name,
      admin: req.user._id,
      members: [...members, req.user._id]
    });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroups = async (req: any, res: Response) => {
  try {
    const groups = await Group.find({ members: req.user._id });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMember = async (req: any, res: Response) => {
  const { groupId, userId } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
