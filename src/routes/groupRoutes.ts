import express from "express";
import { createGroup, getGroups, addMember } from "../controllers/groupController.ts";
import { protect } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/", protect, createGroup);
router.get("/", protect, getGroups);
router.post("/add", protect, addMember);

export default router;
