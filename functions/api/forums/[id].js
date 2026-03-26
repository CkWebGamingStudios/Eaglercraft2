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

  const posts = (await kv.get("posts", "json")) || [];
  const postIndex = posts.findIndex((entry) => entry.id === params.id);
  const post = postIndex >= 0 ? posts[postIndex] : null;

  if (!post) {
    return json({ error: "Post not found" }, 404);
  }

  if (request.method === "GET") {
    return json(post);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (body.action === "upvote") {
      post.upvotes = (post.upvotes || 0) + 1;
      posts[postIndex] = post;
      await kv.put("posts", JSON.stringify(posts));
      return json({ success: true, upvotes: post.upvotes });
    }
  }

  return json({ error: "Method not allowed" }, 405);
}
