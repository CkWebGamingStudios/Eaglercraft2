import { useState, useEffect, useRef } from 'react';
import './style/editor.css';

export default function GameEditor() {
  const [activeFile, setActiveFile] = useState(null);
  const [files, setFiles] = useState({
    'game.js': `// Main Game Logic
import { Player } from './player.js';
import { World } from './world.js';

class Game {
  constructor() {
    this.player = new Player();
    this.world = new World();
    this.running = false;
  }
  
  start() {
    this.running = true;
    this.gameLoop();
  }
  
  gameLoop() {
    if (!this.running) return;
    
    this.update();
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update() {
    this.player.update();
    this.world.update();
  }
  
  render() {
    // Rendering handled by Victus
  }
}

export default new Game();`,
    'player.js': `// Player Controller
export class Player {
  constructor() {
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.speed = 5;
    this.health = 100;
  }
  
  update() {
    // Update player physics
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;
  }
  
  move(direction) {
    switch(direction) {
      case 'forward':
        this.velocity.z -= this.speed;
        break;
      case 'backward':
        this.velocity.z += this.speed;
        break;
      case 'left':
        this.velocity.x -= this.speed;
        break;
      case 'right':
        this.velocity.x += this.speed;
        break;
    }
  }
}`,
    'world.js': `// World Management
export class World {
  constructor() {
    this.blocks = new Map();
    this.entities = [];
  }
  
  update() {
    this.entities.forEach(entity => entity.update());
  }
  
  setBlock(x, y, z, type) {
    const key = \`\${x},\${y},\${z}\`;
    this.blocks.set(key, type);
  }
  
  getBlock(x, y, z) {
    const key = \`\${x},\${y},\${z}\`;
    return this.blocks.get(key);
  }
}`
  });
  
  const [assets, setAssets] = useState([
    { id: 1, name: 'player.gltf', type: '3d-model', size: '2.4 MB' },
    { id: 2, name: 'grass.png', type: 'texture', size: '512 KB' },
    { id: 3, name: 'stone.png', type: 'texture', size: '256 KB' },
    { id: 4, name: 'jump.wav', type: 'audio', size: '48 KB' },
    { id: 5, name: 'music.mp3', type: 'audio', size: '3.2 MB' }
  ]);
  
  const [explorerTab, setExplorerTab] = useState('files');
  const [cameraSettings, setCameraSettings] = useState({
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 5, z: 10 }
  });
  
  const [gameSettings, setGameSettings] = useState({
    title: 'My Awesome Game',
    description: 'An epic adventure built with ELGE',
    version: '1.0.0',
    author: '',
    gravity: 9.8,
    tickRate: 20
  });
  
  const [publishModal, setPublishModal] = useState(false);
  const [modelViewerModal, setModelViewerModal] = useState(false);
  const canvasRef = useRef(null);
  const monacoRef = useRef(null);
  
  useEffect(() => {
    // Initialize Monaco Editor
    if (monacoRef.current) {
      loadMonacoEditor();
    }
    
    // Initialize 3D Viewport
    if (canvasRef.current) {
      init3DViewport();
    }
  }, []);
  
  const loadMonacoEditor = async () => {
    // Monaco will be loaded via CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
    script.onload = () => {
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
      window.require(['vs/editor/editor.main'], () => {
        if (monacoRef.current) {
          window.monaco.editor.create(monacoRef.current, {
            value: files[activeFile] || '',
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            fontFamily: 'JetBrains Mono, Fira Code, monospace'
          });
        }
      });
    };
    document.head.appendChild(script);
  };
  
  const init3DViewport = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Simple 3D grid visualization
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Center axes
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };
  
  const handlePublish = () => {
    setPublishModal(true);
  };
  
  const confirmPublish = async () => {
    // Package game files
    const gamePackage = {
      ...gameSettings,
      files,
      assets,
      cameraSettings,
      publishedAt: new Date().toISOString()
    };
    
    // TODO: Upload to store
    console.log('Publishing game:', gamePackage);
    alert('Game published successfully to ELGE Store!');
    setPublishModal(false);
  };
  
  return (
    <div className="editor-container">
      {/* Top Toolbar */}
      <header className="editor-toolbar">
        <div className="editor-brand">
          <span className="editor-logo">⚡</span>
          <span className="editor-title">ELGE Editor</span>
        </div>
        
        <div className="editor-actions">
          <button className="toolbar-btn" onClick={() => console.log('Save')}>
            <span className="icon">💾</span> Save
          </button>
          <button className="toolbar-btn" onClick={() => console.log('Run')}>
            <span className="icon">▶️</span> Run
          </button>
          <button className="toolbar-btn primary" onClick={handlePublish}>
            <span className="icon">🚀</span> Publish to Store
          </button>
        </div>
      </header>
      
      {/* Main Editor Layout */}
      <div className="editor-layout">
        {/* Left Sidebar - Explorer */}
        <aside className="editor-sidebar">
          <div className="explorer-tabs">
            <button 
              className={explorerTab === 'files' ? 'active' : ''} 
              onClick={() => setExplorerTab('files')}
            >
              📁 Files
            </button>
            <button 
              className={explorerTab === 'assets' ? 'active' : ''} 
              onClick={() => setExplorerTab('assets')}
            >
              🎨 Assets
            </button>
            <button 
              className={explorerTab === 'settings' ? 'active' : ''} 
              onClick={() => setExplorerTab('settings')}
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div className="explorer-content">
            {explorerTab === 'files' && (
              <div className="file-tree">
                <div className="tree-header">Project Files</div>
                {Object.keys(files).map(filename => (
                  <div 
                    key={filename}
                    className={`file-item ${activeFile === filename ? 'active' : ''}`}
                    onClick={() => setActiveFile(filename)}
                  >
                    <span className="file-icon">📄</span>
                    <span className="file-name">{filename}</span>
                  </div>
                ))}
                <button className="add-file-btn">+ New File</button>
              </div>
            )}
            
            {explorerTab === 'assets' && (
              <div className="assets-panel">
                <div className="tree-header">
                  Assets Library
                  <button className="upload-btn">Upload</button>
                </div>
                {assets.map(asset => (
                  <div key={asset.id} className="asset-item">
                    <span className="asset-icon">
                      {asset.type === '3d-model' && '🎲'}
                      {asset.type === 'texture' && '🖼️'}
                      {asset.type === 'audio' && '🔊'}
                    </span>
                    <div className="asset-info">
                      <div className="asset-name">{asset.name}</div>
                      <div className="asset-size">{asset.size}</div>
                    </div>
                  </div>
                ))}
                <button className="model-editor-btn" onClick={() => setModelViewerModal(true)}>
                  🎨 Open Blockbench
                </button>
              </div>
            )}
            
            {explorerTab === 'settings' && (
              <div className="settings-panel">
                <div className="tree-header">Game Settings</div>
                
                <div className="setting-group">
                  <label>Game Title</label>
                  <input 
                    type="text" 
                    value={gameSettings.title}
                    onChange={(e) => setGameSettings({...gameSettings, title: e.target.value})}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Description</label>
                  <textarea 
                    value={gameSettings.description}
                    onChange={(e) => setGameSettings({...gameSettings, description: e.target.value})}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Version</label>
                  <input 
                    type="text" 
                    value={gameSettings.version}
                    onChange={(e) => setGameSettings({...gameSettings, version: e.target.value})}
                  />
                </div>
                
                <div className="tree-header">Camera Settings</div>
                
                <div className="setting-group">
                  <label>Field of View</label>
                  <input 
                    type="range" 
                    min="30" 
                    max="120" 
                    value={cameraSettings.fov}
                    onChange={(e) => setCameraSettings({...cameraSettings, fov: e.target.value})}
                  />
                  <span className="setting-value">{cameraSettings.fov}°</span>
                </div>
                
                <div className="setting-group">
                  <label>Gravity</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={gameSettings.gravity}
                    onChange={(e) => setGameSettings({...gameSettings, gravity: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
        
        {/* Center - Code Editor & 3D Viewport */}
        <main className="editor-main">
          <div className="editor-split">
            {/* Code Editor */}
            <div className="code-panel">
              <div className="panel-header">
                <span className="panel-title">
                  {activeFile || 'No file selected'}
                </span>
                <div className="panel-actions">
                  <button className="icon-btn">📋</button>
                  <button className="icon-btn">🔍</button>
                </div>
              </div>
              <div ref={monacoRef} className="monaco-container"></div>
            </div>
            
            {/* 3D Viewport */}
            <div className="viewport-panel">
              <div className="panel-header">
                <span className="panel-title">3D Viewport</span>
                <div className="panel-actions">
                  <button className="icon-btn">🎥</button>
                  <button className="icon-btn">🎮</button>
                </div>
              </div>
              <canvas ref={canvasRef} className="viewport-canvas"></canvas>
              <div className="viewport-controls">
                <button className="view-btn">Front</button>
                <button className="view-btn">Side</button>
                <button className="view-btn">Top</button>
                <button className="view-btn active">Perspective</button>
              </div>
            </div>
          </div>
        </main>
        
        {/* Right Sidebar - Properties */}
        <aside className="editor-properties">
          <div className="tree-header">Properties</div>
          
          <div className="property-section">
            <div className="section-title">Transform</div>
            <div className="property-row">
              <label>Position X</label>
              <input type="number" step="0.1" defaultValue="0" />
            </div>
            <div className="property-row">
              <label>Position Y</label>
              <input type="number" step="0.1" defaultValue="0" />
            </div>
            <div className="property-row">
              <label>Position Z</label>
              <input type="number" step="0.1" defaultValue="0" />
            </div>
          </div>
          
          <div className="property-section">
            <div className="section-title">Rotation</div>
            <div className="property-row">
              <label>Rotation X</label>
              <input type="number" step="1" defaultValue="0" />
            </div>
            <div className="property-row">
              <label>Rotation Y</label>
              <input type="number" step="1" defaultValue="0" />
            </div>
            <div className="property-row">
              <label>Rotation Z</label>
              <input type="number" step="1" defaultValue="0" />
            </div>
          </div>
        </aside>
      </div>
      
      {/* Publish Modal */}
      {publishModal && (
        <div className="modal-overlay" onClick={() => setPublishModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🚀 Publish to ELGE Store</h2>
            <div className="publish-preview">
              <div className="preview-field">
                <strong>Title:</strong> {gameSettings.title}
              </div>
              <div className="preview-field">
                <strong>Description:</strong> {gameSettings.description}
              </div>
              <div className="preview-field">
                <strong>Version:</strong> {gameSettings.version}
              </div>
              <div className="preview-field">
                <strong>Files:</strong> {Object.keys(files).length} files
              </div>
              <div className="preview-field">
                <strong>Assets:</strong> {assets.length} assets
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setPublishModal(false)}>
                Cancel
              </button>
              <button className="btn-publish" onClick={confirmPublish}>
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Blockbench Model Editor Modal */}
      {modelViewerModal && (
        <div className="modal-overlay" onClick={() => setModelViewerModal(false)}>
          <div className="modal-content blockbench-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎨 3D Model Editor</h2>
            <p>Blockbench integration coming soon!</p>
            <p>For now, create models at <a href="https://blockbench.net" target="_blank">blockbench.net</a> and import them.</p>
            <button onClick={() => setModelViewerModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
