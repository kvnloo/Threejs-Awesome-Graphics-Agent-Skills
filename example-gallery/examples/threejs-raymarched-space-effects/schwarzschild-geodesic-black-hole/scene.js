import {
  createSchwarzschildGeodesicBlackHoleEffect,
} from "/skills/threejs-raymarched-space-effects/examples/schwarzschild-geodesic-black-hole/geodesic-black-hole-effect.js";

export default {
  renderer: {
    options: {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: "high-performance",
    },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x000000,
  },
  camera: {
    fov: 60,
    near: 0.01,
    far: 120,
    position: [10.439843, 2.150796, 8.284549],
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 2.4,
    maxDistance: 42,
    enablePan: true,
    screenSpacePanning: true,
  },

  setup({ renderer, camera }) {
    const effect = createSchwarzschildGeodesicBlackHoleEffect({
      renderer,
      preset: "broadDisk",
      quality: "medium",
    });

    return {
      resize({ bufferWidth, bufferHeight }) {
        effect.setSize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        effect.setDebugMode(mode);
      },
      update({ elapsed }) {
        effect.updateCamera(camera);
        effect.update(elapsed);
      },
      render({ renderer: activeRenderer }) {
        effect.render(activeRenderer);
      },
      metrics() {
        return {
          tier: `${effect.stepCount} RK2 steps`,
          debug: effect.debugMode,
        };
      },
      dispose() {
        effect.dispose();
      },
    };
  },
};
