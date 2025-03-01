const express = require("express");
const authMiddleware = require("../middleware/auth");
const { addFriend, getFriendRequests, updateFriendRequest, getFriendsList } = require("../models/friendModel");

const router = express.Router();

// 📌 1️⃣ 发送好友请求
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;

        if (!friendId) return res.status(400).json({ error: "Friend ID is required" });
        if (userId === friendId) return res.status(400).json({ error: "Cannot add yourself as a friend" });

        await addFriend(userId, friendId);
        res.json({ message: "Friend request sent!" });
    } catch (error) {
        console.error("❌ Error adding friend:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 2️⃣ 获取好友请求列表 (别人发送给我的)
router.get("/requests", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await getFriendRequests(userId);
        res.json({ friendRequests: requests });
    } catch (error) {
        console.error("❌ Error fetching friend requests:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 3️⃣ 处理好友请求 (接受/拒绝)
router.post("/respond", authMiddleware, async (req, res) => {
    try {
        const { friendshipId, status } = req.body;
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await updateFriendRequest(friendshipId, status);
        res.json({ message: `Friend request ${status}!` });
    } catch (error) {
        console.error("❌ Error responding to friend request:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 4️⃣ 获取好友列表
router.get("/list", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const friends = await getFriendsList(userId);
        res.json({ friends });
    } catch (error) {
        console.error("❌ Error fetching friends:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
