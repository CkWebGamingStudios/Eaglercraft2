import { useEffect, useState } from "react";
import { ELGE } from "../elge/master/ELGE.js";
import "./play.css";

export default function Play() {
  const [bootStatus, setBootStatus] = useState("Booting Minecraft: Web Edition runtime...");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function startEngine() {
      try {
        await ELGE.engine.start();
        if (isMounted) {
          setBootStatus("Minecraft: Web Edition is ready. Click the canvas to start playing.");
        }
      } catch (error) {
        if (isMounted) {
          const message = error?.message || "Unknown error";
          setLastError(message);
          setBootStatus(`Engine failed to start: ${message}`);
        }
      }
    }

    startEngine();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="play-page">
      <div className="play-shell">
        <header className="play-header">
          <h1>Minecraft: Web Edition</h1>
          <p>{bootStatus}</p>
        </header>

        <div className="play-canvas-wrap">
          <canvas id="victus-canvas" className="play-canvas" />
        </div>

        {lastError && <div className="play-error">Tip: open /editor to verify 3D rendering and check WebGL support.</div>}

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
