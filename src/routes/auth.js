const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { bibleDB } = require("../config"); // ✅ 正确导入 `bibleDB`
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const router = express.Router();
const path = require("path");



// ✅ 用户注册 API
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }


 // **检查 username 是否已注册**
const [existingUsernames] = await bibleDB.execute("SELECT * FROM users WHERE username = ?", [username]);
if (existingUsernames.length > 0) {
    return res.status(400).json({ error: "Username is already taken" });
}

// **检查 email 是否已注册**
const [existingEmails] = await bibleDB.execute("SELECT * FROM users WHERE email = ?", [email]);
if (existingEmails.length > 0) {
    return res.status(400).json({ error: "Email is already registered" });
}

        // **加密密码**
        const hashedPassword = await bcrypt.hash(password, 10);

        // **默认头像 & 语言**
        const defaultAvatar = "../media/default-avatar.png"; // 替换成真实 URL
        const defaultLanguage = "t_kjv"; // 默认英文

        await bibleDB.execute(
            "INSERT INTO users (username, email, password, avatar, language) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, defaultAvatar, defaultLanguage]
        );

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 用户登录 API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        // **查询用户**
        const [rows] = await bibleDB.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(400).json({ error: "User does not exist" });
        }

        const user = rows[0];

        // **校验密码**
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        // **生成 JWT**
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // 1 小时后过期
        );

        // **返回 token & 用户信息**
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                language: user.language
            }
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 获取当前用户信息 API
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const [rows] = await bibleDB.execute(
            "SELECT id, username, email, avatar, language, reading_book, reading_chapter  FROM users WHERE id = ?",
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("❌ Error fetching user info:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 更新用户信息 API（用户名，邮箱，密码，头像 & 语言）
router.post("/update", authMiddleware, async (req, res) => {
    try {
        const { username, avatar, language, email, newPassword, oldPassword } = req.body;

        // 如果没有提供任何要更新的字段，返回错误
        if (!username && !avatar && !language && !email && !newPassword) {
            return res.status(400).json({ error: "At least one field is required for update" });
        }

        // 如果请求更新邮箱或密码，必须提供原密码
        if ((email || newPassword) && !oldPassword) {
            return res.status(400).json({ error: "Original password is required to update email or password" });
        }

        // 如果需要更新敏感字段，先验证原密码
        if (email || newPassword) {
            const [userRows] = await bibleDB.execute("SELECT password FROM users WHERE id = ?", [req.user.id]);
            if (userRows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            const isPasswordValid = await bcrypt.compare(oldPassword, userRows[0].password);
            if (!isPasswordValid) {
                return res.status(400).json({ error: "Incorrect original password" });
            }
        }

        let query = "UPDATE users SET ";
        let params = [];

        if (username) {
            query += "username = ?, ";
            params.push(username);
        }
        if (avatar) {
            query += "avatar = ?, ";
            params.push(avatar);
        }
        if (language) {
            query += "language = ?, ";
            params.push(language);
        }
        if (email) {
            // 检查邮箱是否已被其他用户注册
            const [existingEmails] = await bibleDB.execute("SELECT * FROM users WHERE email = ? AND id <> ?", [email, req.user.id]);
            if (existingEmails.length > 0) {
                return res.status(400).json({ error: "Email is already registered" });
            }
            query += "email = ?, ";
            params.push(email);
        }
        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            query += "password = ?, ";
            params.push(hashedNewPassword);
        }

        // 移除末尾多余的 `, ` 并添加 WHERE 子句
        query = query.slice(0, -2) + " WHERE id = ?";
        params.push(req.user.id);

        await bibleDB.execute(query, params);

        // 获取更新后的用户信息（不包含密码）
        const [updatedUser] = await bibleDB.execute(
            "SELECT id, username, email, avatar, language FROM users WHERE id = ?",
            [req.user.id]
        );

        res.json({ message: "Profile updated successfully", user: updatedUser[0] });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 设置 multer 存储配置（上传到 `bible-backend/src/media`）
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../media/"));
    },
    filename: function (req, file, cb) {
        cb(null, `avatar_${req.user.id}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// ✅ 头像上传 + 自动更新用户头像
router.post("/upload-avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 生成头像 URL
        const avatarUrl = `https://withelim.com/media/${req.file.filename}`;

        // 更新数据库，自动设置为当前用户的头像
        await bibleDB.execute("UPDATE users SET avatar = ? WHERE id = ?", [avatarUrl, req.user.id]);

        // 获取更新后的用户信息
        const [updatedUser] = await bibleDB.execute(
            "SELECT id, username, email, avatar, language FROM users WHERE id = ?",
            [req.user.id]
        );

        res.json({
            message: "Avatar uploaded and updated successfully",
            user: updatedUser[0]
        });

    } catch (error) {
        console.error("❌ Error uploading avatar:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 更新用户当前阅读的书 & 章节
router.post("/update-reading", authMiddleware, async (req, res) => {
    try {
        const { reading_book, reading_chapter } = req.body;

        // 确保提供了 `reading_book` 和 `reading_chapter`
        if (!reading_book || !reading_chapter) {
            return res.status(400).json({ error: "Book and chapter are required" });
        }

        // 更新用户的阅读进度
        await bibleDB.execute(
            "UPDATE users SET reading_book = ?, reading_chapter = ? WHERE id = ?",
            [reading_book, reading_chapter, req.user.id]
        );

        res.json({ message: "Reading progress updated successfully", reading_book, reading_chapter });
    } catch (error) {
        console.error("❌ Error updating reading progress:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 受保护 API（需要 JWT 认证）
router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});


//✅ 获取指定用户的公开信息（无需认证）
// 返回用户基础信息和ta公开的祷文
router.get("/public/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // 查询用户的基本信息
    const [userRows] = await bibleDB.execute(
      "SELECT id, username, email, avatar, language FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userInfo = userRows[0];

    // 查询该用户所有公开的祷文（假设 is_private 为 0 表示公开）
    const [prayersRows] = await bibleDB.execute(
      "SELECT id, title, content, created_at FROM prayers WHERE userId = ? AND is_private = 0",
      [userId]
    );

    res.json({
      user: userInfo,
      publicPrayers: prayersRows
    });
  } catch (error) {
    console.error("Error fetching public user info:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;


