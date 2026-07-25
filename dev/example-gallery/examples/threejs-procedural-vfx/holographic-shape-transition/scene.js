import { createHologramProjection } from
  "/skills/threejs-procedural-vfx/examples/holographic-shape-transition/hologram-transition.js";

const STAGE_TOP_Y = -1.75;

export default {
  backend: "webgl",
  initialTime: 0.75,
  renderer: {
    options: { antialias: true, alpha: false },
    exposure: 1.2,
    clearColor: 0x000000,
  },
  camera: {
    fov: 35,
    near: 0.1,
    far: 100,
    position: [0, 4, -10],
  },
  controls: {
    target: [0, 0, 0],
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 5,
    maxDistance: 20,
    minPolarAngle: 0.08,
    // Keeps the orbit above the projection stage so the plinth underside and
    // the point light beneath it are never framed from below.
    maxPolarAngle: 1.62,
    enablePan: true,
  },

  setup({ THREE, renderer, scene, camera, controls }) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene.background = new THREE.Color(0x000000);

    const ambient = new THREE.AmbientLight(new THREE.Color("#ffffff"), 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(
      new THREE.Color("#a4d5f4"),
      1,
    );
    directional.position.set(0, 3, 1);
    scene.add(directional);

    // Coloured bounce under the projection: the stage picks up the hologram's
    // own hue, which is what visually anchors an additive shell to the plinth.
    const point = new THREE.PointLight(new THREE.Color("#00d5ff"), 1, 10);
    point.position.set(0, -1.3, 0);
    scene.add(point);

    const stageGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 128);
    const stageMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d4d4d4"),
      roughness: 0.3,
      metalness: 0.6,
    });
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.set(0, -2, 0);
    scene.add(stage);

    const projection = createHologramProjection({
      color: "#00d5ff",
      shapes: [
        { geometry: new THREE.TorusKnotGeometry(1, 0.5, 128, 32), spin: true },
        { geometry: new THREE.IcosahedronGeometry(2, 24), spin: false },
        { geometry: new THREE.TorusGeometry(1.4, 0.5, 128, 32), spin: true },
      ],
    });
    scene.add(projection.object);

    return {
      setDebugMode(mode) {
        projection.setDebugMode(mode);
      },
      update({ delta, elapsed }) {
        projection.update({ delta, elapsed });
        if (controls) {
          camera.position.y = Math.max(STAGE_TOP_Y + 0.4, camera.position.y);
          controls.target.y = THREE.MathUtils.clamp(controls.target.y, -1.2, 3.2);
        }
      },
      metrics() {
        return {
          shapes: projection.materials.length,
          sweepRange: `${projection.sweepRange.minY.toFixed(2)} to ${projection.sweepRange.maxY.toFixed(2)}`,
          scanlines: "20 per metre",
          handover: "1.5 s of 4 s",
        };
      },
      dispose() {
        scene.remove(projection.object, stage, ambient, directional, point);
        projection.dispose();
        stageGeometry.dispose();
        stageMaterial.dispose();
      },
    };
  },
};
