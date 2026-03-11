import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hacker-messenger";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

import authRoutes from "./src/routes/authRoutes.ts";
import userRoutes from "./src/routes/userRoutes.ts";
import messageRoutes from "./src/routes/messageRoutes.ts";
import groupRoutes from "./src/routes/groupRoutes.ts";

// ...
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

const users: Record<string, string> = {}; // userId -> socketId

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    io.emit("userStatus", { userId, status: "online" });
  });

  socket.on("sendMessage", (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }
  });

  socket.on("typing", (data) => {
    const { receiverId, isTyping, senderName } = data;
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { isTyping, senderName });
    }
  });

  // WebRTC Signaling
  socket.on("callUser", (data) => {
    const { userToCall, signalData, from, name } = data;
    const receiverSocketId = users[userToCall];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { signal: signalData, from, name });
    }
  });

  socket.on("answerCall", (data) => {
    const receiverSocketId = users[data.to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callAccepted", data.signal);
    }
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      io.emit("userStatus", { userId, status: "offline" });
    }
    console.log("User disconnected:", socket.id);
  });
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }
  
  // Serve public folder for vanilla HTML/JS
  app.use(express.static(path.join(__dirname, "public")));

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
