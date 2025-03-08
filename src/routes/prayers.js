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

// 编辑自己的祷文
router.put("/:prayerId", authMiddleware, async (req, res) => {
    const connection = await bibleDB.getConnection();
    try {
        const { prayerId } = req.params;
        const userId = req.user.id;
        const { title, content, is_private, verses } = req.body;

        // 检查必填字段
        if (!title || !content || typeof is_private === "undefined" || !Array.isArray(verses)) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        await connection.beginTransaction();

        // 检查该祷文是否存在且归当前用户所有
        const [rows] = await connection.execute("SELECT userId FROM prayers WHERE id = ?", [prayerId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Prayer not found" });
        }
        if (rows[0].userId !== userId) {
            await connection.rollback();
            return res.status(403).json({ error: "Unauthorized: You can only edit your own prayer" });
        }

        // 更新祷文基本信息
        const sqlUpdatePrayer = "UPDATE prayers SET title = ?, content = ?, is_private = ? WHERE id = ?";
        await connection.execute(sqlUpdatePrayer, [title, content, is_private ? 1 : 0, prayerId]);

        // 删除原有关联经文
        await connection.execute("DELETE FROM prayer_bible WHERE prayerId = ?", [prayerId]);

        // 插入新的关联经文（如果有）
        if (verses.length > 0) {
            const values = verses.map(v => `(${prayerId}, '${v.version}', ${v.b}, ${v.c}, ${v.v})`).join(", ");
            const sqlBible = `INSERT INTO prayer_bible (prayerId, version, b, c, v) VALUES ${values}`;
            await connection.execute(sqlBible);
        }

        await connection.commit();
        res.json({ message: "Prayer updated successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error updating prayer:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        connection.release();
    }
});

// 删除自己的祷文
router.delete("/:prayerId", authMiddleware, async (req, res) => {
    const connection = await bibleDB.getConnection();
    try {
        const { prayerId } = req.params;
        const userId = req.user.id;

        await connection.beginTransaction();

        // 检查该祷文是否存在且归当前用户所有
        const [rows] = await connection.execute("SELECT userId FROM prayers WHERE id = ?", [prayerId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Prayer not found" });
        }
        if (rows[0].userId !== userId) {
            await connection.rollback();
            return res.status(403).json({ error: "Unauthorized: You can only delete your own prayer" });
        }

        // 先删除关联经文，再删除祷文
        await connection.execute("DELETE FROM prayer_bible WHERE prayerId = ?", [prayerId]);
        await connection.execute("DELETE FROM prayers WHERE id = ?", [prayerId]);

        await connection.commit();
        res.json({ message: "Prayer deleted successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error deleting prayer:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        connection.release();
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

// 判断指定的用户是否点赞了指定的 prayer
router.get("/:prayerId/isliked/:userId", async (req, res) => {
    try {
      const { prayerId, userId } = req.params;
      
      // 可选：检查参数是否为数字
      if (isNaN(prayerId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
  
      // 查询指定用户是否已点赞该祷文
      const [rows] = await bibleDB.execute(
        "SELECT COUNT(*) AS count FROM prayer_likes WHERE prayer_id = ? AND user_id = ?",
        [prayerId, userId]
      );
  
      // 如果 count > 0 则表示用户已经点赞了
      const liked = rows[0].count > 0;
      res.json({ liked });
    } catch (error) {
      console.error("❌ Error checking like status:", error);
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
// 编辑评论：只有评论的作者可以编辑评论
router.put("/:prayerId/comment/:commentId", authMiddleware, async (req, res) => {
    try {
        const { prayerId, commentId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: "评论内容不能为空" });
        }

        // 获取评论信息
        const [rows] = await bibleDB.execute(
            "SELECT * FROM prayer_comments WHERE id = ? AND prayer_id = ?",
            [commentId, prayerId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "未找到对应评论" });
        }
        const comment = rows[0];

        // 检查当前用户是否为评论作者（通过 user_id 比较）
        if (comment.user_id !== userId) {
            return res.status(403).json({ error: "您只能编辑自己的评论" });
        }

        // 更新评论内容
        await bibleDB.execute(
            "UPDATE prayer_comments SET content = ? WHERE id = ?",
            [content, commentId]
        );
        res.json({ message: "评论更新成功" });
    } catch (error) {
        console.error("❌ Error updating comment:", error);
        res.status(500).json({ error: "服务器错误" });
    }
});

// 删除评论：评论作者可以删除自己的评论；同时如果登录用户是该祷文的作者，可以删除该祷文下的任意评论
router.delete("/:prayerId/comment/:commentId", authMiddleware, async (req, res) => {
    try {
        const { prayerId, commentId } = req.params;
        const userId = req.user.id;

        // 获取评论信息
        const [commentRows] = await bibleDB.execute(
            "SELECT * FROM prayer_comments WHERE id = ? AND prayer_id = ?",
            [commentId, prayerId]
        );
        if (commentRows.length === 0) {
            return res.status(404).json({ error: "未找到对应评论" });
        }
        const comment = commentRows[0];

        // 初步判断：如果评论的作者为当前用户，则允许删除
        let authorized = (comment.user_id === userId);

        // 如果当前用户不是评论作者，进一步检查当前用户是否为该祷文的作者
        if (!authorized) {
            const [prayerRows] = await bibleDB.execute(
                "SELECT userId FROM prayers WHERE id = ?",
                [prayerId]
            );
            if (prayerRows.length === 0) {
                return res.status(404).json({ error: "未找到对应祷文" });
            }
            if (prayerRows[0].userId === userId) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).json({ error: "您无权删除该评论" });
        }

        // 删除评论
        await bibleDB.execute("DELETE FROM prayer_comments WHERE id = ?", [commentId]);
        res.json({ message: "评论删除成功" });
    } catch (error) {
        console.error("❌ Error deleting comment:", error);
        res.status(500).json({ error: "服务器错误" });
    }
});
// 判断评论是否可以删除的 API（仅限登录用户使用）
router.get("/:prayerId/comment/:commentId/candelete", authMiddleware, async (req, res) => {
    const currentUserId = req.user.id;
    const { prayerId, commentId } = req.params;

    try {
        // 获取评论记录
        const [commentRows] = await bibleDB.execute(
            "SELECT * FROM prayer_comments WHERE id = ? AND prayer_id = ?",
            [commentId, prayerId]
        );
        if (commentRows.length === 0) {
            return res.json({ canDelete: false });
        }
        const comment = commentRows[0];

        // 如果当前用户是评论的作者，则允许删除
        if (comment.user_id === currentUserId) {
            return res.json({ canDelete: true });
        }

        // 如果当前用户是该祷文的作者，则允许删除所有评论
        const [prayerRows] = await bibleDB.execute(
            "SELECT userId FROM prayers WHERE id = ?",
            [prayerId]
        );
        if (prayerRows.length > 0 && prayerRows[0].userId === currentUserId) {
            return res.json({ canDelete: true });
        }

        // 其他情况返回 false
        return res.json({ canDelete: false });
    } catch (error) {
        console.error("❌ Error checking comment deletion permission:", error);
        res.status(500).json({ error: "服务器错误" });
    }
});

// ✅ 获取所有公开祷文（无需身份验证）
router.get("/public", async (req, res) => {
    try {
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
        WHERE p.is_private = FALSE
        ORDER BY p.created_at DESC`;
        
      const [rows] = await bibleDB.execute(sql);
      
      // 整理数据，将相同祷文的关联经文合并到一个数组中
      const prayers = {};
      rows.forEach(row => {
        if (!prayers[row.id]) {
          prayers[row.id] = {
            id: row.id,
            title: row.title,
            content: row.content,
            is_private: Boolean(row.is_private),
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
      console.error("❌ Error fetching public prayers:", error);
      res.status(500).json({ error: "Server error" });
    }
  });


module.exports = router;
