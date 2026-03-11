import express from "express";
import { searchUsers, sendFriendRequest, acceptFriendRequest, getFriends, getFriendRequests } from "../controllers/userController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.post("/request", protect, sendFriendRequest);
router.post("/accept", protect, acceptFriendRequest);
router.get("/friends", protect, getFriends);
router.get("/requests", protect, getFriendRequests);

export default router;
