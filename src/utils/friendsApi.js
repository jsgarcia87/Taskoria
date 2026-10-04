// Client for api/friends.php — friendships are mutual (request → accept).
const call = async (action, { method = 'POST', userId, body } = {}) => {
    const url = `api/friends.php?action=${action}${method === 'GET' ? `&user_id=${userId}` : ''}`;
    const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({ user_id: userId, ...body }) : undefined,
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Friends service unavailable');
    return data;
};

export const fetchFriends = (userId) => call('list', { method: 'GET', userId });
export const fetchPendingCount = (userId) => call('pending_count', { method: 'GET', userId });
export const sendFriendRequest = (userId, targetId) => call('request', { userId, body: { target_id: targetId } });
export const respondToRequest = (userId, requestId, accept) => call('respond', { userId, body: { request_id: requestId, accept } });
export const removeFriend = (userId, otherId) => call('remove', { userId, body: { other_id: otherId } });
export const importLegacyFriends = (userId, friendIds) => call('import_legacy', { userId, body: { friend_ids: friendIds } });
