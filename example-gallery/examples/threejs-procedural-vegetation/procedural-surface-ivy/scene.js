import * as THREE from "three";
import {
  IvyPlant,
  defaultIvySettings,
  disposeRaycastIndex,
  indexForRaycasts,
  windSettings,
} from "/skills/threejs-procedural-vegetation/examples/procedural-surface-ivy/ivy-effect.js";

function makeStroke() {
  const samples = [];
  for (let i = 0; i < 24; i += 1) {
    const t = i / 23;
    const latitude = THREE.MathUtils.lerp(-0.48, 0.72, t);
    const longitude = -1.18 + t * 2.55 + Math.sin(t * Math.PI * 3) * 0.14;
    const normal = new THREE.Vector3(
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.cos(longitude),
    ).normalize();
    samples.push({ position: normal.clone(), normal });
  }
  return samples;
}

export default {
  backend: "webgpu",
  renderer: { options: { antialias: true }, exposure: 1 },
  camera: { fov: 45, near: 0.1, far: 30, position: [2.05, 1.15, 3.35] },
  controls: {
    target: [0, 0, 0], minDistance: 2.4, maxDistance: 7,
    minPolarAngle: 0.25, maxPolarAngle: 2.75, enablePan: true,
  },
  setup({ scene }) {
    scene.background = new THREE.Color(0x11151c);
    const hemi = new THREE.HemisphereLight(0xbdd7ff, 0x445566, 0.6);
    const key = new THREE.DirectionalLight(0xfff2dd, 2.2);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-4, 2, -4);
    scene.add(hemi, key, rim);

    const host = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 40),
      new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.9 }),
    );
    host.castShadow = true;
    host.receiveShadow = true;
    scene.add(host);
    indexForRaycasts(host);

    const ivy = new IvyPlant(makeStroke(), 71, { ...defaultIvySettings }, [host]);
    ivy.finishGrowth();
    ivy.bloomAll();
    scene.add(ivy.group);

    return {
      setDebugMode(value) {
        host.visible = value !== "ivy-only";
        ivy.group.visible = value !== "host-only";
        windSettings.strength = value === "still" ? 0 : 0.35;
      },
      update({ delta, elapsed }) {
        ivy.update(delta);
        ivy.updateLeaves(elapsed);
      },
      metrics() {
        return { seed: "71", surfaceProjection: "BVH first-hit" };
      },
      dispose() {
        ivy.dispose();
        disposeRaycastIndex(host.geometry);
        host.geometry.dispose();
        host.material.dispose();
      },
    };
  },
};
