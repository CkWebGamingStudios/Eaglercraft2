function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "ELGE_FORUMS KV not bound" }, 500);

  const posts = (await kv.get("posts", "json")) || [];

  if (request.method === "GET") {
    return json(posts);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const authorId = body.authorId || "anonymous-user";
    const authorName = body.authorName || "Anonymous";

    const legacyMessage = typeof body.message === "string" ? body.message.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    let nextTitle = title;
    let nextContent = content;

    if (legacyMessage && !nextContent) {
      const [firstLine, ...rest] = legacyMessage.split("\n");
      nextTitle = nextTitle || (firstLine || "Forum message").slice(0, 80);
      nextContent = rest.join("\n").trim() || legacyMessage;
    }

    if (!nextTitle || !nextContent) {
      return json({ error: "Missing fields" }, 400);
    }

    const post = {
      id: crypto.randomUUID(),
      title: nextTitle,
      content: nextContent,
      message: nextContent,
      image: body.image || null,
      links: Array.isArray(body.links) ? body.links : [],
      authorId,
      authorName,
      upvotes: 0,
      comments: [],
      commentsCount: 0,
      createdAt: Date.now()
    };

    posts.unshift(post);
    await kv.put("posts", JSON.stringify(posts));
    return json(post, 201);
  }

  return json({ error: "Method Not Allowed" }, 405);
}
