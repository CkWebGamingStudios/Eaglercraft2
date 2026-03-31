let root = null;

export function mountHub() {
    if (root) return;

    root = document.createElement("div");
    root.id = "elge-root";

    root.innerHTML = `
        <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:white;font-family:sans-serif;">
            <div>
                <h1>ELGE Runtime</h1>
                <p>Engine initialized successfully</p>
            </div>
        </div>
    `;

    document.body.appendChild(root);
}

export function unmountHub() {
    if (!root) return;
    root.remove();
    root = null;
}
