require("dotenv").config();
const mysql = require("mysql2/promise");

// 连接英文圣经数据库
const bibleDB = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_BIBLE, // 英文圣经
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


module.exports = { bibleDB};


