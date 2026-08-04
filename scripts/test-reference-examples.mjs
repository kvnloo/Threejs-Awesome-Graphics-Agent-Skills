import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ashMedium } from "../skills/threejs-procedural-vegetation/examples/structured-ash-growth/ash-preset.js";
import { compileAshTree } from "../skills/threejs-procedural-vegetation/examples/structured-ash-growth/tree-system.js";
import { SUBMARINE_DIMENSIONS } from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/design-contract.js";
import {
  createSubmarineHullPlan,
  sampleSubmarineHullRing,
} from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/submarine-model.js";
import {
  gridGeometry,
  ringPoints,
} from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/mesh-kit.js";

function assertVector(actual, expected, label, epsilon = 1e-5) {
  assert.equal(actual.length, expected.length, `${label}: dimension mismatch`);
  for (let index = 0; index < expected.length; index += 1) {
    assert.ok(
      Math.abs(actual[index] - expected[index]) <= epsilon,
      `${label}[${index}]: expected ${expected[index]}, received ${actual[index]}`,
    );
  }
}

function testPorcelainBrassSubmarineHullParity() {
  const plan = createSubmarineHullPlan();
  assert.equal(plan.n, 240, "submarine hull plan sample count");
  assertVector(
    [plan.r[0], plan.cy[0], plan.z[0], plan.tiltA[0], plan.v[0]],
    [0.995, -0.03694313003061203, 0.792103635930036, 0.4188790204786391, 0],
    "submarine hull plan first sample",
  );
  assertVector(
    [plan.r[120], plan.cy[120], plan.z[120], plan.tiltA[120], plan.v[120]],
    [0.8316283989299039, -0.011954225941197664, -0.25832496788420806, 0, 0.4786890204598546],
    "submarine hull plan middle sample",
  );
  assertVector(
    [plan.r[239], plan.cy[239], plan.z[239], plan.tiltA[239], plan.v[239]],
    [0.3, 0.075, -1.3, 0, 1],
    "submarine hull plan final sample",
  );

  const rows = [];
  const vRow = [];
  for (let index = 0; index < SUBMARINE_DIMENSIONS.hull.rings; index += 1) {
    const ring = sampleSubmarineHullRing(
      plan,
      index / (SUBMARINE_DIMENSIONS.hull.rings - 1),
    );
    rows.push(ringPoints(
      ring.c,
      ring.axU,
      ring.axV,
      ring.r,
      SUBMARINE_DIMENSIONS.hull.segs,
    ));
    vRow.push(ring.v);
  }
  const geometry = gridGeometry(rows, { closeU: true, flip: true, vRow });
  geometry.computeBoundingBox();
  assert.equal(
    geometry.getAttribute("position").count,
    7224,
    "submarine hull vertex count",
  );
  assert.equal(geometry.getIndex().count / 3, 14080, "submarine hull triangle count");
  assertVector(
    geometry.boundingBox.min.toArray(),
    [-1.0162882804870605, -0.9790741801261902, -1.2999999523162842],
    "submarine hull bounds minimum",
  );
  assertVector(
    geometry.boundingBox.max.toArray(),
    [1.0162882804870605, 1.005637764930725, 1.19680655002594],
    "submarine hull bounds maximum",
  );
  geometry.dispose();
}

