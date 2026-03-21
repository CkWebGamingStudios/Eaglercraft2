export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.ELGE_FORUMS) {
    return new Response(
      JSON.stringify({ error: "ELGE_FORUMS KV binding not found" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const key = "posts";

  // GET /api/forums
  if (request.method === "GET") {
    const data = await env.ELGE_FORUMS.get(key);
    return new Response(data || "[]", {
      headers: { "Content-Type": "application/json" }
    });
  }

  // POST /api/forums
  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { message, postId, comment } = body;
    const existing = JSON.parse((await env.ELGE_FORUMS.get(key)) || "[]");

    // Create new post
    if (message && typeof message === "string") {
      const newPost = {
        id: crypto.randomUUID(),
        message,
        comments: [],
        createdAt: new Date().toISOString()
      };

      existing.push(newPost);
      await env.ELGE_FORUMS.put(key, JSON.stringify(existing));

      return new Response(JSON.stringify(newPost), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Add comment
    if (postId && comment && typeof comment === "string") {
      const post = existing.find(p => p.id === postId);

      if (!post) {
        return new Response(
          JSON.stringify({ error: "Post not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const newComment = {
        id: crypto.randomUUID(),
        text: comment,
        createdAt: new Date().toISOString()
      };

      post.comments.push(newComment);
      await env.ELGE_FORUMS.put(key, JSON.stringify(existing));

      return new Response(JSON.stringify(newComment), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid request payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("Method Not Allowed", { status: 405 });
}