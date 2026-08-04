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
import {
  CAUCHY_K,
  LAMBDA_D,
  LAMBDA_MAX,
  LAMBDA_MIN,
  absorptionCoefficients,
  cauchyCoefficients,
} from "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/glass-optics.js";
import { wormholeRadius } from "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/wormhole-effect.js";

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

function testSpectralDispersiveGlassOpticsParity() {
  assert.equal(
    CAUCHY_K,
    1 / (486.13 * 486.13) - 1 / (656.27 * 656.27),
    "glass Cauchy calibration constant",
  );
  assertVector(
    [LAMBDA_D, LAMBDA_MIN, LAMBDA_MAX],
    [589.29, 415, 695],
    "glass sampled band",
  );

  // The catalogue inversion has to be self-consistent: the index at the d-line
  // must come back as the quoted n_d, and the spread across the sampled band
  // is what the Abbe number buys.
  const { a, b } = cauchyCoefficients(1.5, 32);
  assertVector(
    [a, b],
    [1.4764382680919155, 8182.110735680701],
    "glass Cauchy coefficients",
    1e-9,
  );
  const index = (lambda) => a + b / (lambda * lambda);
  assertVector(
    [index(LAMBDA_D), index(LAMBDA_MIN), index(LAMBDA_MAX)],
    [1.5, 1.5239465319077419, 1.4933775791745316],
    "glass index across the sampled band",
    1e-9,
  );

  // The tint is decoded exactly once. A doubled sRGB decode — the easy mistake,
  // since a Color built from an sRGB literal is already linear — would inflate
  // every coefficient by roughly 2.3x.
  assertVector(
    absorptionCoefficients("#d0edda", 0.5),
    [0.921668754944433, 0.332408526348505, 0.710204100521603],
    "glass absorption spectrum",
    1e-9,
  );
}

function testTraversableWormholeShapeParity() {
  // r(l) is flat across the cylindrical neck, then opens through the lensing
  // shoulder. These samples pin rho, the throat half-length, and M together:
  // W/rho = 0.05 with W = 1.42953 M gives M = 0.03497653074786818, and
  // 2a/rho = 0.01 gives a = 0.005.
  assertVector(
    [
      wormholeRadius(0),
      wormholeRadius(0.005),
      wormholeRadius(-0.005),
      wormholeRadius(0.05),
      wormholeRadius(1),
      wormholeRadius(6),
      wormholeRadius(-6),
      wormholeRadius(260),
    ],
    [
      1,
      1,
      1,
      1.010682375085514,
      1.858696794199227,
      6.7958983696308275,
      6.7958983696308275,
      260.6640465504506,
    ],
    "wormhole shape function",
    1e-12,
  );
}

testPorcelainBrassSubmarineHullParity();
testEzTreeAshParity();
testSpectralDispersiveGlassOpticsParity();
testTraversableWormholeShapeParity();

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