function testEzTreeAshParity() {
  const compiled = compileAshTree(ashMedium);
  const branchPosition = compiled.branchGeometry.getAttribute("position");
  const branchIndex = compiled.branchGeometry.getIndex();
  const leafPosition = compiled.leafGeometry.getAttribute("position");
  const leafIndex = compiled.leafGeometry.getIndex();

  assert.equal(branchPosition.count, 6639, "ez-tree Ash branch vertex count");
  assert.equal(branchIndex.count / 3, 9120, "ez-tree Ash branch triangle count");
  assert.equal(leafPosition.count, 21760, "ez-tree Ash leaf vertex count");
  assert.equal(leafIndex.count / 3, 10880, "ez-tree Ash leaf triangle count");
  assert.deepEqual(
    compiled.stats.branchJobs,
    [1, 8, 40, 160],
    "ez-tree Ash branch jobs by hierarchy level",
  );
  assert.deepEqual(
    compiled.stats.continuations,
    [1, 1, 8, 40],
    "ez-tree Ash continuation jobs by hierarchy level",
  );
  assert.deepEqual(
    compiled.stats.lateralChildren,
    [0, 7, 32, 120],
    "ez-tree Ash lateral jobs by hierarchy level",
  );
  assert.equal(compiled.stats.leafCards, 5440, "ez-tree Ash leaf card count");

  assertVector(
    compiled.branchGeometry.boundingBox.min.toArray(),
    [-23.327627182006836, 0, -19.976058959960938],
    "ez-tree Ash branch bounds minimum",
  );
  assertVector(
    compiled.branchGeometry.boundingBox.max.toArray(),
    [29.321561813354492, 80.29814147949219, 31.910205841064453],
    "ez-tree Ash branch bounds maximum",
  );
  assertVector(
    compiled.leafGeometry.boundingBox.min.toArray(),
    [-27.341381072998047, 15.998337745666504, -23.50076675415039],
    "ez-tree Ash leaf bounds minimum",
  );
  assertVector(
    compiled.leafGeometry.boundingBox.max.toArray(),
    [33.317710876464844, 83.69017028808594, 34.63191604614258],
    "ez-tree Ash leaf bounds maximum",
  );
}

testPorcelainBrassSubmarineHullParity();
testEzTreeAshParity();

const sourceTraceManifest = JSON.parse(
  await readFile(
    new URL("../source_materials/trace-manifest.json", import.meta.url),
    "utf8",
  ),
);

const volumetricFireImplementation = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/source/VolumetricFluidFire.ts",
    import.meta.url,
  ),
  "utf8",
);
const volumetricFireContext = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/source/FluidFireShaderContext.ts",
    import.meta.url,
  ),
  "utf8",
);
const volumetricFirePreset = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/volumetric-fluid-fire.js",
    import.meta.url,
  ),
  "utf8",
);

for (const textureName of [
  "curlNoise",
  "velA",
  "velB",
  "dyeA",
  "dyeB",
  "divergence",
  "pressA",
  "pressB",
  "vorticity",
  "sdf",
  "sdfVelocity",
]) {
  assert.match(
    volumetricFireContext,
    new RegExp(`makeDataTexture\\(\\s*"${textureName}"`),
    `volumetric fire is missing ${textureName} texture ownership`,
  );
}

assert.match(
  volumetricFireImplementation,
  /computeShaders\.vorticityPass[\s\S]*computeShaders\.advectPassCompute[\s\S]*computeShaders\.divPassCompute[\s\S]*computeShaders\.jacobiPassABCompute[\s\S]*computeShaders\.projectCompute[\s\S]*computeShaders\.advectDyeCompute[\s\S]*computeShaders\.objectsPassCompute[\s\S]*texture\.dye\.swap\(\)/,
  "volumetric fire compute order changed",
);
assert.match(
  volumetricFireImplementation,
  /fireColor\.mul\(radiance\)\.mul\(crispDensity\)\.mul\(fireAbsorption\)/,
  "volumetric fire final emission formula changed",
);
for (const presetContract of [
  "vorticityConfinementStrength: 7.01",
  "temperature: 8.5",
  "fireDensity: 0.644",
  "turbulenceFrecuency: 6.81",
  "collisionMargin: 0.034",
  "densityDissipation: 1.02",
  "cooling: 0.4831",
  "buoyancy: 2.3729",
  "curlNoiseMultiplier: 5.82",
  "colorRadianceMultiplier: 14.78",
  "temperatureAtMaxColor: 10",
]) {
  assert.ok(
    volumetricFirePreset.includes(presetContract),
    `volumetric fire preset changed: ${presetContract}`,
  );
}

