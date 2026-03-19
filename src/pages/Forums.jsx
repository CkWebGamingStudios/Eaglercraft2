import React, { useState, useEffect } from 'react';
import './forums.css';

const Forums = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [visibleComments, setVisibleComments] = useState(null); // holds the id of the message whose comments are visible

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/forums');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error posting message:', error);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      const response = await fetch(`/api/forums/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handlePostComment = async (messageId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/forums/${messageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const toggleComments = (id) => {
    if (visibleComments === id) {
      setVisibleComments(null);
    } else {
      setVisibleComments(id);
    }
  };


  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="forums-container">
      <h1>Forums</h1>
      <form onSubmit={handlePostMessage} className="message-form">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write your message..."
          rows="4"
        />
        <button type="submit">Post Message</button>
      </form>
      <div className="messages-list">
        {messages.map((msg) => (
          <div key={msg.id} className="message-item">
            <p>{msg.message}</p>
            <button onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
            <button onClick={() => toggleComments(msg.id)}>
              {visibleComments === msg.id ? 'Hide Comments' : 'Show Comments'} ({msg.comments ? msg.comments.length : 0})
            </button>
            {visibleComments === msg.id && (
              <div className="comments-section">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handlePostComment(msg.id);
                }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows="2"
                  />
                  <button type="submit">Post Comment</button>
                </form>
                <div className="comments-list">
                  {msg.comments && msg.comments.map((comment, index) => (
                    <div key={index} className="comment-item">
                      <p>{comment.text}</p>
                      <span className="comment-timestamp">{new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forums;
