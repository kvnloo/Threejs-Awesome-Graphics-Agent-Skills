import * as THREE from "three";
import {
  createLavaFlowSurface,
  updateLavaFlowMaterial,
} from "/skills/threejs-procedural-materials/examples/lava-flow-surface/lava-surface.js";

export default {
  initialTime: 18,
  renderer: {
    options: { antialias: false },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x050208,
  },
  camera: {
    fov: 54,
    near: 0.02,
    far: 120,
    position: [0, 0.2, 0],
  },
  controls: {
    target: [0, -0.15, 1],
    minDistance: 0.8,
    maxDistance: 18,
    minPolarAngle: 1.454,
    maxPolarAngle: 1.454,
    enablePan: true,
  },
  setup({ scene }) {
    const surface = createLavaFlowSurface();
    scene.add(surface);
    let debugMode = "final";
    let size = { width: 1, height: 1 };

    return {
      resize({ bufferWidth, bufferHeight }) {
        size = { width: bufferWidth, height: bufferHeight };
      },
      setDebugMode(mode) {
        debugMode = mode;
      },
      update({ elapsed, camera }) {
        updateLavaFlowMaterial(surface.material, {
          elapsed,
          width: size.width,
          height: size.height,
          camera,
          debugMode,
        });
      },
      render({ renderer, camera }) {
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          raySteps: "84",
          embers: String(surface.material.uniforms.uEmberCount.value),
        };
      },
      dispose() {
        surface.geometry.dispose();
        surface.material.dispose();
      },
    };
  },
};
