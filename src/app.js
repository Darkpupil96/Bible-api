require('dotenv').config({ path: '../.env' }); // Windows 需要这样指定路径
console.log("🚀 JWT_SECRET:", process.env.JWT_SECRET);
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bibleRoutes = require("./routes/bible");
const prayerRoutes = require("./routes/prayers");
const authRoutes = require("./routes/auth");

const app = express();

// allow CORS
app.use(cors());
app.use(bodyParser.json());

// API 路由
app.use("/api/bible", bibleRoutes);
app.use("/api/prayers", prayerRoutes);
app.use("/api/auth", authRoutes);

// 服务器监听端口
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0",() => console.log(`Server running on port ${PORT}`));