const glassMaterial = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/spectral-glass-material.js",
    import.meta.url,
  ),
  "utf8",
);
const glassOptics = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/glass-optics.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/const IOR = 1\.5;/, "index at the d-line"],
  [/const ABBE = 32;/, "Abbe number"],
  [/const SPECTRAL_SAMPLES = 8;/, "spectral sample count"],
  [/const PATH_SEGMENTS = 4;/, "interior segment budget"],
  [/const EXIT_REFINEMENTS = 3;/, "exit-search refinement count"],
  [/const MIN_WALL = 0\.08;/, "minimum wall thickness"],
  [/const FROST_LOD = 0;/, "environment mip bias"],
  [/const TINT = "#d0edda";/, "transmission tint"],
  [/const TINT_DEPTH = 0\.5;/, "tint depth"],
  [/const FALLBACK_THICKNESS_RATIO = 0\.015;/, "silhouette fallback thickness"],
  [/const MAX_SEGMENT_RATIO = 3\.0;/, "maximum interior segment"],
  [/const THROUGHPUT_CUTOFF = 0\.004;/, "throughput break"],
  [/backFaceMaterial\.side = THREE\.DoubleSide;/, "unculled data pass"],
  [/backFaceMaterial\.depthNode = depth\.oneMinus\(\);/, "inverted data-pass depth"],
  [
    /outputNode = vec4\(\s*geometricWorldNormal,\s*positionWorld\.sub\(cameraPosition\)\.length\(\),\s*\);/,
    "data-pass normal and distance payload",
  ],
  [
    /normalize\(modelNormalMatrix\.mul\(normalLocal\)\)/,
    "never-flipped geometric world normal",
  ],
  [
    /texture\(renderTarget\.texture, uv, 0\)/,
    "explicit LOD 0 data fetch",
  ],
  [
    /tSeg\.assign\(dot\(Pb\.sub\(orig\), dir\)\.clamp\(MIN_WALL, maxSegment\)\);/,
    "exit-search segment update",
  ],
  [
    /const F2 = fresnelDielectric\(cos2, n, float\(1\.0\)\);/,
    "exit Fresnel against vacuum",
  ],
  [
    /thr\.mulAssign\(F2\);\s*dir\.assign\(reflect\(dir, NbN\)\);/,
    "Fresnel-weighted internal reflection",
  ],
  [
    /exp\(sigma\.mul\(sLen\.negate\(\)\)\)\s*\.mul\(thr\)/,
    "residual energy after the final segment",
  ],
  [
    /Csum\.div\(Wsum\.max\(vec3\(1e-4\)\)\)/,
    "running spectral weight normalisation",
  ],
  [
    /return this\.sampleEnvironment\(normalize\(normalWorldGeometry\), float\(0\.0\)\);/,
    "background direction from the translation-invariant geometric normal",
  ],
]) {
  assert.match(
    glassMaterial,
    pattern,
    `spectral dispersive glass material changed: ${label}`,
  );
}

