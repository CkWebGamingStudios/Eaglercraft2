import React, { useEffect, useRef } from "react";
import { ELGE } from "../elge/master/ELGE.js";

export default function Game() {
  const animationRef = useRef(null);

  useEffect(() => {
    ELGE.engine.start();
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("victus-canvas");
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return undefined;

    const vertexShaderSource = `
      attribute vec3 position;
      attribute vec3 color;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_Position = uProjection * uView * uModel * vec4(position, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    const cube = createCube();
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.indices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getAttribLocation(program, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    const uProjection = gl.getUniformLocation(program, "uProjection");
    const uView = gl.getUniformLocation(program, "uView");
    const uModel = gl.getUniformLocation(program, "uModel");

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.04, 0.06, 0.12, 1);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * (window.devicePixelRatio ?? 1);
      canvas.height = clientHeight * (window.devicePixelRatio ?? 1);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const projection = mat4Perspective(60, canvas.width / canvas.height, 0.1, 200);
    const view = mat4LookAt([8, 8, 12], [0, 1, 0], [0, 1, 0]);

    const animate = () => {
      const time = performance.now() * 0.001;
      const model = mat4Multiply(mat4RotationY(time), mat4RotationX(time * 0.6));

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uProjection, false, projection);
      gl.uniformMatrix4fv(uView, false, view);
      gl.uniformMatrix4fv(uModel, false, model);
      gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div id="game-root" style={{ width: "100vw", height: "100vh" }}>
      <canvas id="victus-canvas" style={{ width: "100%", height: "100%" }}></canvas>

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

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

function createCube() {
  return {
    positions: [
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
      -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
      -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
      1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
      -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1
    ],
    colors: [
      0.4, 0.8, 1, 0.4, 0.8, 1, 0.4, 0.8, 1, 0.4, 0.8, 1,
      0.4, 0.6, 0.8, 0.4, 0.6, 0.8, 0.4, 0.6, 0.8, 0.4, 0.6, 0.8,
      0.5, 0.9, 0.7, 0.5, 0.9, 0.7, 0.5, 0.9, 0.7, 0.5, 0.9, 0.7,
      0.3, 0.5, 0.8, 0.3, 0.5, 0.8, 0.3, 0.5, 0.8, 0.3, 0.5, 0.8,
      0.6, 0.7, 1, 0.6, 0.7, 1, 0.6, 0.7, 1, 0.6, 0.7, 1,
      0.3, 0.7, 0.9, 0.3, 0.7, 0.9, 0.3, 0.7, 0.9, 0.3, 0.7, 0.9
    ],
    indices: [
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ]
  };
}

function mat4Perspective(fovDeg, aspect, near, far) {
  const fovRad = (fovDeg * Math.PI) / 180;
  const f = 1 / Math.tan(fovRad / 2);
  const rangeInv = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
}

function mat4LookAt(eye, target, up) {
  const zAxis = normalize(subtractVectors(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);

  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
  ]);
}

function mat4RotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function mat4RotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function mat4Multiply(a, b) {
  const result = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      result[col + row * 4] =
        a[row * 4] * b[col] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }
  return result;
}

function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]);
  if (length === 0) return [0, 0, 0];
  return [v[0] / length, v[1] / length, v[2] / length];
}
