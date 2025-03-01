const express = require("express");
const { bibleDB } = require("../config");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// 用户提交 `prayer`
router.post("/", authMiddleware, async (req, res) => {
    const connection = await bibleDB.getConnection();
    try {
        const { title, content, is_private, verses } = req.body;
        const userId = req.user?.id; // 获取 JWT 用户 ID

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: Invalid user" });
        }

        if (!title || !content || typeof is_private === "undefined" || !Array.isArray(verses)) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        await connection.beginTransaction(); // 🚀 开始事务

        // **插入 `prayers`**
        const sqlPrayer = `INSERT INTO prayers (title, content, userId, is_private) VALUES (?, ?, ?, ?)`;
        const [result] = await connection.execute(sqlPrayer, [title, content, userId, is_private ? 1 : 0]);
        const prayerId = result.insertId;

        // **批量插入 `prayer_bible`（减少 SQL 调用）**
        if (verses.length > 0) {
            const values = verses.map(v => `(${prayerId}, '${v.version}', ${v.b}, ${v.c}, ${v.v})`).join(", ");
            const sqlBible = `INSERT INTO prayer_bible (prayerId, version, b, c, v) VALUES ${values}`;
            await connection.execute(sqlBible);
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
// 📌 通过用户 ID 获取该用户的所有公开祷文（包括关联的经文）
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 🟢 检查 userId 是否是数字
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // 🟢 查询公开祷文 & 关联的经文
        const sql = `
            SELECT p.id, p.title, p.content, p.is_private, p.created_at, u.username,
                   pb.version, pb.b, pb.c, pb.v, b.t AS bibleText
            FROM prayers p
            JOIN users u ON p.userId = u.id
            LEFT JOIN prayer_bible pb ON p.id = pb.prayer_id
            LEFT JOIN (
                SELECT 't_kjv' AS version, b, c, v, t FROM t_kjv
                UNION ALL
                SELECT 't_cn', b, c, v, t FROM t_cn
            ) b ON pb.version = b.version AND pb.b = b.b AND pb.c = b.c AND pb.v = b.v
            WHERE p.userId = ? AND p.is_private = FALSE
            ORDER BY p.created_at DESC`;

        const [rows] = await bibleDB.execute(sql, [userId]);

        // 🟢 处理查询结果，合并相同的祷文 ID
        const prayers = {};
        rows.forEach(row => {
            if (!prayers[row.id]) {
                prayers[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    is_private: row.is_private,
                    created_at: row.created_at,
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
        console.error("❌ Error fetching user's public prayers:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// 获取所有 `prayers`（公开的 + 当前用户的私密 `prayers`）
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // 当前用户 ID

        // **查询所有公开 `prayers` 和当前用户的私密 `prayers`**
        const sql = `
            SELECT p.id, p.title, p.content, p.is_private, p.created_at, u.username,
                   pb.version, pb.b, pb.c, pb.v, b.t AS bibleText
            FROM prayers p
            JOIN users u ON p.userId = u.id
            LEFT JOIN prayer_bible pb ON p.id = pb.prayerId
            LEFT JOIN (
                SELECT 't_kjv' AS version, b, c, v, t FROM t_kjv
                UNION ALL
                SELECT 't_cn', b, c, v, t FROM t_cn
            ) b ON pb.version = b.version AND pb.b = b.b AND pb.c = b.c AND pb.v = b.v
            WHERE p.is_private = FALSE OR p.userId = ?
            ORDER BY p.created_at DESC`;

        const [rows] = await bibleDB.execute(sql, [userId]);

        // **格式化结果**
        const prayers = {};
        rows.forEach(row => {
            if (!prayers[row.id]) {
                prayers[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    is_private: Boolean(row.is_private), // ✅ 转换 `0/1` 为 `true/false`
                    created_at: row.created_at,
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

//  获取当前用户自己的 `prayers`
router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // 当前用户 ID

        const sql = `
            SELECT p.id, p.title, p.content, p.is_private, p.created_at, u.username,
                   pb.version, pb.b, pb.c, pb.v, b.t AS bibleText
            FROM prayers p
            JOIN users u ON p.userId = u.id
            LEFT JOIN prayer_bible pb ON p.id = pb.prayerId
            LEFT JOIN (
                SELECT 't_kjv' AS version, b, c, v, t FROM t_kjv
                UNION ALL
                SELECT 't_cn', b, c, v, t FROM t_cn
            ) b ON pb.version = b.version AND pb.b = b.b AND pb.c = b.c AND pb.v = b.v
            WHERE p.userId = ?
            ORDER BY p.created_at DESC`;

        const [rows] = await bibleDB.execute(sql, [userId]);

        const prayers = {};
        rows.forEach(row => {
            if (!prayers[row.id]) {
                prayers[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    is_private: Boolean(row.is_private), // ✅ 转换 `0/1` 为 `true/false`
                    created_at: row.created_at,
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
//  给`prayer`进行点赞
router.post("/:prayerId/like", authMiddleware, async (req, res) => {
    try {
        const { prayerId } = req.params;
        const userId = req.user.id;

        // 检查用户是否已经点赞
        const [existingLike] = await bibleDB.execute(
            "SELECT id FROM prayer_likes WHERE prayer_id = ? AND user_id = ?",
            [prayerId, userId]
        );
        if (existingLike.length > 0) {
            return res.status(400).json({ error: "You have already liked this prayer" });
        }

        // 插入点赞
        await bibleDB.execute(
            "INSERT INTO prayer_likes (prayer_id, user_id) VALUES (?, ?)",
            [prayerId, userId]
        );

        res.json({ message: "Prayer liked successfully!" });
    } catch (error) {
        console.error("❌ Error liking prayer:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 取消`prayer`点赞
router.delete("/:prayerId/unlike", authMiddleware, async (req, res) => {
    try {
        const { prayerId } = req.params;
        const userId = req.user.id;

        await bibleDB.execute(
            "DELETE FROM prayer_likes WHERE prayer_id = ? AND user_id = ?",
            [prayerId, userId]
        );

        res.json({ message: "Prayer unliked successfully!" });
    } catch (error) {
        console.error("❌ Error unliking prayer:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// 获取`prayer`的点赞数
router.get("/:prayerId/likes", async (req, res) => {
    try {
        const { prayerId } = req.params;

        const [likes] = await bibleDB.execute(
            "SELECT COUNT(*) AS like_count FROM prayer_likes WHERE prayer_id = ?",
            [prayerId]
        );

        res.json({ likeCount: likes[0].like_count });
    } catch (error) {
        console.error("❌ Error fetching likes:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// 发表`prayer`的评论
router.post("/:prayerId/comment", authMiddleware, async (req, res) => {
    try {
        const { prayerId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: "Comment content cannot be empty" });
        }

        await bibleDB.execute(
            "INSERT INTO prayer_comments (prayer_id, user_id, content) VALUES (?, ?, ?)",
            [prayerId, userId, content]
        );

        res.json({ message: "Comment added successfully!" });
    } catch (error) {
        console.error("❌ Error adding comment:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 获取`prayer`的评论
router.get("/:prayerId/comments", async (req, res) => {
    try {
        const { prayerId } = req.params;

        const [comments] = await bibleDB.execute(
            `SELECT c.id, c.content, c.created_at, u.username, u.avatar 
             FROM prayer_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.prayer_id = ?
             ORDER BY c.created_at ASC`,
            [prayerId]
        );

        res.json({ comments });
    } catch (error) {
        console.error("❌ Error fetching comments:", error);
        res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;
