import { Request, Response } from "express";
import { User } from "../models/User.ts";

export const searchUsers = async (req: Request, res: Response) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: (req as any).user._id }
    }).select("name username profilePic");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendFriendRequest = async (req: any, res: Response) => {
  const { userId } = req.body;
  try {
    const userToRequest = await User.findById(userId);
    if (!userToRequest) return res.status(404).json({ message: "User not found" });

    if (userToRequest.friendRequests.includes(req.user._id)) {
      return res.status(400).json({ message: "Request already sent" });
    }

    userToRequest.friendRequests.push(req.user._id);
    await userToRequest.save();
    res.json({ message: "Friend request sent" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptFriendRequest = async (req: any, res: Response) => {
  const { userId } = req.body;
  try {
    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(userId);

    if (!currentUser || !requester) return res.status(404).json({ message: "User not found" });

    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== userId);
    currentUser.friends.push(userId);
    requester.friends.push(req.user._id);

    await currentUser.save();
    await requester.save();

    res.json({ message: "Friend request accepted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriends = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "name username profilePic status");
    res.json(user?.friends || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendRequests = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).populate("friendRequests", "name username profilePic");
    res.json(user?.friendRequests || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
