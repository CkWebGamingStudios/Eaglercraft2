import "./home.css";

export default function Home({ authFailed = false }) {
  return (
    <div className="home">
      {authFailed && (
        <div className="home-auth">
          <div className="home-auth-card">
            <h3>Authentication Failed</h3>
            <p>
              We could not detect a Cf-Access-Jwt-Assertion header for this
              session. If Cloudflare Access is protecting this app, allow the
              header in CORS and verify the Service Token policy.
            </p>
            <button
              className="home-primary"
              onClick={() => window.location.reload()}
            >
              Retry Auth
            </button>
          </div>
        </div>
      )}
      <header className="home-hero">
        <nav className="home-nav">
          <div className="home-logo">ELGE</div>
          <div className="home-links">
            <a href="#features">Features</a>
            <a href="#compatibility">Compatibility</a>
            <a href="#loading">Loading</a>
          </div>
          <button className="home-cta">Launch Console</button>
        </nav>

        <div className="home-hero-content">
          <div className="home-hero-text">
            <p className="home-pill">Low-End Game Engine</p>
            <h1>Eaglercraft 2</h1>
            <p className="home-lead">
              A modern browser-first engine with a fast boot pipeline, splash
              screen, and smart compatibility checks baked in.
            </p>
            <div className="home-actions">
              <button className="home-primary">Start Session</button>
              <button className="home-secondary">View Docs</button>
            </div>
            <div className="home-status">
              <div>
                <span>Boot Mode</span>
                <strong>Realtime</strong>
              </div>
              <div>
                <span>Runtime</span>
                <strong>ELGE Core</strong>
              </div>
              <div>
                <span>Build</span>
                <strong>0.1.5</strong>
              </div>
            </div>
          </div>
          <div className="home-hero-panel">
            <div className="home-panel-card">
              <h3>Compatibility Scan</h3>
              <p>
                Automatically detects GPU, memory, and WebGL capabilities before
                the engine starts.
              </p>
              <ul>
                <li>WebGL 2.0 + fallback path</li>
                <li>Memory & input profiling</li>
                <li>Secure boot checks</li>
              </ul>
            </div>
            <div className="home-panel-card">
              <h3>Splash + Loading</h3>
              <p>
                Keep the branded splash screen visible while the engine prepares
                the runtime modules.
              </p>
              <div className="home-progress">
                <span>Initializing</span>
                <div className="home-bar">
                  <div className="home-bar-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        id="features"
        className="home-section"
      >
        <h2>Engine Highlights</h2>
        <div className="home-grid">
          <article>
            <h3>Adaptive runtime</h3>
            <p>
              ELGE adapts to low-end devices while keeping smooth frame pacing
              and input latency under control.
            </p>
          </article>
          <article>
            <h3>Command console</h3>
            <p>
              Built-in console commands let you start, route, and test gameplay
              loops without leaving the browser.
            </p>
          </article>
          <article>
            <h3>Modular boot flow</h3>
            <p>
              The boot pipeline resolves intent, scans context, and provisions
              runtime modules in seconds.
            </p>
          </article>
        </div>
      </section>

      <section
        id="compatibility"
        className="home-section home-compat"
      >
        <div>
          <h2>Compatibility & Safety</h2>
          <p>
            The ELGE compatibility scanner verifies your environment and reports
            status before the engine renders the first frame.
          </p>
        </div>
        <div className="home-checklist">
          <div>
            <span>✓</span>
            <div>
              <strong>Graphics profile</strong>
              <p>GPU tier detection and resolution scaling.</p>
            </div>
          </div>
          <div>
            <span>✓</span>
            <div>
              <strong>Input stack</strong>
              <p>Pointer + keyboard mapping with fallback.</p>
            </div>
          </div>
          <div>
            <span>✓</span>
            <div>
              <strong>Network readiness</strong>
              <p>Connectivity validation for multiplayer flows.</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="loading"
        className="home-section"
      >
        <h2>Loading Flow</h2>
        <div className="home-timeline">
          <div>
            <h4>1. Splash screen</h4>
            <p>Branding stays visible while modules stream in.</p>
          </div>
          <div>
            <h4>2. Capability check</h4>
            <p>Device profiling ensures stable defaults.</p>
          </div>
          <div>
            <h4>3. Runtime ready</h4>
            <p>Hub UI mounts after core systems initialize.</p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div>
          <strong>ELGE Runtime</strong>
          <p>Low-End Game Engine powering Eaglercraft 2.</p>
        </div>
        <button className="home-secondary">Open Status</button>
      </footer>
    </div>
  );
}
