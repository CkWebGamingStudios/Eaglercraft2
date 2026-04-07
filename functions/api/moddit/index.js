function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function isValidHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.ELGE_MODDIT || env.ELGE_FORUMS;
  if (!kv) return json({ error: "Moddit KV not bound" }, 500);

  const mods = (await kv.get("moddit:mods", "json")) || [];

  if (request.method === "GET") {
    return json(mods);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const game = typeof body.game === "string" ? body.game.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const downloadLink = typeof body.downloadLink === "string" ? body.downloadLink.trim() : "";

    if (!title || !description || !game || !downloadLink) {
      return json({ error: "title, description, game, and downloadLink are required" }, 400);
    }

    if (!isValidHttpUrl(downloadLink)) {
      return json({ error: "downloadLink must be a valid http/https URL" }, 400);
    }

    if (image && !isValidHttpUrl(image)) {
      return json({ error: "image must be a valid http/https URL" }, 400);
    }

    const mod = {
      id: crypto.randomUUID(),
      title,
      description,
      game,
      image,
      downloadLink,
      authorId: body.authorId || "anonymous-user",
      authorName: body.authorName || "Anonymous Developer",
      authorPicture: body.authorPicture || "",
      createdAt: Date.now()
    };

    mods.unshift(mod);
    await kv.put("moddit:mods", JSON.stringify(mods));
    return json(mod, 201);
  }

  return json({ error: "Method Not Allowed" }, 405);
}
