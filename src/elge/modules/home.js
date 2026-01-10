export function start({ context, capabilities }) {
    document.body.innerHTML = `
    <h2>ELGE Ready</h2>
    <pre>${JSON.stringify({ context, capabilities }, null, 2)}</pre>
  `;
}
