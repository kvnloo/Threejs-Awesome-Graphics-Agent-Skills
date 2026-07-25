import { createSportMotorcycleScene } from "./motorcycle-scene.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    exposure: 0.76,
  },
  camera: {
    fov: 27,
    near: 0.08,
    far: 90,
    position: [2.1, 1.1, 2.6],
  },
  controls: {
    target: [0, 0.52, 0],
    enableDamping: true,
    dampingFactor: 0.075,
    minDistance: 0.6,
    maxDistance: 12,
    minPolarAngle: 0.04,
    maxPolarAngle: Math.PI * 0.53,
    enablePan: true,
  },
  setup(context) {
    return createSportMotorcycleScene(context);
  },
};
