import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { MeshBVHHelper } from "three-mesh-bvh";
import {
  makeDiamond,
  setDiamondResolution,
} from "/skills/threejs-procedural-materials/examples/raytraced-diamond/diamond-material.js";

const DIAMOND_URL =
  "/skills/threejs-procedural-materials/assets/raytraced-diamond/diamond.glb";

// Scene-buffer passthrough feeding the gamma + SMAA presentation chain. The
// scene is rendered into an explicit target and handed to the composer as
// `sceneDiffuse`.
const scenePassthroughShader = {
  uniforms: {
    sceneDiffuse: { value: null },
  },
  vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
  fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
        varying vec2 vUv;
		void main() {
            vec4 diffuse = texture2D(sceneDiffuse, vUv);
            gl_FragColor = vec4(diffuse.rgb, 1.0);
		}`,
};

export default {
  renderer: {
    options: { antialias: false },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x000000,
  },
  camera: {
    fov: 50,
    near: 0.1,
    far: 500,
    position: [30, 18, 30],
  },
  controls: {
    target: [0, 6, 0],
    minDistance: 12,
    maxDistance: 120,
    maxPolarAngle: Math.PI * 0.49,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, resolveAsset }) {
    scene.background = new THREE.Color(0x000000);

    // The studio HDRI is never drawn as the background: it feeds the gem's
    // refraction/reflection and the floor's image-based lighting only.
    const hdriTexture = await new EXRLoader().loadAsync(
      resolveAsset("assets/colorful_studio.exr"),
    );
    hdriTexture.mapping = THREE.EquirectangularReflectionMapping;
    hdriTexture.generateMipmaps = true;
    hdriTexture.minFilter = THREE.LinearMipmapLinearFilter;
    scene.environment = hdriTexture;

    // Semi-reflective dark floor in two layers: a planar mirror underneath
    // reflects actual scene geometry (the gem), and the slightly transparent
    // glossy disc above keeps the HDRI-lit dark finish while dimming the
    // mirror to semi-reflective strength.
    const mirror = new Reflector(new THREE.CircleGeometry(70, 64), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -0.02;
    scene.add(mirror);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(70, 64),
      new THREE.MeshStandardMaterial({
        color: 0x060606,
        roughness: 0.18,
        metalness: 0.35,
        envMapIntensity: 0.5,
        transparent: true,
        opacity: 0.78,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const gltf = await new GLTFLoader().loadAsync(DIAMOND_URL);
    const diamondGeo =
      gltf.scene.children[0].children[0].children[0].children[0].children[0]
        .geometry;
    diamondGeo.scale(10, 10, 10);
    diamondGeo.translate(0, 5, 0);

    // The gem's material samples a cube map: convert the equirectangular
    // HDRI once into a mipmapped HDR cube target. The mipmapped filtering it
    // inherits from the HDRI keeps the material's mip-correct sampling live.
    const envCubeTarget = new THREE.WebGLCubeRenderTarget(512, {
      type: THREE.HalfFloatType,
    });
    envCubeTarget.fromEquirectangularTexture(renderer, hdriTexture);

    const diamond = makeDiamond(diamondGeo, {
      envMap: envCubeTarget.texture,
      camera,
      resolution: new THREE.Vector2(1, 1),
      aberrationStrength: 0.05,
    });
    scene.add(diamond);
    const uniforms = diamond.material.uniforms;

    const bvhHelper = new MeshBVHHelper(diamond, 20);
    bvhHelper.visible = false;
    bvhHelper.update();
    scene.add(bvhHelper);

    // Half-float scene target: the chain stores linear light and applies
    // gamma afterwards, so an 8-bit target would band in the dark floor
    // gradients once the transfer curve expands them.
    const defaultTexture = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
    });
    defaultTexture.depthTexture = new THREE.DepthTexture(1, 1, THREE.FloatType);
    const composer = new EffectComposer(renderer);
    const effectPass = new ShaderPass(scenePassthroughShader);
    composer.addPass(effectPass);
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    const smaaPass = new SMAAPass();
    composer.addPass(smaaPass);

    return {
      setDebugMode(mode) {
        uniforms.bounces.value = mode === "one-bounce" ? 1 : 3;
        uniforms.chromaticAberration.value = mode !== "single-ior";
        uniforms.correctMips.value = mode !== "flat-mips";
        bvhHelper.visible = mode === "bvh";
      },
      resize({ width, height, bufferWidth, bufferHeight, dpr }) {
        setDiamondResolution(diamond.material, bufferWidth, bufferHeight);
        defaultTexture.setSize(bufferWidth, bufferHeight);
        composer.setPixelRatio(dpr);
        composer.setSize(width, height);
      },
      render({ renderer, camera }) {
        renderer.setRenderTarget(defaultTexture);
        renderer.clear();
        renderer.render(scene, camera);
        effectPass.uniforms.sceneDiffuse.value = defaultTexture.texture;
        composer.render();
      },
      metrics() {
        return {
          bounces: String(uniforms.bounces.value),
          ior: uniforms.ior.value.toFixed(2),
          dispersion: uniforms.chromaticAberration.value ? "on" : "off",
        };
      },
      dispose() {
        diamondGeo.dispose();
        diamond.material.dispose();
        mirror.dispose();
        mirror.geometry.dispose();
        floor.geometry.dispose();
        floor.material.dispose();
        hdriTexture.dispose();
        envCubeTarget.dispose();
        defaultTexture.depthTexture.dispose();
        defaultTexture.dispose();
        composer.dispose();
      },
    };
  },
};
