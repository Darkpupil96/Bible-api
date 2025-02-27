const express = require("express");
const { bibleDB } = require("../config"); // 只使用 `bibleDB`
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { book, chapter, verse, v } = req.query;

        // **参数检查**
        if (!book || !chapter || !v) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        let sql, params;
        if (verse) {
            // **查询单个经文**
            sql = `SELECT v AS verse, t AS text FROM ${v} WHERE b = ? AND c = ? AND v = ?`;
            params = [book, chapter, verse];
        } else {
            // **查询整章**
            sql = `SELECT v AS verse, t AS text FROM ${v} WHERE b = ? AND c = ?`;
            params = [book, chapter];
        }

        console.log("Executing SQL:", sql, params);
        const [rows] = await bibleDB.execute(sql, params);

        res.json({ book, chapter, verse: verse || "all", version: v, verses: rows });
    } catch (error) {
        console.error("❌ Database query error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;




