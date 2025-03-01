const { bibleDB } = require("../config");

// 获取用户好友列表
const getFriendsList = async (userId) => {
    const [rows] = await bibleDB.execute(
        "SELECT u.id, u.username, u.avatar FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = ?",
        [userId]
    );
    return rows;
};
// 获取当前用户的好友请求 (别人发给你的)
const getFriendRequests = async (userId) => {
    const [rows] = await bibleDB.execute(
        "SELECT f.id, u.username, u.avatar FROM friends f JOIN users u ON f.user_id = u.id WHERE f.friend_id = ? AND f.status = 'pending'",
        [userId]
    );
    return rows;
};
// 处理好友请求 (接受/拒绝)
const updateFriendRequest = async (friendshipId, status) => {
    await bibleDB.execute(
        "UPDATE friends SET status = ? WHERE id = ?",
        [status, friendshipId]
    );
};

// 添加好友
const checkFriendship = async (userId, friendId) => {
    const [rows] = await bibleDB.execute(
        "SELECT * FROM friends WHERE user_id = ? AND friend_id = ?",
        [userId, friendId]
    );
    return rows.length > 0;
};

const addFriend = async (userId, friendId) => {
    if (await checkFriendship(userId, friendId)) {
        throw new Error("Already friends");
    }
    await bibleDB.execute("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", [userId, friendId]);
};

// 删除好友
const removeFriend = async (userId, friendId) => {
    await bibleDB.execute("DELETE FROM friends WHERE user_id = ? AND friend_id = ?", [userId, friendId]);
};

module.exports = { getFriendsList, addFriend, removeFriend, getFriendRequests, updateFriendRequest };
