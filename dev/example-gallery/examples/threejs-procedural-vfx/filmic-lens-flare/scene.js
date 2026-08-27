import * as THREE from "three/webgpu";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { RenderPipeline } from "three/webgpu";
import {
  FILMIC_LENS_FLARE_PRESET,
  createFilmicLensFlare,
  detectHdrSun,
  solvePanoramaView,
} from "/skills/threejs-procedural-vfx/examples/filmic-lens-flare/filmic-lens-flare.js";

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

export default {
  backend: "webgpu",
  renderer: {
    options: {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    },
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: FILMIC_LENS_FLARE_PRESET.exposure,
    clearColor: 0x000000,
  },
  camera: {
    fov: FILMIC_LENS_FLARE_PRESET.initialFovDeg,
    near: 0.01,
    far: 10,
    position: [0, 0, 1],
  },
  controls: {
    target: [0, 0, 0],
    enableDamping: true,
    dampingFactor: 0.07,
    enablePan: true,
    screenSpacePanning: true,
    minDistance: 0.45,
    maxDistance: 1.8,
    minPolarAngle: 0.015,
    maxPolarAngle: Math.PI - 0.015,
  },

  async setup({ renderer, camera, controls, resolveAsset }) {
    const panorama = await new EXRLoader()
      .setDataType(THREE.FloatType)
      .loadAsync(resolveAsset("assets/bg_1k.exr"));
    panorama.wrapS = THREE.RepeatWrapping;
    panorama.wrapT = THREE.ClampToEdgeWrapping;
    panorama.minFilter = THREE.LinearFilter;
    panorama.magFilter = THREE.LinearFilter;
    panorama.generateMipmaps = false;
    panorama.needsUpdate = true;

    const sunUv = detectHdrSun(panorama);
    const initialView = solvePanoramaView({
      sunDirection: new THREE.Vector3().set(
        Math.sin((sunUv.u - 0.5) * Math.PI * 2) * Math.cos((0.5 - sunUv.vTop) * Math.PI),
        Math.sin((0.5 - sunUv.vTop) * Math.PI),
        -Math.cos((sunUv.u - 0.5) * Math.PI * 2) * Math.cos((0.5 - sunUv.vTop) * Math.PI),
      ).normalize(),
      aspect: renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight),
    });

    camera.position.copy(initialView.forward).multiplyScalar(-1);
    camera.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld(true);
    controls.update();

    const flare = createFilmicLensFlare({
      panoramaTexture: panorama,
      sunUv,
      aspect: renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight),
      fovDeg: camera.fov,
    });
    const renderPipeline = new RenderPipeline(renderer);
    renderPipeline.outputNode = flare.nodes.final;
    let debugMode = "final";

    function updateView() {
      const distance = camera.position.distanceTo(controls.target);
      camera.fov = THREE.MathUtils.clamp(
        FILMIC_LENS_FLARE_PRESET.initialFovDeg * distance,
        FILMIC_LENS_FLARE_PRESET.minimumFovDeg,
        FILMIC_LENS_FLARE_PRESET.maximumFovDeg,
      );
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      camera.getWorldDirection(forward);
      right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

      const panLength = Math.min(0.45, controls.target.length());
      if (panLength > 1e-6) {
        forward.addScaledVector(controls.target, panLength * 0.8).normalize();
        right.crossVectors(forward, worldUp).normalize();
        up.crossVectors(right, forward).normalize();
      }

      flare.updateView({
        forward,
        right,
        up,
        aspect: renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight),
        fovDeg: camera.fov,
      });
    }

    updateView();

    return {
      setDebugMode(mode) {
        debugMode = mode;
        flare.setEnabled(mode !== "no-flare");
        renderPipeline.outputNode = mode === "plate"
          ? flare.nodes.plate
          : mode === "flare-only"
            ? flare.nodes.flare
            : flare.nodes.final;
      },
      update() {
        controls.target.clampLength(0, 0.45);
        controls.update();
        updateView();
      },
      render() {
        renderPipeline.render();
      },
      metrics() {
        return {
          panorama: "1K EXR",
          sourceVisibility: flare.uniforms.sourceVisibility.value.toFixed(3),
          fieldCosine: flare.uniforms.fieldCos.value.toFixed(3),
          fovDegrees: camera.fov.toFixed(1),
          debugMode,
        };
      },
      dispose() {
        panorama.dispose();
      },
    };
  },
};
