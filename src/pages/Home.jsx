import React from "react";

export default function Home() {
  return (
    <main style={{ padding: "48px 32px", maxWidth: 920, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ letterSpacing: "0.2em", fontSize: 12, margin: 0 }}>
          CK GAMING STUDIOS
        </p>
        <h1 style={{ fontSize: 48, margin: "12px 0" }}>Eaglercraft 2</h1>
        <p style={{ fontSize: 18, margin: 0 }}>
          Eaglercraft2 is a voxel game platform built for the browser.
        </p>
      </header>

      <section style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(20, 20, 30, 0.5)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Play anywhere</h2>
          <p>
            Launch fast, lightweight experiences with ELGE, the low-end game
            engine powering Eaglercraft2.
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(20, 20, 30, 0.5)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Voxel-first experiences</h2>
          <p>
            Build and explore block-based worlds, tools, and shared adventures
            directly in your browser.
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "rgba(20, 20, 30, 0.5)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Choose your path</h2>
          <p>
            Navigate to play, build, or manage assets as the platform expands.
          </p>
        </div>
      </section>
    </main>
  );
}
