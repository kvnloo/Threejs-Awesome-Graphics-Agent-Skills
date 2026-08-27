import {
  GpuCulledFlowerField,
} from "/skills/threejs-procedural-vegetation/examples/gpu-culled-flower-field/gpu-culled-flower-field.js";

export default {
  backend: "raw-webgpu",
  camera: {
    fov: 48,
    near: 0.1,
    far: 520,
    position: [-22.6, 2.2, 25.8],
  },
  controls: {
    target: [0, 0.85, 0],
    enableDamping: true,
    dampingFactor: 0.07,
    minDistance: 8,
    maxDistance: 300,
    minPolarAngle: 0.08,
    maxPolarAngle: 1.54,
    enablePan: true,
  },
  async setup({ THREE, canvas }) {
    const field = new GpuCulledFlowerField(
      canvas,
      {
        gridSize: 1024,
        mode: "compact",
        density: 0.54,
        spacing: 0.34,
        maxDistance: 145,
        nearDistance: 24,
        midDistance: 52,
        wind: 0.82,
        mixPetalVariants: true,
        cullingMode: "hierarchical",
        seed: 4177,
      },
      {
        grassAtlasUrl: "/skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/painted-grass-atlas.png",
        petalAtlasUrl: "/skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/flower-petal-variants.png",
      },
    );
    await field.init();

    const viewProjection = new THREE.Matrix4();
    let debugMode = "final";

    return {
      resize({ width, height, dpr }) {
        field.resize(width, height, dpr);
      },
      setDebugMode(mode) {
        debugMode = mode;
        field.setMode(mode === "direct" ? "direct" : "compact");
        field.setCullingMode(mode === "flat" ? "flat" : "hierarchical");
        field.setMixPetalVariants(mode !== "uniform-petals");
      },
      update({ elapsed }) {
        const position = [Math.cos(elapsed * 0.34) * 4.2, Math.sin(elapsed * 0.52) * 3.4];
        const velocity = [-Math.sin(elapsed * 0.34) * 1.428, Math.cos(elapsed * 0.52) * 1.768];
        field.setInteraction({
          position,
          velocity,
          speed: Math.hypot(...velocity),
          grounded: true,
        });
      },
      render({ camera, elapsed }) {
        camera.updateMatrixWorld();
        viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        field.render(performance.now(), {
          viewProjection: viewProjection.elements,
          cameraPosition: camera.position.toArray(),
          elapsedSeconds: elapsed,
        });
      },
      metrics() {
        const metrics = field.getMetrics();
        return {
          mode: debugMode,
          candidates: String(metrics.candidateCount),
          visible: metrics.visibleCount === null ? "direct" : String(metrics.visibleCount),
          candidateTests: metrics.candidateTests === null ? "pending" : String(metrics.candidateTests),
          idMemoryMiB: (metrics.compactedIndexBytes / 1048576).toFixed(2),
        };
      },
      dispose() {
        field.dispose();
      },
    };
  },
};
