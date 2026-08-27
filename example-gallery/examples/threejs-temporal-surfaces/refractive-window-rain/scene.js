import * as THREE from "three";
import {
  createWindowRainMaterial,
  updateWindowRainMaterial,
} from "/skills/threejs-temporal-surfaces/examples/refractive-window-rain/window-rain-effect.js";

export default {
  renderer: {
    options: { antialias: false },
    toneMapping: THREE.NoToneMapping,
    clearColor: 0x05080c,
  },
  camera: {
    type: "orthographic",
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    near: 0,
    far: 1,
    position: [0, 0, 0],
  },
  controls: { enabled: false },
  async setup({ scene, resolveAsset }) {
    const loader = new THREE.TextureLoader();
    const background = await loader.loadAsync(resolveAsset("./assets/background.webp"));
    background.colorSpace = THREE.SRGBColorSpace;
    const fragmentShader = await fetch(
      "/skills/threejs-temporal-surfaces/examples/refractive-window-rain/rain-window.frag",
    ).then((response) => response.text());
    const material = createWindowRainMaterial({
      background,
      fragmentShader,
      backgroundResolution: new THREE.Vector2(
        background.image.width,
        background.image.height,
      ),
    });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(pane);

    let size = { width: 1, height: 1 };
    let debugMode = "final";
    return {
      resize({ bufferWidth, bufferHeight }) {
        size = { width: bufferWidth, height: bufferHeight };
      },
      setDebugMode(value) {
        debugMode = value;
      },
      update({ elapsed }) {
        updateWindowRainMaterial(material, { elapsed, ...size, debugMode });
      },
      metrics() {
        return {
          dropletLayers: "3",
          blurTaps: String(material.uniforms.u_blur_iterations.value),
        };
      },
      dispose() {
        pane.geometry.dispose();
        material.dispose();
        background.dispose();
      },
    };
  },
};
