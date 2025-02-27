const express = require("express");
const { bibleDB } = require("../config");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// 📌 1️⃣ 用户提交 `prayer`
router.post("/", authMiddleware, async (req, res) => {
    const connection = await bibleDB.getConnection();
    try {
        const { title, content, isPrivate, verses } = req.body;
        const userId = req.user?.id; // 获取 JWT 用户 ID

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: Invalid user" });
        }

        if (!title || !content || typeof isPrivate === "undefined" || !Array.isArray(verses)) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        await connection.beginTransaction(); // 🚀 开始事务

        // **插入 `prayers`**
        const sqlPrayer = `INSERT INTO prayers (title, content, userId, isPrivate) VALUES (?, ?, ?, ?)`;
        const [result] = await connection.execute(sqlPrayer, [title, content, userId, isPrivate]);
        const prayerId = result.insertId;

        // **插入 `prayer_bible`**
        const sqlBible = `INSERT INTO prayer_bible (prayerId, version, b, c, v) VALUES (?, ?, ?, ?, ?)`;
        for (const verse of verses) {
            await connection.execute(sqlBible, [prayerId, verse.version, verse.b, verse.c, verse.v]);
        }

        await connection.commit(); // ✅ 提交事务
        res.json({ message: "Prayer submitted", prayerId });
    } catch (error) {
        await connection.rollback(); // ❌ 发生错误回滚
        console.error("❌ Error inserting prayer:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        connection.release();
    }
});

// 📌 2️⃣ 获取所有 `prayers`（公开的 + 当前用户的私密 `prayers`）
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // 当前用户 ID

        // **查询所有公开 `prayers` 和当前用户的私密 `prayers`**
        const sql = `
            SELECT p.id, p.title, p.content, p.isPrivate, p.createdAt, u.username,
                   pb.version, pb.b, pb.c, pb.v, b.t AS bibleText
            FROM prayers p
            JOIN users u ON p.userId = u.id
            LEFT JOIN prayer_bible pb ON p.id = pb.prayerId
            LEFT JOIN (
                SELECT 't_kjv' AS version, b, c, v, t FROM t_kjv
                UNION ALL
                SELECT 't_cn', b, c, v, t FROM t_cn
            ) b ON pb.version = b.version AND pb.b = b.b AND pb.c = b.c AND pb.v = b.v
            WHERE p.isPrivate = FALSE OR p.userId = ? -- 公开的或者是当前用户自己的
            ORDER BY p.createdAt DESC`;

        const [rows] = await bibleDB.execute(sql, [userId]);

        // **格式化结果**
        const prayers = {};
        rows.forEach(row => {
            if (!prayers[row.id]) {
                prayers[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    isPrivate: row.isPrivate,
                    createdAt: row.createdAt,
                    username: row.username,
                    verses: []
                };
            }
            if (row.bibleText) {
                prayers[row.id].verses.push({
                    version: row.version,
                    b: row.b,
                    c: row.c,
                    v: row.v,
                    text: row.bibleText
                });
            }
        });

        res.json({ prayers: Object.values(prayers) });
    } catch (error) {
        console.error("❌ Error fetching prayers:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 3️⃣ 获取当前用户自己的 `prayers`
router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // 当前用户 ID

        const sql = `
            SELECT p.id, p.title, p.content, p.isPrivate, p.createdAt, u.username,
                   pb.version, pb.b, pb.c, pb.v, b.t AS bibleText
            FROM prayers p
            JOIN users u ON p.userId = u.id
            LEFT JOIN prayer_bible pb ON p.id = pb.prayerId
            LEFT JOIN (
                SELECT 't_kjv' AS version, b, c, v, t FROM t_kjv
                UNION ALL
                SELECT 't_cn', b, c, v, t FROM t_cn
            ) b ON pb.version = b.version AND pb.b = b.b AND pb.c = b.c AND pb.v = b.v
            WHERE p.userId = ? -- 只获取当前用户的
            ORDER BY p.createdAt DESC`;

        const [rows] = await bibleDB.execute(sql, [userId]);

        const prayers = {};
        rows.forEach(row => {
            if (!prayers[row.id]) {
                prayers[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    isPrivate: row.isPrivate,
                    createdAt: row.createdAt,
                    username: row.username,
                    verses: []
                };
            }
            if (row.bibleText) {
                prayers[row.id].verses.push({
                    version: row.version,
                    b: row.b,
                    c: row.c,
                    v: row.v,
                    text: row.bibleText
                });
            }
        });

        res.json({ prayers: Object.values(prayers) });
    } catch (error) {
        console.error("❌ Error fetching prayers:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
