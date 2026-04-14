import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as THREE from 'three';

const Editor3d = () => {
    // FIX: State is an object where each key is a unique file
    const [files, setFiles] = useState({
        'player.js': `export class Player {\n  constructor() {\n    this.position = { x: 0, y: 2, z: 0 };\n    this.color = "#00ff00";\n  }\n}`,
        'world.js': `// World Settings\nconsole.log("World Loaded");`,
        'game.js': `// Entry Point`
    });

    const [activeFile, setActiveFile] = useState('player.js');
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const cubeRef = useRef(null);

    // 1. Setup the Custom Canvas (Three.js)
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / 200, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(canvasRef.current.clientWidth, 200);
        canvasRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cubeRef.current = cube;

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(2, 2, 5);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            renderer.dispose();
            if (canvasRef.current) canvasRef.current.innerHTML = "";
        };
    }, []);

    // 2. RUN SCRIPT: Makes it functional
    const runScript = async () => {
        try {
            const blob = new Blob([files[activeFile]], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const module = await import(/* @vite-ignore */ url);
            
            if (module.Player) {
                const p = new module.Player();
                // Dynamically update the 3D model in the viewport
                if (cubeRef.current) {
                    cubeRef.current.position.set(p.position.x, p.position.y, p.position.z);
                    cubeRef.current.material.color.set(p.color);
                }
            }
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Script Error:", err);
        }
    };

    const handleEditorChange = (value) => {
        // Only update the active file's code
        setFiles(prev => ({ ...prev, [activeFile]: value }));
    };

    return (
        <div className="elge-editor" style={{ display: 'flex', height: '100vh', background: '#111', color: '#fff' }}>
            {/* Sidebar */}
            <div style={{ width: '200px', borderRight: '1px solid #333', padding: '10px' }}>
                <h4 style={{ color: '#888' }}>📁 PROJECT</h4>
                {Object.keys(files).map(f => (
                    <div 
                        key={f} 
                        onClick={() => setActiveFile(f)}
                        style={{ 
                            padding: '8px', 
                            cursor: 'pointer', 
                            background: activeFile === f ? '#222' : 'transparent',
                            color: activeFile === f ? '#4caf50' : '#ccc'
                        }}
                    >
                        {activeFile === f ? '● ' : '○ '}{f}
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
                    <button onClick={runScript} style={{ background: '#4caf50', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                        ▶ Run Script
                    </button>
                </div>
                <div style={{ flex: 1 }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language="javascript"
                        path={activeFile} // CRITICAL: This stops code from mirroring
                        value={files[activeFile]}
                        onChange={handleEditorChange}
                    />
                </div>
            </div>

            {/* 3D Viewport Area */}
            <div style={{ width: '300px', borderLeft: '1px solid #333', padding: '10px', background: '#111' }}>
                <h4>3D Viewport</h4>
                <div ref={canvasRef} style={{ width: '100%', height: '200px', background: '#000', borderRadius: '4px' }} />
                <div style={{ marginTop: '20px' }}>
                    <h5 style={{ color: '#888' }}>Live Properties</h5>
                    <p style={{ fontSize: '12px' }}>Editing: <strong>{activeFile}</strong></p>
                    {/* These would link to your existing Transform UI */}
                </div>
            </div>
        </div>
    );
};

export default Editor3d;
