import { useEffect, useState } from "react";

export default function ForumsV2({ profile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedMessageId, setExpandedMessageId] = useState(null);

  async function loadMessages() {
    try {
      const response = await fetch("/api/forums");
      if (!response.ok) return;
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load forum messages", error);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handlePostMessage(event) {
    event.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    try {
      const response = await fetch("/api/forums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${trimmed}\n\n— ${profile?.username || "Anonymous"}`
        })
      });

      if (!response.ok) return;
      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to create forum post", error);
    }
  }

  async function handlePostComment(messageId) {
    const draft = commentDrafts[messageId] || "";
    const trimmed = draft.trim();
    if (!trimmed) return;

    try {
      const response = await fetch(`/api/forums/${messageId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: `${trimmed} — ${profile?.username || "Anonymous"}`
        })
      });

      if (!response.ok) return;

      setCommentDrafts((prev) => ({ ...prev, [messageId]: "" }));
      await loadMessages();
    } catch (error) {
      console.error("Failed to create comment", error);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Forums</h1>
          <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300">
            {messages.length} posts
          </span>
        </div>

        <form onSubmit={handlePostMessage} className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
          <label className="mb-2 block text-sm font-medium text-zinc-300">Post a message</label>
          <textarea
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Write your forum message..."
            rows={4}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-blue-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Post Message
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {messages.map((message) => {
            const isExpanded = expandedMessageId === message.id;
            const commentCount = Array.isArray(message.comments) ? message.comments.length : 0;

            return (
              <article key={message.id} className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
                <p className="whitespace-pre-wrap text-zinc-100">{message.message}</p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedMessageId(isExpanded ? null : message.id)}
                    className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700"
                  >
                    {isExpanded ? "Hide Comments" : "Show Comments"} ({commentCount})
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-zinc-700 pt-4">
                    <div className="space-y-2">
                      {(message.comments || []).map((comment, index) => (
                        <div key={`${message.id}-comment-${index}`} className="rounded-lg bg-zinc-800 p-3 text-sm text-zinc-200">
                          <p>{comment.text}</p>
                          {comment.timestamp && (
                            <span className="mt-1 block text-xs text-zinc-400">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                      {commentCount === 0 && <p className="text-sm text-zinc-400">No comments yet.</p>}
                    </div>

                    <div>
                      <textarea
                        value={commentDrafts[message.id] || ""}
                        onChange={(event) => {
                          const { value } = event.target;
                          setCommentDrafts((prev) => ({ ...prev, [message.id]: value }));
                        }}
                        placeholder="Write a comment..."
                        rows={2}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-blue-500"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handlePostComment(message.id)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {messages.length === 0 && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center text-zinc-400">
              No forum posts yet. Be the first to post a message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
