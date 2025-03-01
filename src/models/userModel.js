const { bibleDB } = require("../config");

// 获取用户信息
const getUserById = async (userId) => {
    const [rows] = await bibleDB.execute("SELECT id, username, email, avatar, language FROM users WHERE id = ?", [userId]);
    return rows[0];
};

// 更新用户信息
const updateUser = async (userId, username, avatar, language) => {
    await bibleDB.execute("UPDATE users SET username = ?, avatar = ?, language = ? WHERE id = ?", [username, avatar, language, userId]);
};

module.exports = { getUserById, updateUser };
