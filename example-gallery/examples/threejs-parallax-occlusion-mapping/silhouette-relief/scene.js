import * as THREE from "three/webgpu";
import { createSilhouetteReliefSystem } from "/skills/threejs-parallax-occlusion-mapping/examples/silhouette-relief/silhouette-relief-system.js";

export default {
  backend: "webgpu",
  renderer: { options: { antialias: true }, exposure: 1, clearColor: 0x11151c },
  camera: { fov: 45, near: 0.05, far: 50, position: [0.4, 1.8, 8.4] },
  controls: {
    target: [0, 1.4, 0], minDistance: 3.2, maxDistance: 18,
    minPolarAngle: 0.15, maxPolarAngle: Math.PI / 2.04, enablePan: true,
  },
  setup({ renderer, scene, camera, controls }) {
    scene.background = new THREE.Color(0x11151c);
    scene.fog = new THREE.Fog(0x11151c, 10, 26);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const system = createSilhouetteReliefSystem({ quality: "medium", scale: 0.15 });
    scene.add(system.object);

    scene.add(new THREE.AmbientLight(0x404855, 0.55));
    const key = new THREE.DirectionalLight(0xffdcb2, 3.0);
    const azimuth = -59 * Math.PI / 180;
    const elevation = 29 * Math.PI / 180;
    key.position.set(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    ).multiplyScalar(6.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.normalBias = 0.05;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fb1d8, 0.7);
    fill.position.set(3.5, 1.5, 2.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 1.3);
    rim.position.set(0.5, 3.5, -4);
    scene.add(rim);

    const lightDirection = new THREE.Vector3();
    return {
      setDebugMode(mode) {
        system.setScale(mode === "flat" ? 0 : 0.15);
        key.shadow.intensity = mode === "no-shadow" ? 0 : 1;
        if (mode === "grazing") {
          camera.position.set(6.7, 1.8, 0.7);
          controls?.target.set(0, 1.4, 0);
          controls?.update();
        } else {
          camera.position.set(0.4, 1.8, 8.4);
          controls?.target.set(0, 1.4, 0);
          controls?.update();
        }
      },
      update() {
        if (controls) {
          controls.target.y = Math.max(0.35, controls.target.y);
          camera.position.y = Math.max(0.2, camera.position.y);
          controls.update();
        }
        system.setLightDirection(lightDirection.copy(key.position).normalize());
      },
      metrics() { return { viewLayers: "16–96", shadowSteps: "20", reliefScale: system.depthScale.value.toFixed(2) }; },
      dispose() {
        system.dispose();
      },
    };
  },
};
