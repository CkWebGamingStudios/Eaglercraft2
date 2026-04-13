import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './editor3d.css';

const Editor3D = () => {
  const mountRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [script, setScript] = useState(`// 'selected' is the current object\nif (selected) {\n  selected.rotation.y += 0.02;\n  selected.position.y = Math.sin(Date.now() * 0.002);\n}`);
  const [isLive, setIsLive] = useState(false);

  // Refs for the Three.js internals to avoid re-renders
  const sceneRef = useRef(new THREE.Scene());
  const rendererRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x0a1222);

    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light, new THREE.AmbientLight(0x404040));

    // Animation & Script Execution Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (isLive && selectedObject) {
        try {
          // Creates a scoped function to execute the user's code
          const runUserCode = new Function('selected', 'THREE', 'scene', script);
          runUserCode(selectedObject, THREE, scene);
        } catch (err) {
          console.error("Runtime Script Error:", err);
          setIsLive(false); // Stop if code crashes
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [isLive, script, selectedObject]);

  const addObject = (type) => {
    let geometry;
    if (type === 'cube') geometry = new THREE.BoxGeometry();
    else if (type === 'sphere') geometry = new THREE.SphereGeometry(0.7, 32, 32);
    
    const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${type}-${objects.length}`;
    
    sceneRef.current.add(mesh);
    setObjects([...objects, mesh]);
    setSelectedObject(mesh);
  };

  return (
    <div className="editor-layout">
      {/* Toolbar */}
      <aside className="editor-sidebar">
        <h3>Assets</h3>
        <button onClick={() => addObject('cube')}>+ Cube</button>
        <button onClick={() => addObject('sphere')}>+ Sphere</button>
        <hr />
        <div className="object-list">
          {objects.map((obj, i) => (
            <button 
              key={i} 
              className={selectedObject === obj ? 'selected' : ''} 
              onClick={() => setSelectedObject(obj)}
            >
              {obj.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="editor-canvas" ref={mountRef}></main>

      {/* Scripting & Inspector */}
      <aside className="editor-inspector">
        <h3>Scripting</h3>
        <textarea
          className="code-input"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Enter JS code here..."
        />
        <button 
          className={isLive ? "stop-btn" : "run-btn"} 
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? "🔴 Stop Script" : "▶ Run Script"}
        </button>

        {selectedObject && (
          <div className="properties">
            <h3>Properties</h3>
            <label>Color
              <input type="color" onChange={(e) => selectedObject.material.color.set(e.target.value)} />
            </label>
            <label>Scale
              <input type="range" min="0.1" max="3" step="0.1" onChange={(e) => selectedObject.scale.setScalar(e.target.value)} />
            </label>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Editor3D;
