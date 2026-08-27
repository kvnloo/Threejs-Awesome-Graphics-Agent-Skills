import { createPorcelainBrassSubmarineScene } from "./submarine-scene.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    exposure: 0.76,
  },
  camera: {
    fov: 34,
    near: 0.1,
    far: 80,
    position: [3.8, 1.7, 4.6],
  },
  controls: {
    target: [0, -0.05, 0],
    enableDamping: true,
    dampingFactor: 0.07,
    minDistance: 2.4,
    maxDistance: 16,
    minPolarAngle: 0.04,
    maxPolarAngle: 1.62,
    enablePan: true,
  },
  setup(context) {
    return createPorcelainBrassSubmarineScene(context);
  },
};
