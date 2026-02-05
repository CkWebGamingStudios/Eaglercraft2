import React, { useEffect } from "react";
import { ELGE } from "../elge/master/ELGE.js";

export default function Game() {
  useEffect(() => {
    ELGE.engine.start();
  }, []);

  return (
    <div id="game-root" style={{ width: "100vw", height: "100vh" }}>
      <canvas id="victus-canvas"></canvas>

      <input
        id="elge-console-input"
        placeholder="Type command…"
        style={{
          position: "fixed",
          bottom: 10,
          left: 10,
          width: 300
        }}
      />
    </div>
  );
}
