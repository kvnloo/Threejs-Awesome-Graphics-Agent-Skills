import { createFormulaOneRaceCarScene } from "./race-car-scene.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    exposure: 0.76,
  },
  camera: {
    fov: 18,
    near: 0.05,
    far: 400,
    // The authored hero framing: direction (0.78, 0.50, 0.82) dollied back until the
    // 2.58 x 1.08 m half-extents fit at an 18 degree vertical field.
    position: [7.72, 5.33, 8.16],
  },
  controls: {
    target: [0, 0.38, 0.05],
    enableDamping: true,
    dampingFactor: 0.055,
    minDistance: 1.4,
    maxDistance: 40,
    minPolarAngle: 0.04,
    maxPolarAngle: 1.55,
    enablePan: true,
  },
  setup(context) {
    return createFormulaOneRaceCarScene(context);
  },
};
