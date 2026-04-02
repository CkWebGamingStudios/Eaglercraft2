import { useEffect, useRef, useState } from "react";
import "./play.css";

export default function Play() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [gameInfo, setGameInfo] = useState({
    position: 'Loading...',
    chunk: '',
    chunks: '',
    fps: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let infoInterval = null;

    async function initGame() {
      try {
        setIsLoading(true);
        
        // Dynamically import the game
        const { MinecraftGame } = await import('https://ckwebgamingstudios.github.io/Minecraft-Web-Edition/index.js');
        
        if (!mounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create and start game
        const game = new MinecraftGame(canvas);
        gameRef.current = game;
        
        game.start();
        
        // Update info display
        infoInterval = setInterval(() => {
          if (gameRef.current) {
            setGameInfo(gameRef.current.getInfo());
          }
        }, 100);

        setIsLoading(false);
      } catch (err) {
        console.error('[Play] Failed to start game:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    initGame();

    return () => {
      mounted = false;
      if (infoInterval) clearInterval(infoInterval);
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  return (
    <section className="play-page">
      <div className="play-shell">
        <header className="play-header">
          <h1>Minecraft: Web Edition</h1>
          <p>
            {isLoading ? 'Loading game engine...' : 
             error ? `Error: ${error}` :
             'Click canvas to play. Use WASD to move, Space to jump, Mouse to look around.'}
          </p>
        </header>

        <div className="play-canvas-wrap">
          <canvas ref={canvasRef} className="play-canvas" />
          
          {!isLoading && !error && (
            <div className="play-hud">
              <div className="hud-item">{gameInfo.position}</div>
              <div className="hud-item">{gameInfo.chunk}</div>
              <div className="hud-item">{gameInfo.chunks}</div>
              <div className="hud-item crosshair">+</div>
            </div>
          )}
        </div>

        <div className="play-help">
          <h2>Controls</h2>
          <ul>
            <li><strong>W/A/S/D</strong> - Move forward/left/backward/right</li>
            <li><strong>Space</strong> - Jump</li>
            <li><strong>Mouse</strong> - Look around (click canvas first)</li>
            <li><strong>ESC</strong> - Release mouse</li>
          </ul>
        </div>

        <div className="play-info">
          <h2>About</h2>
          <p>
            Minecraft: Web Edition is powered by the <strong>ELGE</strong> (Eaglercraft Low-End Game Engine)
            with procedural terrain generation, real-time chunk loading, and optimized WebGL rendering.
          </p>
        </div>
      </div>
    </section>
  );
}
