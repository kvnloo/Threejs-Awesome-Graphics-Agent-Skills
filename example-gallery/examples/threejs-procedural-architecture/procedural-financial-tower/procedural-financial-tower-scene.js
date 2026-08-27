import * as THREE from "three/webgpu";
import { attribute, float, texture, vec3 } from "three/tsl";
import {
  compileBuilding,
  createBuildingPlan,
} from "/skills/threejs-procedural-architecture/examples/procedural-financial-tower/building-system.js";
import { CachedClipmapShadowNode } from
  "/skills/threejs-procedural-architecture/examples/procedural-financial-tower/shadow-clipmaps.js";
import {
  createDaylightEnvironment,
  daylightLighting,
  daylightSunDirection,
} from "./daylight-environment.js";

const materialSlots = [
  "limestone",
  "granite",
  "terra-cotta",
  "glass",
  "bronze",
  "black-metal",
  "ornament",
  "roof",
];

export async function createProceduralFinancialTowerScene({
  renderer,
  scene,
  camera,
  controls,
}) {
  renderer.shadowMap.enabled = true;

  const environment = createDaylightEnvironment(scene);
  const materials = await loadFinancialMaterials();

  const plan = createBuildingPlan();
  const building = compileBuilding(plan, materials);
  scene.add(building.root);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90, 1, 1),
    createGroundMaterial(),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  scene.add(ground);

  const hemisphere = new THREE.HemisphereLight(
    new THREE.Color(daylightLighting.hemisphereSkyColor),
    new THREE.Color(daylightLighting.hemisphereGroundColor),
    daylightLighting.hemisphereIntensity,
  );
  scene.add(hemisphere);

  const target = new THREE.Object3D();
  const shadowAnchor = new THREE.Vector3(0, 30, 0);
  const sunOffset = daylightSunDirection.clone().normalize().multiplyScalar(140);
  const sun = new THREE.DirectionalLight(
    new THREE.Color(daylightLighting.sunColor),
    daylightLighting.sunIntensity,
  );
  sun.castShadow = true;
  sun.target = target;
  sun.shadow.bias = -0.000025;
  sun.shadow.normalBias = 0.01;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun, target);

  const shadowCamera = new THREE.PerspectiveCamera();
  shadowCamera.position.copy(shadowAnchor);
  shadowCamera.updateMatrixWorld(true);
  scene.add(shadowCamera);

  const shadowNode = new CachedClipmapShadowNode(sun, {
    camera: shadowCamera,
    firstRadius: 72,
    scaleFactor: 2.15,
    levels: 3,
    maxDistance: 240,
    levelMapSizes: [2048, 1024, 512],
    lightMargin: 70,
    shadowCameraNear: 1,
    shadowCameraFar: 520,
    guardBand: 0.16,
    blendRatio: 0.12,
    dynamicLevels: 1,
    updateBudget: 1,
    maxCacheAge: 120,
  }).attach();

  const fill = new THREE.DirectionalLight(
    new THREE.Color(daylightLighting.fillColor),
    daylightLighting.fillIntensity,
  );
  fill.position.set(-32, 28, 46);
  scene.add(fill);

  let shadowsEnabled = true;
  updateLightFrame();

  function updateLightFrame() {
    sun.position.copy(shadowAnchor).add(sunOffset);
    target.position.copy(shadowAnchor);
    shadowCamera.position.copy(shadowAnchor);
    target.updateMatrixWorld(true);
    sun.updateMatrixWorld(true);
    shadowCamera.updateMatrixWorld(true);
    shadowNode.setCamera(shadowCamera);
  }

  return {
    setDebugMode(modeName) {
      const generatorMode = modeName === "no-shadows" ? "final" : modeName;
      building.setDebugMode(generatorMode);
      const nextShadowsEnabled = modeName !== "no-shadows";
      if (nextShadowsEnabled !== shadowsEnabled) {
        shadowsEnabled = nextShadowsEnabled;
        sun.castShadow = shadowsEnabled;
        if (shadowsEnabled) shadowNode.attach();
        else shadowNode.detach();
      }
      shadowNode.invalidate();
    },
    update() {
      updateLightFrame();
    },
    metrics() {
      return {
        tier:
          `seed 1042 / ${building.moduleCount} placements / ` +
          `${building.triangleCount} triangles / 3 clipmaps`,
      };
    },
    dispose() {
      building.dispose();
      shadowNode.dispose();
      environment.dispose();
      for (const material of materialSlots.map((slot) => materials[slot])) {
        material.dispose();
      }
    },
  };
}

async function loadFinancialMaterials() {
  const loader = new THREE.TextureLoader();
  const [
    limestoneMap,
    limestoneNormal,
    ornamentMap,
    ornamentNormal,
  ] = await Promise.all([
    loader.loadAsync(
      "/skills/threejs-procedural-architecture/assets/procedural-financial-tower/limestone-albedo.png",
    ),
    loader.loadAsync(
      "/skills/threejs-procedural-architecture/assets/procedural-financial-tower/limestone-normal.png",
    ),
    loader.loadAsync(
      "/skills/threejs-procedural-architecture/assets/procedural-financial-tower/ornaments-albedo.png",
    ),
    loader.loadAsync(
      "/skills/threejs-procedural-architecture/assets/procedural-financial-tower/ornaments-normal.png",
    ),
  ]);

  configureColorTexture(limestoneMap);
  configureColorTexture(ornamentMap);
  configureDataTexture(limestoneNormal);
  configureDataTexture(ornamentNormal);

  return {
    limestone: texturedStone(limestoneMap, limestoneNormal, [0.98, 0.96, 0.9], 0.78),
    granite: flatMaterial([0.28, 0.27, 0.25], 0.82, 0.02),
    "terra-cotta": texturedStone(limestoneMap, limestoneNormal, [0.88, 0.32, 0.18], 0.8),
    glass: flatMaterial([0.018, 0.028, 0.035], 0.08, 0.72),
    bronze: flatMaterial([0.62, 0.42, 0.2], 0.32, 0.86),
    "black-metal": flatMaterial([0.02, 0.02, 0.018], 0.42, 0.55),
    ornament: texturedStone(limestoneMap, ornamentNormal, [0.98, 0.96, 0.9], 0.86),
    roof: flatMaterial([0.2, 0.2, 0.19], 0.76, 0.08),
  };
}

function texturedStone(colorMap, normalMap, tint, roughness) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = texture(colorMap).rgb
    .mul(attribute("color", "vec3"))
    .mul(vec3(...tint));
  material.roughnessNode = float(roughness);
  material.metalnessNode = float(0.02);
  material.normalMap = normalMap;
  material.normalScale = new THREE.Vector2(0.22, 0.22);
  return material;
}

function flatMaterial(color, roughness, metalness) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = attribute("color", "vec3").mul(vec3(...color));
  material.roughnessNode = float(roughness);
  material.metalnessNode = float(metalness);
  return material;
}

function createGroundMaterial() {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = vec3(0.12, 0.125, 0.12);
  material.roughnessNode = float(0.86);
  return material;
}

function configureColorTexture(textureMap) {
  textureMap.colorSpace = THREE.SRGBColorSpace;
  textureMap.wrapS = THREE.RepeatWrapping;
  textureMap.wrapT = THREE.RepeatWrapping;
  textureMap.anisotropy = 8;
  return textureMap;
}

function configureDataTexture(textureMap) {
  textureMap.colorSpace = THREE.NoColorSpace;
  textureMap.wrapS = THREE.RepeatWrapping;
  textureMap.wrapT = THREE.RepeatWrapping;
  textureMap.anisotropy = 8;
  return textureMap;
}
