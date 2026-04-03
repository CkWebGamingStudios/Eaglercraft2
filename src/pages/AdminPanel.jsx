import { useEffect, useState, useCallback } from "react";
import "./admin.css";

// Generic API wrapper for authenticated admin requests
async function api(path, options = {}) {
  const res = await fetch(`/api/admin${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export default function AdminPanel() {
  // Authentication & Global State
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Data State
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [mods, setMods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [kvHealth, setKvHealth] = useState(null);
  
  // UI Helpers
  const [selectedLog, setSelectedLog] = useState(null);
  const [logSearch, setLogSearch] = useState("");

  const showAlert = (text, type = "info") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 5000);
  };

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [u, p, m, l, s, h] = await Promise.all([
        api("/users"),
        api("/posts"),
        api("/mods"),
        api("/logs?limit=100").catch(() => ({ result: { logs: [] } })),
        api("/logs/stats").catch(() => ({ result: null })),
        api("/kv-health").catch(() => ({ result: null }))
      ]);
      setUsers(u.result || []);
      setPosts(p.result || []);
      setMods(m.result || []);
      setLogs(l.result?.logs || []);
      setLogStats(s.result);
      setKvHealth(h.result);
    } catch (err) {
      if (err.message.includes("401")) setIsAuthed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    api("/status")
      .then(() => {
        setIsAuthed(true);
        loadAll();
      })
      .catch(() => setIsAuthed(false));
  }, [loadAll]);

 // --- ACTIONS ---

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api("/login", { method: "POST", body: JSON.stringify({ password }) });
      setIsAuthed(true);
      setPassword("");
      loadAll();
    } catch (err) {
      showAlert(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api("/logout", { method: "POST" });
      setIsAuthed(false);
    } catch (err) {
      showAlert("Logout failed", "error");
    }
  }

  async function clearStaleStates() {
    if (!window.confirm("Delete all stale OAuth states?")) return;
    try {
      const res = await api("/states/clear", { method: "POST" });
      showAlert(res.message, "success");
      loadAll();
    } catch (err) {
      showAlert(err.message, "error");
    }
  }
  async function deleteItem(type, id) {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api(`/${type}s/${encodeURIComponent(id)}`, { method: "DELETE" });
      showAlert(`${type} deleted successfully`, "success");
      loadAll();
    } catch (err) {
      showAlert(err.message, "error");
    }
  }

  async function clearAllLogs() {
    if (!window.confirm("⚠️ This will permanently wipe ALL logs.")) return;
    try {
      await api("/logs", { method: "DELETE" });
      showAlert("Logs cleared", "success");
      loadAll();
    } catch (err) {
      showAlert(err.message, "error");
    }
  }

  // --- RENDERING HELPERS ---

  const formatDate = (ts) => new Date(ts).toLocaleString();

  if (!isAuthed) {
    return (
      <div className="admin-login-overlay">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>🔐 ELGE Admin</h1>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Access Dashboard"}
          </button>
          {statusMsg.text && <p className={`status-${statusMsg.type}`}>{statusMsg.text}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Eaglercraft 2</h3>
          <span>Control Panel</span>
        </div>
        <div className="sidebar-links">
          <button onClick={() => setActiveTab("overview")} className={activeTab === "overview" ? "active" : ""}>📊 Overview</button>
          <button onClick={() => setActiveTab("users")} className={activeTab === "users" ? "active" : ""}>👥 Users</button>
          <button onClick={() => setActiveTab("content")} className={activeTab === "content" ? "active" : ""}>📝 Content</button>
          <button onClick={() => setActiveTab("logs")} className={activeTab === "logs" ? "active" : ""}>🔍 Logs</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        <header className="main-header">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <div className="header-actions">
            {isLoading && <span className="loader-text">Syncing...</span>}
            <button onClick={loadAll}>🔄 Refresh Data</button>
          </div>
        </header>

        {statusMsg.text && <div className={`alert alert-${statusMsg.type}`}>{statusMsg.text}</div>}

        <div className="content-area">
          {activeTab === "overview" && (
            <div className="overview-grid">
              <div className="stat-card">
                <h4>System Health</h4>
                {kvHealth ? (
                  <div className="health-stats">
                    <p>Status: <span className={kvHealth.healthy ? "text-success" : "text-warn"}>
                      {kvHealth.healthy ? "Optimal" : "Maintenance Required"}
                    </span></p>
                    <p>Stale OAuth States: <strong>{kvHealth.staleStates}</strong></p>
                    <button onClick={clearStaleStates} className="btn-small">Clear Stale States</button>
                  </div>
                ) : <p>Loading health data...</p>}
              </div>
              <div className="stat-card">
                <h4>User Growth</h4>
                <div className="big-stat">{users.length}</div>
                <p>Registered Accounts</p>
              </div>
              <div className="stat-card">
                <h4>Error Frequency</h4>
                <div className="big-stat">{logStats?.totalErrors || 0}</div>
                <p>Logs in Database</p>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.uid}>
                      <td><strong>{u.username}</strong><br/><small>{u.uid}</small></td>
                      <td>{u.email || "N/A"}</td>
                      <td><span className="badge">{u.provider || "local"}</span></td>
                      <td>
                        <button className="btn-danger" onClick={() => deleteItem("user", u.uid)}>Terminate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "content" && (
            <div className="content-split">
              <section className="list-section">
                <h3>Forum Posts</h3>
                <div className="admin-list">
                  {posts.map(p => (
                    <div key={p.id} className="list-item">
                      <span>{p.title} <small>by {p.authorName}</small></span>
                      <button onClick={() => deleteItem("post", p.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="list-section">
                <h3>Game Mods</h3>
                <div className="admin-list">
                  {mods.map(m => (
                    <div key={m.id} className="list-item">
                      <span>{m.title} <small>by {m.authorName}</small></span>
                      <button onClick={() => deleteItem("mod", m.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="log-explorer">
              <div className="log-toolbar">
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  value={logSearch} 
                  onChange={(e) => setLogSearch(e.target.value)} 
                />
                <button className="btn-danger" onClick={clearAllLogs}>Wipe All Logs</button>
              </div>
              <div className="log-list">
                {logs.filter(l => l.message.toLowerCase().includes(logSearch.toLowerCase())).map(log => (
                  <div key={log.rayId} className={`log-entry ${log.type}`} onClick={() => setSelectedLog(log)}>
                    <span className="log-time">{formatDate(log.timestamp)}</span>
                    <span className="log-msg">{log.message}</span>
                    <span className="log-path">{log.path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Log Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Log Detail: {selectedLog.rayId}</h3>
            <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            <button onClick={() => setSelectedLog(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
