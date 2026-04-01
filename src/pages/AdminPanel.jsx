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

  async function loadAll() {
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
    try {
      await api("/login", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setIsAuthed(true);
      await loadAll();
    } catch (error) {
      setStatus(error.message || "Login failed");
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

  async function deleteLog(rayId) {
    if (!window.confirm("Delete this error log?")) return;
    await api(`/logs/${encodeURIComponent(rayId)}`, { method: "DELETE" });
    setSelectedLog(null);
    await loadAll();
  }

  async function clearAllLogs() {
    if (!window.confirm("Delete ALL error logs? This cannot be undone!")) return;
    await api("/logs", { method: "DELETE" });
    await loadAll();
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
          <h1>Admin Panel</h1>
          <p>Sign in with ADMIN_PASS.</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              required
            />
            <button type="submit">Login</button>
          </form>
          {status && <p className="admin-status">{status}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <div className="admin-head-row">
          <h1>Admin Panel</h1>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>

        {/* Stats Bar */}
        {logStats && (
          <div className="admin-stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total Errors</span>
              <span className="stat-value">{logStats.totalErrors || 0}</span>
            </div>
            <div className="stat-item stat-error">
              <span className="stat-label">Errors</span>
              <span className="stat-value">{logStats.errorsByType?.error || 0}</span>
            </div>
            <div className="stat-item stat-slow">
              <span className="stat-label">Slow Requests</span>
              <span className="stat-value">{logStats.errorsByType?.slow_request || 0}</span>
            </div>
          </div>
        )}

        <div className="admin-grid">
          <section className="admin-card">
            <h2>Users ({users.length})</h2>
            <div className="admin-list">
              {users.map((user) => (
                <div key={user.uid} className="admin-item">
                  <div>
                    <strong>{user.username || user.uid}</strong>
                    <p>{user.email || "No email"}</p>
                  </div>
                  <button type="button" className="danger" onClick={() => terminateUser(user.uid)}>Terminate</button>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <h2>Posts ({posts.length})</h2>
            <div className="admin-list">
              {posts.map((post) => (
                <div key={post.id} className="admin-item">
                  <div>
                    <strong>{post.title || "Untitled"}</strong>
                    <p>{post.authorName || "Unknown"}</p>
                  </div>
                  <button type="button" className="danger" onClick={() => deletePost(post.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <h2>Mods ({mods.length})</h2>
            <div className="admin-list">
              {mods.map((mod) => (
                <div key={mod.id} className="admin-item">
                  <div>
                    <strong>{mod.title || "Untitled Mod"}</strong>
                    <p>{mod.authorName || "Unknown"}</p>
                  </div>
                  <button type="button" className="danger" onClick={() => deleteMod(mod.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>

          {/* Error Logs Section */}
          <section className="admin-card admin-logs-card">
            <div className="admin-card-header">
              <h2>🔍 Error Logs ({filteredLogs.length})</h2>
              <div className="admin-logs-controls">
                <input
                  type="text"
                  className="log-search-input"
                  placeholder="Search Ray ID, path, message..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
                <button type="button" onClick={loadAll} title="Refresh">🔄</button>
                <button type="button" className="danger" onClick={clearAllLogs} title="Clear all logs">🗑️</button>
              </div>
            </div>
            <div className="admin-list admin-logs-list">
              {filteredLogs.length === 0 ? (
                <div className="admin-empty">No error logs found</div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.rayId} className="admin-log-item" onClick={() => viewLogDetails(log)}>
                    <div className="log-header">
                      <span className={`log-type-badge ${log.type || 'error'}`}>
                        {log.type || 'error'}
                      </span>
                      <span className="log-ray-id">{log.rayId}</span>
                    </div>
                    <div className="log-message">{log.message || 'No message'}</div>
                    <div className="log-meta">
                      <span>📍 {log.path}</span>
                      <span>🕐 {formatDate(log.timestamp)}</span>
                      {log.duration && <span>⏱️ {log.duration}ms</span>}
                      {log.country && <span>🌍 {log.country}</span>}
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
              <h2>Error Log Details</h2>
              <button className="modal-close" onClick={closeLogModal}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="log-detail-section">
                <strong>Ray ID:</strong> <code>{selectedLog.rayId}</code>
              </div>
              <div className="log-detail-section">
                <strong>Type:</strong> <span className={`log-type-badge ${selectedLog.type}`}>{selectedLog.type}</span>
              </div>
              <div className="log-detail-section">
                <strong>Timestamp:</strong> {formatDate(selectedLog.timestamp)}
              </div>
              <div className="log-detail-section">
                <strong>Path:</strong> {selectedLog.path}
              </div>
              <div className="log-detail-section">
                <strong>Method:</strong> {selectedLog.method}
              </div>
              {selectedLog.duration && (
                <div className="log-detail-section">
                  <strong>Duration:</strong> {selectedLog.duration}ms
                </div>
              )}
              {selectedLog.ip && (
                <div className="log-detail-section">
                  <strong>IP:</strong> {selectedLog.ip}
                </div>
              )}
              {selectedLog.country && (
                <div className="log-detail-section">
                  <strong>Country:</strong> {selectedLog.country}
                </div>
              )}
              {selectedLog.userAgent && (
                <div className="log-detail-section">
                  <strong>User Agent:</strong> {selectedLog.userAgent}
                </div>
              )}
              <div className="log-detail-section">
                <strong>Message:</strong>
                <div className="log-detail-box">{selectedLog.message}</div>
              </div>
              {selectedLog.stack && (
                <div className="log-detail-section">
                  <strong>Stack Trace:</strong>
                  <pre className="log-detail-stack">{selectedLog.stack}</pre>
                </div>
              )}
              <div className="admin-modal-actions">
                <button className="danger" onClick={() => deleteLog(selectedLog.rayId)}>Delete This Log</button>
                <button onClick={closeLogModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
