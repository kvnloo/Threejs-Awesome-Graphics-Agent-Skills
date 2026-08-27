import * as THREE from "three/webgpu";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import {
  createThinFilmSoapBubbleSystem,
} from "/skills/threejs-procedural-materials/examples/thin-film-soap-bubbles/soap-bubble-system.js";

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: true, alpha: false },
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
    exposure: 1.08,
  },
  camera: {
    fov: 40,
    near: 0.02,
    far: 50,
    position: [0, 0.03, 2.05],
  },
  controls: {
    target: [0, 0.02, 0],
    enableDamping: true,
    dampingFactor: 0.055,
    enablePan: true,
    screenSpacePanning: true,
    minDistance: 0.48,
    maxDistance: 8,
    minPolarAngle: 0.2,
    maxPolarAngle: Math.PI - 0.2,
  },
  async setup({ renderer, scene, camera, controls, canvas, resolveAsset }) {
    camera.coordinateSystem = renderer.coordinateSystem;
    camera.updateProjectionMatrix();
    const environment = await new EXRLoader().loadAsync(
      resolveAsset("assets/background-2k.exr"),
    );
    environment.mapping = THREE.EquirectangularReflectionMapping;
    environment.colorSpace = THREE.LinearSRGBColorSpace;
    scene.background = environment;
    scene.environment = environment;
    scene.backgroundBlurriness = 0.025;

    const bubbles = createThinFilmSoapBubbleSystem({
      environment,
      camera,
      controlsTarget: controls.target,
      domElement: canvas,
    });
    scene.add(bubbles.group);

    return {
      setDebugMode(mode) {
        bubbles.setDebugMode(mode);
      },
      update({ delta }) {
        bubbles.update(delta);
      },
      metrics() {
        return {
          ...bubbles.metrics(),
          environment: "2K EXR",
          backgroundBlur: scene.backgroundBlurriness.toFixed(3),
        };
      },
      dispose() {
        scene.remove(bubbles.group);
        bubbles.dispose();
        environment.dispose();
        scene.background = null;
        scene.environment = null;
      },
    };
  },
};
