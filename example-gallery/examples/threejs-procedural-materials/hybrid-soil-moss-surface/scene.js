import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  createHybridSoilMossSurface,
  setHybridSoilMossDebugMode,
} from "/skills/threejs-procedural-materials/examples/hybrid-soil-moss-surface/hybrid-soil-moss-surface.js";
import { createModelMossAccumulation } from "/skills/threejs-procedural-materials/examples/hybrid-soil-moss-surface/model-moss-accumulation.js";

const CAR_URL = "/example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb";

export default {
  renderer: {
    options: { antialias: true },
    exposure: 0.85,
    clearColor: 0x171311,
  },
  camera: { fov: 18, near: 0.1, far: 500, position: [6, 20, 32] },
  controls: {
    target: [0, 0, 0],
    minDistance: 2,
    maxDistance: 70,
    maxPolarAngle: Math.PI * 0.495,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, controls }) {
    scene.background = new THREE.Color(0x171311);
    scene.fog = new THREE.FogExp2(0x171311, 0.006);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.4;

    const key = new THREE.DirectionalLight(0xfff1dd, 3.0);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = key.shadow.camera.bottom = -15;
    key.shadow.camera.right = key.shadow.camera.top = 15;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.02;
    const fill = new THREE.DirectionalLight(0x6c8cff, 0.5);
    fill.position.set(-9, 5, -4);
    const rim = new THREE.SpotLight(0xffd9a0, 110, 50, Math.PI * 0.25, 0.4, 1.2);
    rim.position.set(-6, 8, -10);
    rim.target.position.set(0, 0, 0);
    scene.add(key, fill, rim, rim.target, new THREE.AmbientLight(0x3a2f24, 0.4));

    const soil = await createHybridSoilMossSurface({
      textureBaseUrl: "/skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface",
      anisotropy: renderer.capabilities?.getMaxAnisotropy?.() ?? 4,
    });
    soil.castShadow = true;
    scene.add(soil);
    const uniforms = soil.userData.soilUniforms;
    uniforms.uMossEnabled.value = 1.0;

    const shared = { uTime: { value: 0 } };
    const model = createModelMossAccumulation({
      scene,
      sharedUniforms: shared,
      mossUniforms: uniforms,
      defaultUrl: CAR_URL,
    });
    await model.ready;
    model.setVisible(true);
    model.refreshMatrix();

    return {
      setDebugMode(mode) {
        setHybridSoilMossDebugMode(soil, mode);
        model.setVisible(mode !== "ground-only");
      },
      update({ elapsed }) {
        shared.uTime.value = elapsed;
        if (controls) {
          controls.target.y = Math.max(0, controls.target.y);
          camera.position.y = Math.max(0.3, camera.position.y);
          controls.update();
        }
        model.refreshMatrix();
      },
      metrics() {
        return {
          moundCoverage: uniforms.uMoundCoverage.value.toFixed(2),
          mossCoverage: uniforms.uMossCoverage.value.toFixed(2),
          model: "rusty car",
        };
      },
      dispose() {
        model.dispose();
        soil.userData.disposeSoil();
        environment.dispose();
        pmrem.dispose();
      },
    };
  },
};