const diamondMaterial = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/raytraced-diamond/diamond-material.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/new MeshBVH\(geometry\.toNonIndexed\(\), \{ strategy: SAH \}\)/, "SAH BVH over a non-indexed copy"],
  [/rayDirection = refract\(rayDirection, normal, 1\.0 \/ ior\);/, "entry refraction"],
  [/rayOrigin = vWorldPosition \+ rayDirection \* 0\.001;/, "entry epsilon"],
  [/for\(float i = 0\.0; i < bounces; i\+\+\) \{/, "bounded bounce loop"],
  [/bvhIntersectFirstHit\( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist \);/, "BVH first-hit call"],
  [/vec3 hitPos = rayOrigin \+ rayDirection \* max\(dist - 0\.001, 0\.0\);/, "hit epsilon"],
  [/rayDirection = reflect\(rayDirection, faceNormal\);\s*rayOrigin = hitPos \+ rayDirection \* 0\.01;/, "internal reflection step"],
  [/max\(ior \* \(1\.0 - aberrationStrength\), 1\.0\)/, "red-channel IOR"],
  [/max\(ior \* \(1\.0 \+ aberrationStrength\), 1\.0\)/, "blue-channel IOR"],
  [/textureGrad\(envMap, rayDirectionR, dFdx\(correctMips \? directionCamPerfect: rayDirection\), dFdy\(correctMips \? directionCamPerfect: rayDirection\)\)\.r/, "mip-correct exit sampling"],
  [/ior = 2\.4,/, "default diamond IOR"],
  [/bounces = 3,/, "default bounce budget"],
  [/aberrationStrength = 0\.01,/, "default aberration strength"],
]) {
  assert.match(
    diamondMaterial,
    pattern,
    `raytraced diamond material changed: ${label}`,
  );
}

async function assertMatchesSourceHash({
  source,
  collection,
  sourcePath,
  copiedPath,
  label,
}) {
  const expected = sourceTraceManifest.sources?.[source]?.[collection]?.[sourcePath];
  assert.match(
    expected ?? "",
    /^[a-f0-9]{64}$/,
    `${label}: missing source SHA-256 trace`,
  );
  const copied = await readFile(new URL(`../${copiedPath}`, import.meta.url));
  const actual = createHash("sha256").update(copied).digest("hex");
  assert.equal(actual, expected, `${label}: copied bytes differ from source trace`);
}

await Promise.all([
  assertMatchesSourceHash({
    source: "rainy-window",
    collection: "files",
    sourcePath: "shaders/rain.frag",
    copiedPath: "skills/threejs-temporal-surfaces/examples/refractive-window-rain/rain-window.frag",
    label: "window rain shader",
  }),
  assertMatchesSourceHash({
    source: "threejs-silhouette-pom",
    collection: "files",
    sourcePath: "ParallaxOcclusion.js",
    copiedPath: "skills/threejs-parallax-occlusion-mapping/examples/silhouette-relief/ParallaxOcclusion.js",
    label: "silhouette POM march",
  }),
  ...["ivy.ts", "flowers.ts", "leafTexture.ts", "wind.ts", "bvh.ts"].map((file) =>
    assertMatchesSourceHash({
      source: "vegetation-generator-threejs",
      collection: "files",
      sourcePath: `src/${file}`,
      copiedPath: `skills/threejs-procedural-vegetation/examples/procedural-surface-ivy/source/${file}`,
      label: `procedural ivy ${file}`,
    })
  ),
  ...[
    "AmbientOcclusion",
    "Color",
    "Displacement",
    "NormalGL",
    "Roughness",
  ].map((suffix) =>
    assertMatchesSourceHash({
      source: "grass-system-threejs",
      collection: "assets",
      sourcePath: `public/Ground103_1K-JPG_${suffix}.jpg`,
      copiedPath: `skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface/Ground103_1K-JPG_${suffix}.jpg`,
      label: `hybrid soil PBR ${suffix}`,
    })
  ),
  ...[
    "AmbientOcclusion",
    "Color",
    "NormalGL",
    "Roughness",
  ].map((suffix) =>
    assertMatchesSourceHash({
      source: "grass-system-threejs",
      collection: "assets",
      sourcePath: `public/Moss002_1K-JPG_${suffix}.jpg`,
      copiedPath: `skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface/moss/Moss002_1K-JPG_${suffix}.jpg`,
      label: `procedural moss ${suffix}`,
    })
  ),
  assertMatchesSourceHash({
    source: "grass-system-threejs",
    collection: "assets",
    sourcePath: "public/old_rusty_car_2.glb",
    copiedPath: "dev/example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb",
    label: "shared rusty car model",
  }),
  assertMatchesSourceHash({
    source: "n8python-diamonds",
    collection: "assets",
    sourcePath: "diamond.glb",
    copiedPath: "skills/threejs-procedural-materials/assets/raytraced-diamond/diamond.glb",
    label: "faceted diamond model",
  }),
]);
console.log("Reference example parity checks passed.");
