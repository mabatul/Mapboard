const API_BASE = 'https://dummyjson.com';

export async function fetchCommentsForLocation(postId) {
    const response = await fetch(`${API_BASE}/comments/post/${postId}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.comments;
}
