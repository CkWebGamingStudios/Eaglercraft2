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
  if (!res.ok) throw new Error(data?.error || "Request failed");
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
      const [u, p, m, l, s, kvh] = await Promise.all([
        api("/users"),
        api("/posts"),
        api("/mods"),
        api("/logs?limit=100").catch(() => ({ result: { logs: [] } })),
        api("/logs/stats").catch(() => ({ result: null })),
        api("/kv-health").catch(() => ({ result: null }))
      ]);

      setUsers(u.result || []);
      setPosts(p.result || []); // Fixed: Ensure this matches backend 'result'
      setMods(m.result || []);   // Fixed: Ensure this matches backend 'result'
      setLogs(l.result?.logs || []);
      setLogStats(s.result);
      setKvHealth(kvh?.result);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    api("/status").then(() => {
      setIsAuthed(true);
      loadAll();
    }).catch(() => setIsAuthed(false));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api("/login", { method: "POST", body: JSON.stringify({ password }) });
      setIsAuthed(true);
      loadAll();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const s = logSearch.toLowerCase();
    return !logSearch || 
      log.rayId?.toLowerCase().includes(s) || 
      log.message?.toLowerCase().includes(s) || 
      log.path?.toLowerCase().includes(s);
  });

  if (!isAuthed) return (
    <div className="admin-login-overlay">
      <form onSubmit={handleLogin} className="login-card">
        <h2>Admin Gateway</h2>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Secret Key" />
        <button disabled={isLoading}>{isLoading ? "Verifying..." : "Access Console"}</button>
        {status && <p className="error-msg">{status}</p>}
      </form>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Eaglercraft2 System Control</h1>
        <div className="header-actions">
          <button onClick={loadAll} className="btn-refresh">Refresh Data</button>
          <button onClick={() => api("/logout", {method: "POST"}).then(() => window.location.reload())}>Logout</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-box"><span>Users</span><strong>{users.length}</strong></div>
        <div className="stat-box"><span>Posts</span><strong>{posts.length}</strong></div>
        <div className="stat-box"><span>Mods</span><strong>{mods.length}</strong></div>
        <div className="stat-box"><span>Health</span><strong>{kvHealth?.healthy ? "Healthy" : "Check States"}</strong></div>
      </div>

      <main className="dashboard-grid">
        {/* Content Lists */}
        <section className="content-card">
          <h3>Recent Posts</h3>
          <div className="data-list">
            {posts.map(p => (
              <div key={p.id} className="data-item">
                <span>{p.title} <small>by {p.authorName}</small></span>
                <button className="btn-del">Delete</button>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card">
          <h3>Mods Library</h3>
          <div className="data-list">
            {mods.map(m => (
              <div key={m.id} className="data-item">
                <span>{m.title} <small>v{m.version || '1.0'}</small></span>
                <button className="btn-del">Remove</button>
              </div>
            ))}
          </div>
        </section>

        {/* Improved Log Search Section */}
        <section className="logs-section" style={{ gridColumn: "1 / -1" }}>
          <div className="logs-header">
            <h3>System Logs</h3>
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search logs by RayID, Path, or Error..." 
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
              />
              {logSearch && <button onClick={() => setLogSearch("")}>Clear</button>}
            </div>
            <button className="btn-danger-outline" onClick={() => api("/logs", {method: "DELETE"}).then(loadAll)}>Clear All Logs</button>
          </div>
          
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>RayID</th>
                  <th>Path</th>
                  <th>Message</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.rayId} onClick={() => setSelectedLog(log)}>
                    <td><code>{log.rayId?.slice(0,8)}...</code></td>
                    <td>{log.path}</td>
                    <td className="log-msg-cell">{log.message}</td>
                    <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Log Detail: {selectedLog.rayId}</h2>
            <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            <button onClick={() => setSelectedLog(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
