import { useEffect, useState } from "react";
import "./admin.css";

async function api(path, options = {}) {
  const res = await fetch(`/api/admin${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [mods, setMods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logSearch, setLogSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kvHealth, setKvHealth] = useState(null);
  
  async function loadAll() {
    setIsLoading(true);
    try {
      const [u, p, m, l, s] = await Promise.all([
        api("/users"),
        api("/posts"),
        api("/mods"),
        api("/logs?limit=100").catch(() => ({ result: { logs: [] } })),
        api("/logs/stats").catch(() => ({ result: null }))
      ]);
      setUsers(Array.isArray(u.result) ? u.result : []);
      setPosts(Array.isArray(p.result) ? p.result : []);
      setMods(Array.isArray(m.result) ? m.result : []);
      setLogs(Array.isArray(l.result?.logs) ? l.result.logs : []);
      setLogStats(s.result);
      setKvHealth(h.result);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    api("/status")
      .then(() => {
        setIsAuthed(true);
        return loadAll();
      })
      .catch(() => setIsAuthed(false));
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("");
    setIsLoading(true);
    try {
      await api("/login", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setIsAuthed(true);
      await loadAll();
    } catch (error) {
      setStatus(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await api("/logout", { method: "POST" });
    setIsAuthed(false);
    setUsers([]);
    setPosts([]);
    setMods([]);
    setLogs([]);
    setLogStats(null);
  }

  async function terminateUser(uid) {
    if (!window.confirm("Terminate this user account?")) return;
    await api(`/users/${encodeURIComponent(uid)}`, { method: "DELETE" });
    await loadAll();
  }

  async function deletePost(id) {
    if (!window.confirm("Delete this post?")) return;
    await api(`/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAll();
  }

  async function deleteMod(id) {
    if (!window.confirm("Delete this mod?")) return;
    await api(`/mods/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAll();
  }

  async function cleanupStaleStates() {
    if (!window.confirm("Delete all stale OAuth state entries?\n\n(Safe - they auto-expire in 10 min anyway)")) {
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await api("/cleanup-states", { method: "POST" });
      alert(`✅ Cleaned up ${result.deleted} stale entries`);
      await loadAll();
    } catch (error) {
      alert(`❌ Cleanup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteLog(rayId) {
    if (!window.confirm("Delete this error log?")) return;
    await api(`/logs/${encodeURIComponent(rayId)}`, { method: "DELETE" });
    setSelectedLog(null);
    await loadAll();
  }

  async function clearAllLogs() {
    if (!window.confirm("⚠️ Delete ALL error logs? This cannot be undone!")) return;
    const confirmAgain = window.confirm("Are you absolutely sure? Type 'DELETE' to confirm.");
    if (!confirmAgain) return;
    
    try {
      await api("/logs", { method: "DELETE" });
      await loadAll();
    } catch (error) {
      alert("Failed to clear logs: " + error.message);
    }
  }

  function viewLogDetails(log) {
    setSelectedLog(log);
  }

  function closeLogModal() {
    setSelectedLog(null);
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Filter logs based on search
  const filteredLogs = logs.filter(log => {
    if (!logSearch) return true;
    const search = logSearch.toLowerCase();
    return (
      log.rayId?.toLowerCase().includes(search) ||
      log.message?.toLowerCase().includes(search) ||
      log.path?.toLowerCase().includes(search)
    );
  });

  if (!isAuthed) {
    return (
      <section className="admin-page">
        <div className="admin-shell">
          <div className="admin-head-row">
            <h1>🔐 Eaglercraft2 Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="admin-login-form">
            <h2 style={{ color: 'var(--accent-teal)', marginBottom: '1rem', textAlign: 'center' }}>
              Administrator Access
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
              Enter your admin credentials to continue
            </p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              required
              autoFocus
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Login"}
            </button>
          </form>
          {status && <p className="admin-status">⚠️ {status}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <div className="admin-head-row">
          <h1>⚙️ Admin Control Panel</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="button" onClick={loadAll} disabled={isLoading} title="Refresh all data">
              {isLoading ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
            <button type="button" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {logStats && (
          <div className="admin-stats-bar">
            <div className="stat-item">
              <span className="stat-label">📊 Total Logs</span>
              <span className="stat-value">{logStats.totalErrors || 0}</span>
            </div>
            <div className="stat-item stat-error">
              <span className="stat-label">🚨 Critical Errors</span>
              <span className="stat-value">{logStats.errorsByType?.error || 0}</span>
            </div>
            <div className="stat-item stat-slow">
              <span className="stat-label">⏱️ Slow Requests</span>
              <span className="stat-value">{logStats.errorsByType?.slow_request || 0}</span>
            </div>
          </div>
        )}

        <div className="admin-grid">
          <section className="admin-card">
            <h2>👥 Users ({users.length})</h2>
            <div className="admin-list">
              {users.length === 0 ? (
                <div className="admin-empty">No users found</div>
              ) : (
                users.map((user) => (
                  <div key={user.uid} className="admin-item">
                    <div>
                      <strong>{user.username || user.uid}</strong>
                      <p>📧 {user.email || "No email"}</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                        {user.provider ? `via ${user.provider}` : 'Local account'}
                      </p>
                    </div>
                    <button type="button" className="danger" onClick={() => terminateUser(user.uid)}>
                      ❌ Terminate
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="admin-card">
            <h2>📝 Posts ({posts.length})</h2>
            <div className="admin-list">
              {posts.length === 0 ? (
                <div className="admin-empty">No posts found</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="admin-item">
                    <div>
                      <strong>{post.title || "Untitled Post"}</strong>
                      <p>👤 {post.authorName || "Unknown"}</p>
                    </div>
                    <button type="button" className="danger" onClick={() => deletePost(post.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="admin-card">
            <h2>🎮 Mods ({mods.length})</h2>
            <div className="admin-list">
              {mods.length === 0 ? (
                <div className="admin-empty">No mods found</div>
              ) : (
                mods.map((mod) => (
                  <div key={mod.id} className="admin-item">
                    <div>
                      <strong>{mod.title || "Untitled Mod"}</strong>
                      <p>👤 {mod.authorName || "Unknown"}</p>
                    </div>
                    <button type="button" className="danger" onClick={() => deleteMod(mod.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Error Logs Section */}
          <section className="admin-card admin-logs-card">
            <div className="admin-card-header">
              <h2>🔍 Error Log Explorer ({filteredLogs.length})</h2>
              <div className="admin-logs-controls">
                <input
                  type="text"
                  className="log-search-input"
                  placeholder="🔎 Search Ray ID, path, or message..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
                <button type="button" onClick={loadAll} disabled={isLoading} title="Refresh logs">
                  🔄
                </button>
                <button type="button" className="danger" onClick={clearAllLogs} title="Clear all logs">
                  🗑️ Clear All
                </button>
              </div>
            </div>
            <div className="admin-list admin-logs-list">
              {filteredLogs.length === 0 ? (
                <div className="admin-empty">
                  {logSearch ? "No logs match your search" : "No error logs found - system is healthy! ✨"}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.rayId} className="admin-log-item" onClick={() => viewLogDetails(log)}>
                    <div className="log-header">
                      <span className={`log-type-badge ${log.type || 'error'}`}>
                        {log.type === 'slow_request' ? '⏱️ SLOW' : '🚨 ERROR'}
                      </span>
                      <span className="log-ray-id">🆔 {log.rayId}</span>
                    </div>
                    <div className="log-message">{log.message || 'No message'}</div>
                    <div className="log-meta">
                      <span>📍 {log.path}</span>
                      <span>🕐 {formatDate(log.timestamp)}</span>
                      {log.duration && <span>⏱️ {formatDuration(log.duration)}</span>}
                      {log.country && <span>🌍 {log.country}</span>}
                      {log.method && <span>🔧 {log.method}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="admin-modal" onClick={closeLogModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>🔍 Log Details</h2>
              <button className="modal-close" onClick={closeLogModal}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="log-detail-section">
                <strong>🆔 Ray ID</strong>
                <code>{selectedLog.rayId}</code>
              </div>
              <div className="log-detail-section">
                <strong>🏷️ Type</strong>
                <span className={`log-type-badge ${selectedLog.type}`}>
                  {selectedLog.type === 'slow_request' ? '⏱️ SLOW REQUEST' : '🚨 ERROR'}
                </span>
              </div>
              <div className="log-detail-section">
                <strong>🕐 Timestamp</strong>
                <div style={{ color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                  {formatDate(selectedLog.timestamp)}
                </div>
              </div>
              <div className="log-detail-section">
                <strong>📍 Request Path</strong>
                <code>{selectedLog.path}</code>
              </div>
              <div className="log-detail-section">
                <strong>🔧 HTTP Method</strong>
                <code>{selectedLog.method}</code>
              </div>
              {selectedLog.duration && (
                <div className="log-detail-section">
                  <strong>⏱️ Duration</strong>
                  <code>{formatDuration(selectedLog.duration)}</code>
                </div>
              )}
              {selectedLog.ip && (
                <div className="log-detail-section">
                  <strong>🌐 IP Address</strong>
                  <code>{selectedLog.ip}</code>
                </div>
              )}
              {selectedLog.country && (
                <div className="log-detail-section">
                  <strong>🌍 Country</strong>
                  <code>{selectedLog.country}</code>
                </div>
              )}
              {selectedLog.userAgent && (
                <div className="log-detail-section">
                  <strong>🖥️ User Agent</strong>
                  <div className="log-detail-box">{selectedLog.userAgent}</div>
                </div>
              )}
              {selectedLog.referer && (
                <div className="log-detail-section">
                  <strong>🔗 Referer</strong>
                  <div className="log-detail-box">{selectedLog.referer}</div>
                </div>
              )}
              <div className="log-detail-section">
                <strong>💬 Error Message</strong>
                <div className="log-detail-box">{selectedLog.message}</div>
              </div>
              {selectedLog.stack && (
                <div className="log-detail-section">
                  <strong>📚 Stack Trace</strong>
                  <pre className="log-detail-stack">{selectedLog.stack}</pre>
                </div>
              )}
              <div className="admin-modal-actions">
                <button className="danger" onClick={() => deleteLog(selectedLog.rayId)}>
                  🗑️ Delete This Log
                </button>
                <button onClick={closeLogModal}>✖️ Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
