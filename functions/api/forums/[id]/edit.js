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

  if (request.method !== "PUT") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const posts = (await kv.get("posts", "json")) || [];
  const postIndex = posts.findIndex((entry) => entry.id === params.id);
  if (postIndex < 0) {
    return json({ error: "Post not found" }, 404);
  }

  const post = posts[postIndex];
  if ((body.authorId || "") !== post.authorId) {
    return json({ error: "Forbidden" }, 403);
  }

  const title = typeof body.title === "string" ? body.title.trim() : post.title;
  const content = typeof body.content === "string" ? body.content.trim() : post.content;
  if (!title || !content) {
    return json({ error: "Title and content are required" }, 400);
  }

  const updatedPost = {
    ...post,
    title,
    content,
    message: content,
    updatedAt: Date.now()
  };

  posts[postIndex] = updatedPost;
  await kv.put("posts", JSON.stringify(posts));

  return json(updatedPost);
}
