import { SpectralOceanSystem } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/ocean-system.js";
import { validateFragmentIFFT } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/fft-pipeline.js";
import { createOceanDetailTexture } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/detail-texture.js";
import {
  createOceanMaterial,
  createSkyMaterial,
  createSpectrumDebugMaterial,
  updateOceanMaterialTextures,
} from "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/ocean-material.js";

export default {
  initialTime: 18.5,
  renderer: {
    options: { antialias: true },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x9fb8cc,
  },
  camera: {
    fov: 55,
    near: 0.5,
    far: 30000,
    position: [0, 16, 68],
  },
  controls: {
    target: [0, 0, -20],
    maxPolarAngle: Math.PI * 0.495,
    enablePan: true,
  },

  async setup({ THREE, renderer, scene, camera }) {
    const fftValidation = validateFragmentIFFT(renderer);
    if (!fftValidation.pass) {
      throw new Error(
        `IFFT validation failed: impulse=${fftValidation.impulseError}, ` +
        `frequency=${fftValidation.frequencyError}`,
      );
    }

    const sunAzimuth = THREE.MathUtils.degToRad(135);
    const sunElevation = THREE.MathUtils.degToRad(28);
    const sunDirection = new THREE.Vector3(
      Math.cos(sunElevation) * Math.sin(sunAzimuth),
      Math.sin(sunElevation),
      Math.cos(sunElevation) * Math.cos(sunAzimuth),
    ).normalize();
    const detailTexture = createOceanDetailTexture();
    const options = {
      resolution: 256,
      patchLengths: [250, 17, 5],
      boundaryFactor: 6,
      gravity: 9.81,
      depth: 500,
      choppiness: 1.3,
      foamRecovery: 0.4,
      amplitude: 1,
      seed: 481516,
      sunDirection,
      detailTexture,
      local: {
        scale: 1,
        windSpeed: 16,
        directionDegrees: 45,
        fetchMeters: 100000,
        directionality: 1,
        swell: 0.2,
        peakEnhancement: 3.3,
        shortWaveFade: 0.02,
      },
      swell: {
        scale: 0.8,
        windSpeed: 2,
        directionDegrees: 70,
        fetchMeters: 300000,
        directionality: 1,
        swell: 1,
        peakEnhancement: 3.3,
        shortWaveFade: 0.01,
      },
    };

    const ocean = new SpectralOceanSystem(renderer, options);
    scene.fog = new THREE.FogExp2(0x9fb8cc, 0.0045);

    const oceanMaterial = createOceanMaterial(ocean.cascades, options);
    const oceanGeometry = new THREE.PlaneGeometry(400, 400, 900, 900);
    oceanGeometry.rotateX(-Math.PI * 0.5);
    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanMesh.frustumCulled = false;
    scene.add(oceanMesh);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(12000, 48, 24),
      createSkyMaterial(options),
    );
    scene.add(sky);

    const debugScene = new THREE.Scene();
    const debugCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const debugQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    debugScene.add(debugQuad);
    const spectrumMaterials = ocean.cascades.map((cascade) =>
      createSpectrumDebugMaterial(cascade.spectrum)
    );
    let debugMode = "final";
    const debugModes = new Map([
      ["final", 0],
      ["cascade-bands", 1],
      ["normals", 2],
      ["jacobian", 3],
    ]);

    return {
      setDebugMode(mode) {
        debugMode = mode;
        oceanMaterial.uniforms.debugMode.value =
          debugModes.get(mode) ?? 0;
      },
      update({ delta, elapsed }) {
        ocean.update(elapsed, Math.max(delta, 1 / 120));
        updateOceanMaterialTextures(oceanMaterial, ocean.cascades);
        oceanMaterial.uniforms.time.value = elapsed;
      },
      render() {
        if (debugMode.startsWith("spectrum-")) {
          const index = Number.parseInt(debugMode.at(-1), 10);
          debugQuad.material = spectrumMaterials[index];
          renderer.render(debugScene, debugCamera);
        } else {
          renderer.render(scene, camera);
        }
      },
      metrics() {
        return {
          resolution: `${options.resolution}² × ${ocean.cascades.length}`,
          fftTest: `pass ${Math.max(
            fftValidation.impulseError,
            fftValidation.frequencyError,
          ).toExponential(1)}`,
        };
      },
      dispose() {
        oceanGeometry.dispose();
        oceanMaterial.dispose();
        sky.geometry.dispose();
        sky.material.dispose();
        debugQuad.geometry.dispose();
        for (const material of spectrumMaterials) material.dispose();
        detailTexture.dispose();
      },
    };
  },
};
