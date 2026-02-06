export default function App() {
  return (
    <div className="homepage">
      <header className="hero">
        <nav className="hero-nav">
          <div className="logo">Eaglercraft 2</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#showcase">Showcase</a>
            <a href="#community">Community</a>
            <button className="nav-cta">Play Now</button>
          </div>
        </nav>

        <div className="hero-content">
          <div>
            <p className="eyebrow">Low-end power. High-end ambition.</p>
            <h1>
              Build, play, and share worlds with the next-gen Eaglercraft 2
              engine.
            </h1>
            <p className="hero-sub">
              Eaglercraft 2 is a browser-first engine optimized for fast load
              times, fluid multiplayer, and zero-install play. Create immersive
              experiences that run smoothly on modest hardware.
            </p>
            <div className="hero-actions">
              <button className="primary">Launch Experience</button>
              <button className="secondary">Read the Docs</button>
            </div>
            <div className="hero-stats">
              <div>
                <span className="stat-value">120ms</span>
                <span className="stat-label">Average load time</span>
              </div>
              <div>
                <span className="stat-value">64+</span>
                <span className="stat-label">Active realms</span>
              </div>
              <div>
                <span className="stat-value">1.5k</span>
                <span className="stat-label">Creators onboarded</span>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <div className="card-header">Live Build Status</div>
            <div className="card-body">
              <div className="status-row">
                <span>Version</span>
                <span className="pill">Pre-Release 0.1.5</span>
              </div>
              <div className="status-row">
                <span>Servers Online</span>
                <span className="pill active">All systems ready</span>
              </div>
              <div className="status-row">
                <span>Next Drop</span>
                <span className="pill">PvP Arena</span>
              </div>
              <div className="card-footer">
                <p>Join the early access program to get first dibs on new maps.</p>
                <button className="secondary full">Request Access</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          id="features"
          className="section"
        >
          <h2>Everything you need for fast, frictionless play</h2>
          <p className="section-sub">
            Ship new worlds faster with streaming assets, modular build tools,
            and multiplayer-ready infrastructure.
          </p>
          <div className="feature-grid">
            {[
              {
                title: "Instant Launch",
                text: "Optimized pipelines keep your game under 10MB so players are in before the hype cools.",
              },
              {
                title: "Adaptive Performance",
                text: "Dynamic quality scaling maintains 60fps on low-end devices without sacrificing detail.",
              },
              {
                title: "Community-Ready",
                text: "Built-in social hubs, invites, and voice chat integrations power your community.",
              },
              {
                title: "Creator Tools",
                text: "Visual editors, block scripting, and asset packs help teams ship faster.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="feature-card"
              >
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="showcase"
          className="section showcase"
        >
          <div>
            <h2>Designed for creators who ship often</h2>
            <p className="section-sub">
              Schedule releases, analyze player behavior, and iterate with
              confidence using the built-in telemetry dashboard.
            </p>
            <ul className="checklist">
              <li>Real-time heatmaps and session replay</li>
              <li>Cloud sync for cross-device progression</li>
              <li>Automated rollback for live events</li>
            </ul>
          </div>
          <div className="metrics-panel">
            <div>
              <span className="metric-value">98%</span>
              <span className="metric-label">Session retention</span>
            </div>
            <div>
              <span className="metric-value">3.2x</span>
              <span className="metric-label">Faster build pipeline</span>
            </div>
            <div>
              <span className="metric-value">24/7</span>
              <span className="metric-label">Live operations support</span>
            </div>
          </div>
        </section>

        <section
          id="community"
          className="section community"
        >
          <div className="community-card">
            <h2>Join the community hub</h2>
            <p className="section-sub">
              Meet creators, test fresh worlds, and help shape the next release.
            </p>
            <div className="hero-actions">
              <button className="primary">Enter Discord</button>
              <button className="secondary">Browse Community Worlds</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <div className="logo">Eaglercraft 2</div>
          <p>Crafted for creators and players everywhere.</p>
        </div>
        <div className="footer-links">
          <a href="/privacy.html">Privacy Policy</a>
          <a href="/terms.html">Terms of Service</a>
          <a href="#features">Features</a>
          <a href="#community">Community</a>
        </div>
      </footer>
    </div>
  );
}
