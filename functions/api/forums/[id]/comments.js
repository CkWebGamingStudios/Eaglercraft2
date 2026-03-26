function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  const postId = params.id;
  const posts = (await kv.get("posts", "json")) || [];
  const postIndex = posts.findIndex((entry) => entry.id === postId);
  const post = postIndex >= 0 ? posts[postIndex] : null;

  if (!post) {
    return json({ error: "Post not found" }, 404);
  }

  if (request.method === "GET") {
    return json(Array.isArray(post.comments) ? post.comments : []);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const content = (body.content || body.comment || "").trim();
    const authorId = body.authorId || "anonymous-user";
    const authorName = body.authorName || "Anonymous";
    const authorPicture = typeof body.authorPicture === "string" ? body.authorPicture : "";

    if (!content) {
      return json({ error: "Missing comment content" }, 400);
    }

    const comment = {
      id: crypto.randomUUID(),
      postId,
      content,
      text: content,
      authorId,
      authorName,
      authorPicture,
      createdAt: Date.now(),
      timestamp: new Date().toISOString()
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    posts[postIndex] = post;

    await kv.put("posts", JSON.stringify(posts));
    return json(comment, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}
