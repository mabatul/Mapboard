const API_BASE = 'https://dummyjson.com';

export async function fetchCommentsForLocation(postId) {
    const response = await fetch(`${API_BASE}/comments/post/${postId}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.comments;
}

export async function addComment(postId, body) {
    const response = await fetch(`${API_BASE}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId, userId: 5 }),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}
