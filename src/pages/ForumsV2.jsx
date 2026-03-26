import { useEffect, useState } from "react";
import "./forumsv2.css";

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
        body: JSON.stringify({ message: `${trimmed}\n\n— ${profile?.username || "Anonymous"}` })
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
        body: JSON.stringify({ comment: `${trimmed} — ${profile?.username || "Anonymous"}` })
      });

      if (!response.ok) return;

      setCommentDrafts((prev) => ({ ...prev, [messageId]: "" }));
      await loadMessages();
    } catch (error) {
      console.error("Failed to create comment", error);
    }
  }

  return (
    <section className="forums-v2-page">
      <div className="forums-v2-shell">
        <header className="forums-v2-header">
          <div>
            <h1>Forums</h1>
            <p>Talk with the community, share updates, and discuss gameplay.</p>
          </div>
          <div className="forums-v2-count">{messages.length} posts</div>
        </header>

        <form onSubmit={handlePostMessage} className="forums-v2-composer">
          <label htmlFor="forum-message">Post a message</label>
          <textarea
            id="forum-message"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Share an update, ask a question, or post patch notes..."
            rows={4}
          />
          <button type="submit">Post Message</button>
        </form>

        <div className="forums-v2-list">
          {messages.length === 0 && <div className="forums-v2-empty">No posts yet. Start the first discussion.</div>}

          {messages.map((message) => {
            const isExpanded = expandedMessageId === message.id;
            const comments = Array.isArray(message.comments) ? message.comments : [];

            return (
              <article key={message.id} className="forums-v2-card">
                <p className="forums-v2-message">{message.message}</p>

                <button
                  type="button"
                  onClick={() => setExpandedMessageId(isExpanded ? null : message.id)}
                  className="forums-v2-toggle"
                >
                  {isExpanded ? "Hide Comments" : "Show Comments"} ({comments.length})
                </button>

                {isExpanded && (
                  <div className="forums-v2-comments">
                    <div className="forums-v2-comment-list">
                      {comments.length === 0 && <p className="forums-v2-comment-empty">No comments yet.</p>}
                      {comments.map((comment, index) => (
                        <div key={`${message.id}-comment-${index}`} className="forums-v2-comment-item">
                          <p>{comment.text}</p>
                          {comment.timestamp && <time>{new Date(comment.timestamp).toLocaleString()}</time>}
                        </div>
                      ))}
                    </div>

                    <div className="forums-v2-comment-box">
                      <textarea
                        value={commentDrafts[message.id] || ""}
                        onChange={(event) => {
                          const { value } = event.target;
                          setCommentDrafts((prev) => ({ ...prev, [message.id]: value }));
                        }}
                        placeholder="Write a comment..."
                        rows={2}
                      />
                      <button type="button" onClick={() => handlePostComment(message.id)}>
                        Post Comment
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
