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
      // FIX: Added 'kv' to the destructuring and the Promise.all array
      const [u, p, m, l, s, kv] = await Promise.all([
        api("/users"),
        api("/posts"),
        api("/mods"),
        api("/logs?limit=100").catch(() => ({ result: { logs: [] } })),
        api("/logs/stats").catch(() => ({ result: null })),
        api("/kv-health").catch(() => ({ result: null }))
      ]);

      setUsers(Array.isArray(u.result) ? u.result : []);
      setPosts(Array.isArray(p.result) ? p.result : []);
      setMods(Array.isArray(m.result) ? m.result : []);
      setLogs(Array.isArray(l.result?.logs) ? l.result.logs : []);
      setLogStats(s.result);
      // FIX: Changed 'h.result' to 'kv.result'
      setKvHealth(kv?.result);
    } catch (err) {
      console.error("Load failed", err);
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
    if (!window.confirm("Delete all stale OAuth state entries?")) return;
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
    try {
      await api("/logs", { method: "DELETE" });
      await loadAll();
    } catch (error) {
      alert("Failed to clear logs: " + error.message);
    }
  }

  function viewLogDetails(log) { setSelectedLog(log); }
  function closeLogModal() { setSelectedLog(null); }
  function formatDate(ts) { return new Date(ts).toLocaleString(); }
  function formatDuration(ms) { return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`; }

  const filteredLogs = logs.filter(log => {
    if (!logSearch) return true;
    const s = logSearch.toLowerCase();
    return log.rayId?.toLowerCase().includes(s) || log.message?.toLowerCase().includes(s) || log.path?.toLowerCase().includes(s);
  });

  if (!isAuthed) {
    return (
      <section className="admin-page">
        <div className="admin-shell">
          <div className="admin-head-row"><h1>🔐 Eaglercraft2 Admin</h1></div>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required autoFocus />
            <button type="submit" disabled={isLoading}>{isLoading ? "Authenticating..." : "Login"}</button>
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
          <h1>⚙️ Admin Panel</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={loadAll} disabled={isLoading}>🔄 Refresh</button>
            <button onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {logStats && (
          <div className="admin-stats-bar">
            <div className="stat-item"><span>📊 Total Logs</span><strong>{logStats.totalErrors || 0}</strong></div>
            {kvHealth && (
              <div className="stat-item"><span>🗑️ Stale States</span><strong>{kvHealth.staleStates || 0}</strong></div>
            )}
          </div>
        )}

        <div className="admin-grid">
          {/* Users Card */}
          <section className="admin-card">
            <h2>👥 Users ({users.length})</h2>
            <div className="admin-list">
              {users.map(u => (
                <div key={u.uid} className="admin-item">
                  <span>{u.username || u.uid}</span>
                  <button className="danger" onClick={() => terminateUser(u.uid)}>❌</button>
                </div>
              ))}
            </div>
          </section>

          {/* Maintenance Card */}
          <section className="admin-card">
            <h2>🧹 Maintenance</h2>
            <button onClick={cleanupStaleStates} disabled={isLoading}>🗑️ Clean OAuth States</button>
            <button className="danger" onClick={clearAllLogs} style={{marginTop: '10px'}}>🔥 Wipe All Logs</button>
          </section>

          {/* Logs Card */}
          <section className="admin-card admin-logs-card" style={{gridColumn: '1 / -1'}}>
            <h2>🔍 Error Logs</h2>
            <input type="text" placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} />
            <div className="admin-logs-list">
              {filteredLogs.map(log => (
                <div key={log.rayId} className="admin-log-item" onClick={() => viewLogDetails(log)}>
                  <strong>{log.rayId}</strong> - {log.path}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {selectedLog && (
        <div className="admin-modal" onClick={closeLogModal}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Log: {selectedLog.rayId}</h3>
            <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            <button className="danger" onClick={() => deleteLog(selectedLog.rayId)}>Delete Entry</button>
            <button onClick={closeLogModal}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
