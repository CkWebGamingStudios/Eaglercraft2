import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react'; // Assuming Monaco usage

const Editor3d = () => {
    // 1. FILE SYSTEM STATE: Fixes the "all files share code" bug
    const [files, setFiles] = useState({
        'player.js': '// Player Controller\nexport class Player {\n  constructor() {\n    this.position = { x: 0, y: 5, z: 0 };\n  }\n}',
        'world.js': '// World Logic\nconsole.log("World Initialized");',
        'game.js': '// Game Entry'
    });
    
    const [activeFile, setActiveFile] = useState('player.js');
    const [viewportProps, setViewportProps] = useState({ x: 0, y: 2.9, z: 0 });

    // Handle code changes for the SPECIFIC active file
    const handleEditorChange = (value) => {
        setFiles(prev => ({
            ...prev,
            [activeFile]: value
        }));
    };

    // 2. RUN FUNCTIONALITY: Executes the current code
    const runProject = async () => {
        console.log(`🚀 Running ${activeFile}...`);
        try {
            // Create a blob URL to run the code as a module
            const blob = new Blob([files[activeFile]], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            
            // Dynamic import
            const module = await import(/* @vite-ignore */ url);
            
            if (module.Player) {
                const testPlayer = new module.Player();
                // Update viewport based on code instantiation
                setViewportProps(testPlayer.position);
                alert("Script executed successfully! Check console.");
            }
            
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Execution Error:", err);
            alert("Error running script: " + err.message);
        }
    };

    const saveProject = () => {
        localStorage.setItem('elge_project', JSON.stringify(files));
        alert("Project Saved Local");
    };

    return (
        <div className="elge-editor-container" style={{ display: 'flex', height: '100vh', background: '#1e1e1e', color: 'white' }}>
            {/* Sidebar */}
            <div className="sidebar" style={{ width: '200px', borderRight: '1px solid #333', padding: '10px' }}>
                <h3>📁 Files</h3>
                {Object.keys(files).map(fileName => (
                    <div 
                        key={fileName}
                        onClick={() => setActiveFile(fileName)}
                        style={{ 
                            padding: '8px', 
                            cursor: 'pointer', 
                            background: activeFile === fileName ? '#333' : 'transparent',
                            borderRadius: '4px'
                        }}
                    >
                        📄 {fileName}
                    </div>
                ))}
                <button onClick={() => alert('New file logic here')} style={{ marginTop: '10px' }}>+ New File</button>
            </div>

            {/* Main Editor Section */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="toolbar" style={{ padding: '10px', background: '#252526', display: 'flex', gap: '10px' }}>
                    <button onClick={saveProject} style={{ background: '#444' }}>💾 Save</button>
                    <button onClick={runProject} style={{ background: '#2d7a3d', color: 'white' }}>▶️ Run</button>
                </div>

                <div style={{ flex: 1 }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        path={activeFile} // Tells Monaco this is a new "model"
                        defaultLanguage="javascript"
                        value={files[activeFile]}
                        onChange={handleEditorChange}
                    />
                </div>
            </div>

            {/* 3D Viewport & Properties */}
            <div className="inspector" style={{ width: '300px', borderLeft: '1px solid #333', padding: '15px' }}>
                <h3>3D Viewport</h3>
                <div style={{ height: '200px', background: '#000', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Placeholder for Three.js Canvas */}
                    <div style={{ color: '#555' }}>[ 3D Render View ]</div>
                </div>

                <h4>Properties</h4>
                <div className="prop-group">
                    <label>Position X</label>
                    <input type="number" value={viewportProps.x} readOnly />
                    <label>Position Y</label>
                    <input type="number" value={viewportProps.y} readOnly />
                    <label>Position Z</label>
                    <input type="number" value={viewportProps.z} readOnly />
                </div>
            </div>
        </div>
    );
};

export default Editor3d;
