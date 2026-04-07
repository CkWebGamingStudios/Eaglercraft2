import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./editor3d.css";

function createPrimitive(type) {
  let geometry;
  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.6, 32, 24);
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 24);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
  }

  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.type = type;
  mesh.name = `${type}-${Math.floor(Math.random() * 10000)}`;
  return mesh;
}

export default function Editor3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const frameRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [editorStatus, setEditorStatus] = useState("Initializing renderer...");

  const selectedObject = useMemo(
    () => objects.find((entry) => entry.uuid === selectedId) || null,
    [objects, selectedId]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070b14");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(4, 3, 7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    const hemi = new THREE.HemisphereLight(0xaec8ff, 0x304050, 0.75);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(4, 8, 5);
    dir.castShadow = true;
    scene.add(dir);

    const grid = new THREE.GridHelper(24, 24, 0x5470a8, 0x24324f);
    scene.add(grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({ color: "#101826", roughness: 0.9, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const firstCube = createPrimitive("cube");
    firstCube.position.set(0, 0.55, 0);
    scene.add(firstCube);
    setObjects([firstCube]);
    setSelectedId(firstCube.uuid);
    setEditorStatus("3D editor ready.");

    const handleResize = () => {
      if (!mount || !cameraRef.current || !rendererRef.current) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const handlePointerDown = (event) => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(objects, false);
      if (intersects.length > 0) {
        setSelectedId(intersects[0].object.uuid);
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose?.());
        } else {
          obj.material?.dispose?.();
        }
      });
    };
  }, []);

  function addObject(type) {
    if (!sceneRef.current) return;
    const mesh = createPrimitive(type);
    const nextIndex = objects.length + 1;
    mesh.position.set((nextIndex % 5) - 2, 0.6, Math.floor(nextIndex / 5));
    sceneRef.current.add(mesh);
    setObjects((prev) => [...prev, mesh]);
    setSelectedId(mesh.uuid);
  }

  function deleteSelected() {
    if (!sceneRef.current || !selectedObject) return;
    sceneRef.current.remove(selectedObject);
    selectedObject.geometry?.dispose?.();
    selectedObject.material?.dispose?.();

    setObjects((prev) => {
      const remaining = prev.filter((entry) => entry.uuid !== selectedObject.uuid);
      setSelectedId(remaining[0]?.uuid || "");
      return remaining;
    });
  }

  function updateSelectedTransform(axis, value, mode = "position") {
    if (!selectedObject) return;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    selectedObject[mode][axis] = numeric;
    setObjects((prev) => [...prev]);
  }

  return (
    <section className="editor-page">
      <div className="editor-shell">
        <header className="editor-header">
          <h1>3D Editor System</h1>
          <p>{editorStatus}</p>
        </header>

        <div className="editor-layout">
          <aside className="editor-sidebar">
            <h2>Scene Tools</h2>
            <div className="editor-actions">
              <button type="button" onClick={() => addObject("cube")}>Add Cube</button>
              <button type="button" onClick={() => addObject("sphere")}>Add Sphere</button>
              <button type="button" onClick={() => addObject("cylinder")}>Add Cylinder</button>
              <button type="button" className="danger" onClick={deleteSelected} disabled={!selectedObject}>Delete Selected</button>
            </div>

            <h3>Objects ({objects.length})</h3>
            <div className="editor-object-list">
              {objects.map((obj) => (
                <button
                  key={obj.uuid}
                  type="button"
                  className={obj.uuid === selectedId ? "selected" : ""}
                  onClick={() => setSelectedId(obj.uuid)}
                >
                  {obj.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="editor-canvas" ref={mountRef} />

          <aside className="editor-inspector">
            <h2>Inspector</h2>
            {!selectedObject && <p>Select an object from the scene.</p>}
            {selectedObject && (
              <>
                <p><strong>{selectedObject.name}</strong></p>

                <label>
                  Position X
                  <input type="number" step="0.1" value={selectedObject.position.x.toFixed(2)} onChange={(e) => updateSelectedTransform("x", e.target.value, "position")} />
                </label>
                <label>
                  Position Y
                  <input type="number" step="0.1" value={selectedObject.position.y.toFixed(2)} onChange={(e) => updateSelectedTransform("y", e.target.value, "position")} />
                </label>
                <label>
                  Position Z
                  <input type="number" step="0.1" value={selectedObject.position.z.toFixed(2)} onChange={(e) => updateSelectedTransform("z", e.target.value, "position")} />
                </label>

                <label>
                  Rotation Y
                  <input type="number" step="0.1" value={selectedObject.rotation.y.toFixed(2)} onChange={(e) => updateSelectedTransform("y", e.target.value, "rotation")} />
                </label>

                <label>
                  Scale
                  <input type="number" step="0.1" min="0.1" value={selectedObject.scale.x.toFixed(2)} onChange={(e) => {
                    const v = Math.max(0.1, Number(e.target.value) || 1);
                    updateSelectedTransform("x", v, "scale");
                    updateSelectedTransform("y", v, "scale");
                    updateSelectedTransform("z", v, "scale");
                  }} />
                </label>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
