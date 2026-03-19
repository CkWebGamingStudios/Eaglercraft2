export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/forums\/?/, '');
  const { ELGE_FORUMS } = env;

  // POST a new comment
  if (request.method === 'POST' && path.endsWith('/comments')) {
    const messageId = path.replace('/comments', '');
    const { comment } = await request.json();

    const messageJSON = await ELGE_FORUMS.get(messageId);
    if (!messageJSON) {
      return new Response('Message not found', { status: 404 });
    }
    
    const message = JSON.parse(messageJSON);
    
    // Ensure comments array exists
    if (!message.comments) {
      message.comments = [];
    }

    message.comments.push({ text: comment, timestamp: new Date().toISOString() });

    await ELGE_FORUMS.put(messageId, JSON.stringify(message));
    return new Response(JSON.stringify(message), { status: 201 });
  }

  // GET all messages
  if (request.method === 'GET') {
    const { keys } = await ELGE_FORUMS.list();
    const messagesPromises = keys.map(key => ELGE_FORUMS.get(key.name, { type: 'json' }));
    const messages = (await Promise.all(messagesPromises)).filter(Boolean); // Filter out potential nulls

    // Sort messages by timestamp in descending order (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST a new message
  if (request.method === 'POST') {
    const { message } = await request.json();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const data = { id, message, timestamp, comments: [] }; // Initialize with comments array
    await ELGE_FORUMS.put(id, JSON.stringify(data));
    return new Response(JSON.stringify(data), { status: 201 });
  }

  // DELETE a message
  if (request.method === 'DELETE' && path) {
    const id = path;
    await ELGE_FORUMS.delete(id);
    return new Response(null, { status: 204 });
  }

  return new Response('Not found or invalid request', { status: 404 });
}
