/**
 * Fallback comments API — same endpoints and response shapes as
 * https://dummyjson.com (comments routes only). Zero dependencies.
 *
 * Use it only if dummyjson.com is unreachable during a session:
 *
 *   node server.js          → http://localhost:4010
 *   node server.js 5000     → custom port
 *
 * Then use http://localhost:4010 as the API base URL instead of
 * https://dummyjson.com. Like DummyJSON, POST /comments/add is simulated:
 * it responds as if the comment was created but does not persist it.
 */
const http = require('http');

const PORT = Number(process.argv[2]) || 4010;

// Fixture threads keyed by the same postIds used in data/locations.js.
// postId 5 (Teatro Colón) intentionally has no comments.
const COMMENTS = [
  { id: 101, body: 'The view at sunset is unbeatable, go around 7pm.', postId: 1, likes: 7, user: { id: 190, username: 'leahw', fullName: 'Leah Gutierrez' } },
  { id: 102, body: 'Way too crowded on weekends, weekday mornings are perfect.', postId: 1, likes: 3, user: { id: 131, username: 'jacksonm', fullName: 'Jackson Morales' } },
  { id: 103, body: 'There is a great coffee place just one block away.', postId: 1, likes: 5, user: { id: 87, username: 'sofiap', fullName: 'Sofía Paz' } },
  { id: 104, body: 'The colors of the houses are amazing for photos.', postId: 12, likes: 9, user: { id: 45, username: 'mateor', fullName: 'Mateo Ríos' } },
  { id: 105, body: 'Watch the tango dancers near the main corridor!', postId: 12, likes: 6, user: { id: 12, username: 'emmaj', fullName: 'Emma Miller' } },
  { id: 106, body: 'Bring cash — some of the small shops do not take cards.', postId: 12, likes: 2, user: { id: 190, username: 'leahw', fullName: 'Leah Gutierrez' } },
  { id: 107, body: 'Beautiful walk across the bridge at night.', postId: 2, likes: 4, user: { id: 87, username: 'sofiap', fullName: 'Sofía Paz' } },
  { id: 108, body: 'The design rotates to let boats pass — worth seeing.', postId: 2, likes: 8, user: { id: 131, username: 'jacksonm', fullName: 'Jackson Morales' } },
  { id: 109, body: 'Take the guided tour, the stories are incredible.', postId: 9, likes: 5, user: { id: 45, username: 'mateor', fullName: 'Mateo Ríos' } },
  { id: 110, body: 'Easy to get lost inside — grab a map at the entrance.', postId: 9, likes: 3, user: { id: 12, username: 'emmaj', fullName: 'Emma Miller' } },
  { id: 111, body: 'The roses bloom around October, plan for spring.', postId: 11, likes: 6, user: { id: 190, username: 'leahw', fullName: 'Leah Gutierrez' } },
  { id: 112, body: 'Rent a paddle boat on the lake, kids love it.', postId: 11, likes: 4, user: { id: 87, username: 'sofiap', fullName: 'Sofía Paz' } },
];

const USERS_BY_ID = new Map(COMMENTS.map((comment) => [comment.user.id, comment.user]));
let nextCommentId = 341;

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const send = (status, payload) => {
    res.writeHead(status, { ...cors, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  const postMatch = url.pathname.match(/^\/comments\/post\/(\d+)$/);
  if (req.method === 'GET' && postMatch) {
    const postId = Number(postMatch[1]);
    const all = COMMENTS.filter((comment) => comment.postId === postId);
    const skip = Number(url.searchParams.get('skip')) || 0;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam === null ? 30 : Number(limitParam) || 0;
    const page = limit === 0 ? all.slice(skip) : all.slice(skip, skip + limit);
    send(200, { comments: page, total: all.length, skip, limit: limit === 0 ? all.length : limit });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/comments/add') {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      let input;
      try {
        input = JSON.parse(raw || '{}');
      } catch {
        send(400, { message: 'Invalid JSON body' });
        return;
      }
      if (!input.body || input.postId == null) {
        send(400, { message: 'body and postId are required' });
        return;
      }
      // Simulated, like DummyJSON: the response has no `likes` field either.
      const userId = Number(input.userId) || 5;
      send(201, {
        id: nextCommentId++,
        body: String(input.body),
        postId: Number(input.postId),
        user: USERS_BY_ID.get(userId) ?? { id: userId, username: 'emmaj', fullName: 'Emma Miller' },
      });
    });
    return;
  }

  send(404, { message: `Route ${req.method} ${url.pathname} not found` });
});

server.listen(PORT, () => {
  console.log(`Mock comments API listening on http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/comments/post/1`);
});