for (const [pattern, label] of [
  [
    /select\(\s*sinT2\.greaterThanEqual\(1\.0\),\s*float\(1\.0\),/,
    "total internal reflection from the Fresnel expression",
  ],
  [
    /rs\.mul\(rs\)\.add\(rp\.mul\(rp\)\)\.mul\(0\.5\)\.clamp\(0\.0, 1\.0\)/,
    "unpolarised Fresnel average",
  ],
  [
    /gaussianLobe\(lam, float\(599\.8\), 37\.9, 31\.0\)\.mul\(1\.056\)/,
    "CIE X lobe",
  ],
  [
    /gaussianLobe\(lam, float\(568\.8\), 46\.9, 40\.5\)\.mul\(0\.821\)/,
    "CIE Y lobe",
  ],
  [
    /gaussianLobe\(lam, float\(437\.0\), 11\.8, 36\.0\)\.mul\(1\.217\)/,
    "CIE Z lobe",
  ],
  [
    /vec2\(ndc\.x\.mul\(0\.5\)\.add\(0\.5\), ndc\.y\.mul\(-0\.5\)\.add\(0\.5\)\)/,
    "V-inverted buffer projection",
  ],
  [
    /setStyle\(tint, LinearSRGBColorSpace\)\s*\.convertSRGBToLinear\(\)/,
    "exactly one sRGB decode on the transmission tint",
  ],
]) {
  assert.match(
    glassOptics,
    pattern,
    `spectral dispersive glass optics changed: ${label}`,
  );
}

const wormholeEffect = await readFile(
  new URL(
    "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/wormhole-effect.js",
    import.meta.url,
  ),
  "utf8",
);
const wormholeSky = await readFile(
  new URL(
    "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/celestial-spheres.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/const W2M = 1\.42953;/, "lensing width to lensing parameter"],
  [/const W_OVER_RHO = 0\.05;/, "lensing width"],
  [/const A_OVER_RHO = 0\.005;/, "throat half-length"],
  [/const MAX_STEPS = 1024;/, "iteration cap"],
  [/const STEP_K = 0\.15;/, "adaptive step coefficient"],
  [/const ESCAPE_RADIUS = 260\.0;/, "escape radius"],
  [/const RENDER_SCALE = 0\.65;/, "render scale"],
  [/const ACCUMULATION_LIMIT = 512;/, "accumulation limit"],
  [
    /return vec3\( y\.z,\s*b\*ir\*ir,\s*b\*b\*drOfL\(y\.x\)\*ir\*ir\*ir \);/,
    "reduced geodesic derivative",
  ],
  [
    /h = min\(\(uThroatA - al\)\/max\(abs\(y\.z\), 1e-4\) \+ uStepK\*uMlens, 40\.0\*\(uThroatA \+ uRho\)\);/,
    "linear-exact step inside the neck",
  ],
  [
    /h = uStepK\*min\(r, uMlens \+ 0\.9\*\(al - uThroatA\)\);/,
    "curvature-scaled step outside the neck",
  ],
  [
    /if \(r > uREsc && drOfL\(y\.x\)\*y\.z > 0\.0\) \{ capped = false; break; \}/,
    "escape test requires a receding ray",
  ],
  [
    /vec3  D  = drOfL\(y\.x\)\*y\.z\*uf \+ \(b\/rf\)\*tf;/,
    "asymptotic exit direction",
  ],
  [
    /float foot = clamp\(0\.5\*\(length\(dFdx\(D\)\) \+ length\(dFdy\(D\)\)\), 0\.0, 0\.06\);/,
    "ray-bundle footprint",
  ],
  [/if \(capped\) foot = 0\.06;/, "capped rays fall back to mean radiance"],
  [
    /observer\.B\.crossVectors\(observer\.U, observer\.A\);/,
    "frame re-orthogonalisation keeps A x B = U",
  ],
  [
    /Math\.min\(Math\.max\(0\.1, r \* 0\.35\), 14\.0\)/,
    "sphere-radius-scaled travel speed",
  ],
  [
    /const jx = accumCount === 0 \? 0 : still \? halton2\(accumCount \+ 1\) - 0\.5 : Math\.random\(\) - 0\.5;/,
    "pixel-centred first accumulation sample",
  ],
  [
    /\(j \+ k \+ l \+ m\)\*0\.125\s*\+ \(4\.0\*e \+ 2\.0\*\(b \+ d \+ f \+ h\) \+ \(a \+ c \+ g \+ i\)\)\*0\.03125;/,
    "13-tap downsample weights",
  ],
]) {
  assert.match(
    wormholeEffect,
    pattern,
    `traversable wormhole transit changed: ${label}`,
  );
}

for (const [pattern, label] of [
  [/const float U_MIN = 0\.0016;/, "luminosity power-law clamp"],
  [/const float S0    = 0\.00030;/, "intrinsic angular radius of a star"],
  [
    /float k  = \(S0\*S0\)\/\(s\*s\);/,
    "flux-conserving point-spread peak",
  ],
  [
    /float flux  = lum\*pow\(u, -0\.6666667\)\*mix\(1\.0, 2\.3, giant\);/,
    "number-count luminosity law with giants",
  ],
  [
    /return mix\(sum, meanRad, smoothstep\(0\.30, 1\.25, foot\*cells\)\);/,
    "analytic mean-radiance fallback",
  ],
  [
    /vec3  ext  = exp\(-tau\*vec3\(1\.00, 1\.24, 1\.52\)\);/,
    "wavelength-dependent dust extinction",
  ],
  [
    /cRefl\*\(1\.10\*refl \+ 0\.25\*hii\)\)\*sqrt\(ext\);/,
    "nebulae sit inside half the dust column",
  ],
  [
    /\*\(\(sunR\*sunR\)\/\(sunR\*sunR \+ 2\.5066283\*sunR\*sunS \+ 2\.0\*sunS\*sunS\)\)/,
    "sun peak normalised by its own profile integral",
  ],
  [
    /return c\*\(1\.0 - s\.a\) \+ s\.rgb;/,
    "premultiplied planet composite",
  ],
]) {
  assert.match(
    wormholeSky,
    pattern,
    `traversable wormhole celestial spheres changed: ${label}`,
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
  assertMatchesSourceHash({
    source: "author-local-glass-sculpture",
    collection: "assets",
    sourcePath: "sculpture.glb",
    copiedPath: "dev/example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/sculpture.glb",
    label: "glass sculpture subject",
  }),
  assertMatchesSourceHash({
    source: "author-local-glass-sculpture",
    collection: "assets",
    sourcePath: "bar.exr",
    copiedPath: "dev/example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/bar.exr",
    label: "glass sculpture environment probe",
  }),
]);
console.log("Reference example parity checks passed.");
