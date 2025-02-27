const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { bibleDB } = require("../config"); // ✅ 正确导入 `bibleDB`
const router = express.Router();

// ✅ Register API
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // **Check if the email exists**
        const [existingUsers] = await bibleDB.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // **encryption**
        const hashedPassword = await bcrypt.hash(password, 10);
        await bibleDB.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ USER LOGIN API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        // **User inquiry**
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

        res.json({ token });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ 认证中间件（JWT 验证）
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // 解析 Bearer Token
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 存储解码后的用户数据
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

// ✅ 受保护 API（需要 JWT 认证）
router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You have accessed a protected route!",
        user: req.user
    });
});

module.exports = router;

