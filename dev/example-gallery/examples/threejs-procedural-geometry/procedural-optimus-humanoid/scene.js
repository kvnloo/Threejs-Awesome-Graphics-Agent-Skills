import * as THREE from "three/webgpu";
import {
  createProceduralOptimusHumanoid,
} from "/skills/threejs-procedural-geometry/examples/procedural-optimus-humanoid/procedural-optimus-humanoid.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true },
    toneMapping: THREE.AgXToneMapping,
    exposure: 1.15,
    clearColor: 0x0b0c0e,
  },
  camera: {
    fov: 32,
    near: 0.02,
    far: 60,
    position: [1.55, -2.85, 2.18],
    up: [0, 0, 1],
  },
  controls: {
    target: [0, 0, 0.92],
    enableDamping: true,
    dampingFactor: 0.06,
    minDistance: 0.35,
    maxDistance: 12,
    minPolarAngle: 0.04,
    maxPolarAngle: 1.62,
    enablePan: true,
  },
  setup({ renderer, scene }) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.background = new THREE.Color(0x0b0c0e);

    const model = createProceduralOptimusHumanoid();
    scene.add(model.root);

    const key = new THREE.DirectionalLight(0xfff4e6, 3.6);
    key.position.set(-3.2, -4, 2.55);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 16;
    key.shadow.camera.left = -1.55;
    key.shadow.camera.right = 1.55;
    key.shadow.camera.top = 1.3;
    key.shadow.camera.bottom = -1.3;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.003;
    key.shadow.intensity = 0.82;
    const fill = new THREE.DirectionalLight(0xd8e8ff, 0.85);
    fill.position.set(2.9, -1.3, 0.7);
    const rimLeft = new THREE.DirectionalLight(0xdcecff, 2.3);
    rimLeft.position.set(-2.3, 2.2, 1.1);
    const rimRight = new THREE.DirectionalLight(0xe2f0ff, 1.7);
    rimRight.position.set(2.4, 2, 0.95);
    const top = new THREE.DirectionalLight(0xffffff, 0.55);
    top.position.set(0.16, 0.9, 3.2);
    scene.add(key, fill, rimLeft, rimRight, top);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x090a0c, roughness: 0.55 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 128), floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);

    const upper = new Set(["TORSO", "HEAD", "ARM", "HAND"]);
    const lower = new Set(["HIP", "LEG", "FOOT"]);
    return {
      setDebugMode(mode) {
        for (const group of model.root.children) {
          group.visible = mode === "upper-body" ? upper.has(group.name)
            : mode === "lower-body" ? lower.has(group.name)
              : true;
        }
        for (const material of Object.values(model.materials)) {
          material.wireframe = mode === "topology";
          material.needsUpdate = true;
        }
      },
      metrics() {
        return {
          objects: String(model.stats.objects),
          triangles: String(model.stats.triangles),
          heightMetres: model.stats.heightMetres.toFixed(2),
          materialSlots: String(Object.keys(model.materials).length),
        };
      },
      dispose() {
        scene.remove(model.root, key, fill, rimLeft, rimRight, top, floor);
        model.dispose();
        floor.geometry.dispose();
        floorMaterial.dispose();
      },
    };
  },
};
