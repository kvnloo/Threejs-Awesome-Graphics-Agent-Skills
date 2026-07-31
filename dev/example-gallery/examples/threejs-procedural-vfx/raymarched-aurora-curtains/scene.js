import {
  AURORA_CURTAIN_PRESET,
  AURORA_PROBE_SIZE,
  AURORA_VOLUME_GLSL,
  createAuroraCurtains,
} from "/skills/threejs-procedural-vfx/examples/raymarched-aurora-curtains/aurora-curtains.js";
import { createPolarNightSky } from "./polar-night-sky.js";
import { createSnowDesert } from "./snow-desert.js";

const CAMERA_EYE_HEIGHT = 45;

function addFullscreenQuad(THREE, targetScene, geometry, material) {
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  targetScene.add(quad);
  return quad;
}

export default {
  backend: "webgl",
  initialTime: 0,
  renderer: {
    options: {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    },
    clearColor: 0x04070e,
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 12000,
    position: [0, 45, 0],
  },
  controls: {
    target: [0, 90, -200],
    enableDamping: true,
    dampingFactor: 0.06,
    enablePan: true,
    screenSpacePanning: true,
    minDistance: 3,
    maxDistance: 1800,
    minPolarAngle: 0.2,
    maxPolarAngle: 2.2,
  },

  async setup({ THREE, renderer, scene, camera, controls }) {
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    renderer.setClearColor(0x04070e, 1);

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const skyBackdropScene = new THREE.Scene();
    const auroraScreenScene = new THREE.Scene();
    const compositeScene = new THREE.Scene();
    const probeDebugScene = new THREE.Scene();
    const probeBackdropScene = new THREE.Scene();

    const skyTarget = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.LinearSRGBColorSpace,
      depthBuffer: false,
      stencilBuffer: false,
    });
    const probeTarget = new THREE.WebGLRenderTarget(
      AURORA_PROBE_SIZE.width,
      AURORA_PROBE_SIZE.height,
      {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping,
        colorSpace: THREE.LinearSRGBColorSpace,
        depthBuffer: false,
        stencilBuffer: false,
      },
    );

    const aurora = createAuroraCurtains({ intensity: 1.15 });
    aurora.screenMaterial.blending = THREE.NoBlending;
    const polarNight = createPolarNightSky({
      auroraUniforms: aurora.uniforms,
      auroraGlsl: AURORA_VOLUME_GLSL,
      raySteps: AURORA_CURTAIN_PRESET.raySteps,
      probeRaySteps: AURORA_CURTAIN_PRESET.probeRaySteps,
      skyTexture: skyTarget.texture,
      probeTexture: probeTarget.texture,
    });
    const snowDesert = createSnowDesert({
      scene,
      auroraUniforms: aurora.uniforms,
      skyUniforms: polarNight.uniforms,
      probeTexture: probeTarget.texture,
    });

    addFullscreenQuad(
      THREE,
      skyBackdropScene,
      quadGeometry,
      polarNight.backdropMaterial,
    );
    addFullscreenQuad(
      THREE,
      auroraScreenScene,
      quadGeometry,
      aurora.screenMaterial,
    );
    addFullscreenQuad(
      THREE,
      compositeScene,
      quadGeometry,
      polarNight.compositeMaterial,
    );
    addFullscreenQuad(
      THREE,
      probeDebugScene,
      quadGeometry,
      polarNight.probeDebugMaterial,
    );
    addFullscreenQuad(
      THREE,
      probeBackdropScene,
      quadGeometry,
      polarNight.probeBackdropMaterial,
    );
    camera.position.set(0, snowDesert.groundHeight(0, 0) + CAMERA_EYE_HEIGHT, 0);
    camera.rotation.set(0.3, 0.4, 0, "YXZ");
    camera.updateMatrixWorld(true);
    const initialDirection = new THREE.Vector3();
    camera.getWorldDirection(initialDirection);
    controls.target.copy(camera.position).addScaledVector(initialDirection, 400);
    controls.update();

    let debugMode = "final";

    renderer.compile(skyBackdropScene, quadCamera);
    renderer.compile(auroraScreenScene, quadCamera);
    renderer.compile(scene, camera);

    return {
      setDebugMode(mode) {
        debugMode = mode;
      },
      resize({ bufferWidth, bufferHeight }) {
        aurora.setSize(bufferWidth, bufferHeight);
        snowDesert.setViewportHeight(bufferHeight);
        skyTarget.setSize(bufferWidth, bufferHeight);
      },
      update({ elapsed }) {
        const groundMinimum = snowDesert.groundHeight(
          camera.position.x,
          camera.position.z,
        ) + 1;
        if (camera.position.y < groundMinimum) {
          camera.position.y = groundMinimum;
        }
        controls.update();
        aurora.update(elapsed, camera);
        snowDesert.update(camera, CAMERA_EYE_HEIGHT);
      },
      render() {
        const auroraOnly = debugMode === "aurora-only";

        if (auroraOnly) {
          renderer.setRenderTarget(skyTarget);
          renderer.clear(true, false, false);
          renderer.render(auroraScreenScene, quadCamera);
          renderer.setRenderTarget(null);
          renderer.clear(true, true, true);
          renderer.render(compositeScene, quadCamera);
          return;
        }

        const savedAuroraGain = aurora.uniforms.uAuroraGain.value;
        if (debugMode === "no-aurora") {
          aurora.uniforms.uAuroraGain.value = 0;
        }

        renderer.setRenderTarget(probeTarget);
        renderer.clear(true, false, false);
        renderer.render(probeBackdropScene, quadCamera);

        if (debugMode === "radiance-probe") {
          aurora.uniforms.uAuroraGain.value = savedAuroraGain;
          renderer.setRenderTarget(null);
          renderer.clear(true, true, true);
          renderer.render(probeDebugScene, quadCamera);
          return;
        }

        renderer.setRenderTarget(skyTarget);
        renderer.clear(true, false, false);
        renderer.render(skyBackdropScene, quadCamera);
        aurora.uniforms.uAuroraGain.value = savedAuroraGain;

        renderer.setRenderTarget(null);
        renderer.clear(true, true, true);
        renderer.render(compositeScene, quadCamera);
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          auroraSteps: AURORA_CURTAIN_PRESET.raySteps,
          probeSteps: AURORA_CURTAIN_PRESET.probeRaySteps,
          terrainLevels: snowDesert.terrainLevels.length,
          snowParticles: 9000,
        };
      },
      dispose() {
        snowDesert.dispose();
        polarNight.dispose();
        aurora.dispose();
        skyTarget.dispose();
        probeTarget.dispose();
        quadGeometry.dispose();
      },
    };
  },
};
