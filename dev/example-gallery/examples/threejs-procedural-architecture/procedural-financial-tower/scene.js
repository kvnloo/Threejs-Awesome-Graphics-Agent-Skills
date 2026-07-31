import { createProceduralFinancialTowerScene } from
  "./procedural-financial-tower-scene.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    exposure: 0.72,
  },
  camera: {
    fov: 46,
    near: 0.1,
    far: 520,
    position: [60, 48, 65],
  },
  controls: {
    target: [0, 29, 0],
    minDistance: 70,
    maxDistance: 190,
    maxPolarAngle: Math.PI * 0.48,
    enablePan: true,
  },
  setup({ renderer, scene, camera, controls }) {
    return createProceduralFinancialTowerScene({
      renderer,
      scene,
      camera,
      controls,
    });
  },
};
