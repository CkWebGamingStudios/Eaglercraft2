import { useEffect, useState } from "react";
import { ELGE } from "../elge/master/ELGE.js";
import "./play.css";

export default function Play() {
  const [bootStatus, setBootStatus] = useState("Booting Minecraft: Web Edition runtime...");
  const [bootError, setBootError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function startEngine() {
      try {
        await ELGE.engine.start();
        if (isMounted) {
          setBootStatus("Minecraft: Web Edition is ready. Click the canvas to start playing.");
          setBootError(null);
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg = error?.message || "Unknown error";
          setBootStatus("Engine failed to start");
          setBootError({
            message: errorMsg,
            details: error?.stack || "",
            isWebGLError: errorMsg.includes("WebGL") || errorMsg.includes("context")
          });
        }
      }
    }

    startEngine();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRetry() {
    setIsRetrying(true);
    setBootError(null);
    setBootStatus("Retrying engine start...");
    
    try {
      await ELGE.engine.restart();
      setBootStatus("Minecraft: Web Edition is ready. Click the canvas to start playing.");
      setBootError(null);
    } catch (error) {
      const errorMsg = error?.message || "Unknown error";
      setBootStatus("Retry failed");
      setBootError({
        message: errorMsg,
        details: error?.stack || "",
        isWebGLError: errorMsg.includes("WebGL") || errorMsg.includes("context")
      });
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <section className="play-page">
      <div className="play-shell">
        <header className="play-header">
          <h1>Minecraft: Web Edition</h1>
          <p>{bootStatus}</p>
        </header>

        {bootError && (
          <div className="play-error-panel">
            <h3>⚠️ Rendering Error</h3>
            <p className="error-message">{bootError.message}</p>
            
            {bootError.isWebGLError && (
              <div className="troubleshooting">
                <h4>Troubleshooting Steps:</h4>
                <ul>
                  <li><strong>Update Graphics Drivers:</strong> Visit your GPU manufacturer's website (Intel, NVIDIA, AMD)</li>
                  <li><strong>Try Different Browser:</strong> Firefox or Chrome often have better WebGL support</li>
                  <li><strong>Enable Hardware Acceleration:</strong> Check browser settings</li>
                  <li><strong>Check WebGL Support:</strong> Visit <a href="https://get.webgl.org" target="_blank" rel="noreferrer">get.webgl.org</a></li>
                  <li><strong>System Requirements:</strong> Minimum GPU: Intel HD Graphics 4000 or equivalent</li>
                </ul>
                
                <div className="gpu-note">
                  <strong>Note:</strong> Intel HD Graphics 3000 and older GPUs are not supported due to DirectX 9 limitations.
                </div>
              </div>
            )}
            
            <div className="error-actions">
              <button 
                type="button" 
                onClick={handleRetry}
                disabled={isRetrying}
                className="retry-button"
              >
                {isRetrying ? "Retrying..." : "🔄 Retry"}
              </button>
              <button 
                type="button" 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                🔁 Reload Page
              </button>
            </div>
            
            {bootError.details && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{bootError.details}</pre>
              </details>
            )}
          </div>
        )}

        <div className="play-canvas-wrap">
          <canvas id="victus-canvas" className="play-canvas" />
        </div>

        <div className="play-console-wrap">
          <label htmlFor="elge-console-input">Developer Console</label>
          <input id="elge-console-input" placeholder="Type command…" />
        </div>

        <div className="play-help">
          <h2>Quick Controls</h2>
          <ul>
            <li>W/A/S/D: Move</li>
            <li>Mouse: Look around</li>
            <li>Space: Jump</li>
            <li>Enter command in console input for debug/runtime tools</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
