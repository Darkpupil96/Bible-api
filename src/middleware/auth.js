const jwt = require("jsonwebtoken");

// 📌 认证中间件（JWT 验证）
module.exports = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // 提取 Token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ 这里设置 `req.user`
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
