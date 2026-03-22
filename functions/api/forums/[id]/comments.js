export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  const postId = params.id;
  const prefix = `post:${postId}:comment:`;

  if (request.method === "GET") {
    const list = await kv.list({ prefix });
    const comments = [];

    for (const key of list.keys) {
      const comment = await kv.get(key.name, "json");
      if (comment) comments.push(comment);
    }

    comments.sort((a, b) => a.createdAt - b.createdAt);
    return json(comments);
  }

  if (request.method === "POST") {
    const body = await request.json();
    if (!body.content || !body.authorId)
      return json({ error: "Missing fields" }, 400);

    const commentId = crypto.randomUUID();
    const comment = {
      id: commentId,
      postId,
      content: body.content,
      authorId: body.authorId,
      authorName: body.authorName || "Anonymous",
      createdAt: Date.now()
    };

    await kv.put(`${prefix}${commentId}`, JSON.stringify(comment));

    // increment comment counter
    const postKey = `post:${postId}`;
    const post = await kv.get(postKey, "json");
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      await kv.put(postKey, JSON.stringify(post));
    }

    return json(comment, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}