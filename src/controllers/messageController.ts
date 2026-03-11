import { Request, Response } from "express";
import { Message } from "../models/Message.ts";

export const getMessages = async (req: any, res: Response) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  const { receiverId, content, type, fileUrl } = req.body;
  try {
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
      fileUrl
    });
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
