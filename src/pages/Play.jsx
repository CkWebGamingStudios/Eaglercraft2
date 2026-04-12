import { useEffect, useState, useRef } from "react";
import { ELGE } from "../elge/master/ELGE.js";
import "./play.css";

export default function Play() {
  const canvasRef = useRef(null);
  const [bootStatus, setBootStatus] = useState("Booting Minecraft: Web Edition runtime...");
  const [bootError, setBootError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const startEngine = async () => {
    try {
      // Ensure the canvas is available in the DOM
      if (!canvasRef.current) {
        throw new Error("Canvas render target not found in DOM.");
      }

      // Pass the actual canvas element to the ELGE start method
      // This allows RendererFactory to initialize the correct context (WebGL1/2/Software)
      await ELGE.engine.start(canvasRef.current);

      setBootStatus("Minecraft: Web Edition is ready. Click the canvas to start playing.");
      setBootError(null);
    } catch (error) {
      const errorMsg = error?.message || "Unknown error";
      setBootStatus("Engine failed to start");
      
      setBootError({
        message: errorMsg,
        details: error?.stack || "",
        // Detect if the error is GPU/Driver related
        isWebGLError: /WebGL|context|graphics|I.show/i.test(errorMsg)
      });
    }
  };

  useEffect(() => {
    startEngine();
    
    // Cleanup logic to stop engine loops when navigating away
    return () => {
      if (ELGE.engine.stop) ELGE.engine.stop();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setBootError(null);
    setBootStatus("Attempting to re-initialize hardware context...");
    
    try {
      // Use restart logic if available, otherwise fallback to start
      if (ELGE.engine.restart) {
        await ELGE.engine.restart(canvasRef.current);
      } else {
        await startEngine();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <section className="play-page">
      <div className="play-shell">
        <header className="play-header">
          <h1>Minecraft: Web Edition</h1>
          <p className={bootError ? "status-text error" : "status-text"}>
            {bootStatus}
          </p>
        </header>

        {bootError && (
          <div className="play-error-panel">
            <div className="error-header">
              <h3>⚠️ {bootError.isWebGLError ? "Graphics Initialization Failed" : "Engine Error"}</h3>
              <p className="error-message">{bootError.message}</p>
            </div>
            
            {bootError.isWebGLError && (
              <div className="troubleshooting">
                <h4>Recommended Fixes:</h4>
                <ul>
                  <li><strong>Browser Compatibility:</strong> If using Chrome, try <strong>Firefox</strong>. It has superior legacy support for Intel HD 3000.</li>
                  <li><strong>Drivers:</strong> Ensure your Intel Graphics drivers are updated to the latest available version.</li>
                  <li><strong>Hardware Acceleration:</strong> Verify that "Use hardware acceleration when available" is ON in browser settings.</li>
                </ul>
                <div className="gpu-note">
                  <strong>Hardware Note:</strong> Detected legacy Intel HD 3000 series. If WebGL fails, the engine will attempt to switch to <em>Victus Software Rendering</em>.
                </div>
              </div>
            )}
            
            <div className="error-actions">
              <button onClick={handleRetry} disabled={isRetrying} className="retry-button">
                {isRetrying ? "Initializing..." : "🔄 Retry Connection"}
              </button>
              <button onClick={() => window.location.reload()} className="reload-button">
                🔁 Hard Reload
              </button>
            </div>
            
            {bootError.details && (
              <details className="error-details">
                <summary>Technical Trace</summary>
                <pre>{bootError.details}</pre>
              </details>
            )}
          </div>
        )}

        <div className="play-canvas-wrap">
          {/* Ref is assigned here so startEngine can access the element directly */}
          <canvas 
            id="victus-canvas" 
            ref={canvasRef} 
            className="play-canvas" 
          />
        </div>

        <div className="play-console-wrap">
          <label htmlFor="elge-console-input">Developer Console</label>
          <input id="elge-console-input" placeholder="Type /help for commands..." />
        </div>

        <div className="play-help">
          <h2>Controls</h2>
          <div className="controls-grid">
            <span><strong>W/A/S/D</strong> Move</span>
            <span><strong>SPACE</strong> Jump</span>
            <span><strong>MOUSE</strong> Look</span>
            <span><strong>ESC</strong> Menu</span>
          </div>
        </div>
      </div>
    </section>
  );
}
