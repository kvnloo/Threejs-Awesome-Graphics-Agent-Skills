# Source material ledger

This directory contains research inputs for Three.js Awesome Graphics Agent
Skills. Downloaded repositories are ignored by Git and inspected as untrusted
code. A reference checkout may install its own locked dependencies and run
inside its directory for code and visual verification. When an accepted example
needs package implementation internals, the readable source files are copied or
translated in source form and traced here; generated package build output is not
used as skill implementation material.

The pack is a reference-extraction library of mechanisms and workflows.
Reference code and assets may be copied or adapted into distributed skills when
their observed or project-rule license permits it and the exact source revision,
hash, local path, and attribution are recorded. GPL-derived materials stay under
the package's explicit GPL-covered boundary.

Version-sensitive API syntax must be verified against the target project and official Three.js documentation. The research snapshot on June 19–20, 2026 observed `three@0.184.0`. This is evidence, not a package-wide minimum. Three.js `PostProcessing` was deprecated in r183 after being renamed to `RenderPipeline`; current implementations must verify the installed API.

## Distillation standard

A source is useful here only when it answers one or more of these:

- What representation makes the result controllable?
- Which fields, geometry stages, render targets, or passes are coupled?
- What invariant prevents the visual system from degrading?
- How is the expensive work bounded, cached, filtered, or reconstructed?
- Which debug output exposes failure?
- What lower-cost mode preserves the defining visual mechanism?

Generic setup, API inventories, and introductory tutorials are not skill content.

## Author-supplied projects

These projects were supplied by the author as reference implementations. The
table records their Git remotes and reviewed revisions rather than local
checkout paths. Source mechanisms and assets are copied or adapted into reusable
skill resources when an accepted example needs the original material or shader
input.

| Project | Reviewed revision | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| [scottstts/MyCraft](https://github.com/scottstts/MyCraft) | `7fdb3cee3d7d99b42ee47dd659b90a4f6a658074` | `BlockMaterial.ts`, `WaterSurfaceMaterial.ts`, custom shadow targets, composer and post passes | `$threejs-procedural-materials`, `$threejs-shadow-systems`, `$threejs-image-pipeline`, `$threejs-bloom`, `$threejs-screen-space-ambient-occlusion`; water retained as a bounded/analytic comparison |
| [scottstts/Stellar](https://github.com/scottstts/Stellar) | `ad8062b54ec86312d7c028d46727796eb802c9b2` | planetary field stack, crater/ridge/biome logic, procedural normals, atmosphere shell/post handoff, reentry plasma, dimension-scaled chase/side/orbit camera rigs, body-relative frames, bounded second-order camera response, launch/orbit handoffs, ship orientation control | `$threejs-procedural-planets`, `$threejs-procedural-fields`, `$threejs-atmosphere-aerial-perspective`, `$threejs-procedural-vfx`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/Interstellar.three.js](https://github.com/scottstts/Interstellar.three.js) | `0c9c4635f9e0cbcb1598a2af8914c3086f8629a3` | wormhole integration, black-hole lensing/accretion and `noise_deep.png`, analytic ocean waves and normals, scene-owned lenses, pointer look, floating-origin framing, launch kinematics, staging, spin docking, spring convergence, rotating-frame debris | `$threejs-raymarched-space-effects`, `$threejs-water-optics`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/mysite_React](https://github.com/scottstts/mysite_React) | `98bb4ad75561aaf7263dbc6c92e2d66268f69f43` | `ArtInLifeGallery.tsx`: sculpted frame/rail geometry, procedural metal texture, selective bloom, instanced chandelier and placeholders, shadow invalidation, adaptive DPR | `$threejs-procedural-geometry`, `$threejs-procedural-materials`, `$threejs-bloom`, `$threejs-visual-validation` |

### Author-supplied local files

The local-file review context is
[scottstts/Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills)
at `2d0972a23995a0b302aceb0050fb0ceeeadff891` for the first two rows and
`1e114ab548b1365b53cd1c0955ec6198e4cf64d3` for the two vehicle studies. The
aurora intake was reviewed against project state
`c43ac9e2532373a947fb5548c705fe40814632bc` plus the author-provided standalone
shader, and both files are pinned by hash.

| File | SHA-256 | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| `source_materials/blackhole.html` | `da289ff15c8ea31db03efefdcb4b8dbbe8cd3a83095a329d3835e4b52ef926bb` | single-file WebGL black-hole renderer: RK2 Schwarzschild null-geodesic loop, exact equatorial disk crossing, Doppler/redshift disk shading, procedural deep field, HDR brightpass/blur/composite pipeline, camera/orbit/HUD separation | `$threejs-raymarched-space-effects` |
| `source_materials/submarine.html` | `6f80f233fd24e38ece393aea67a11e271782335f455d1e320cc69d18babc5f49` | single-file WebGPU procedural submarine: tilted-collar hull planning, reusable grid/lathe/sweep/fin emitters, UV-owned apertures and ornament, complete cabin/stern/fin assembly, generated TSL material inputs, deterministic topology evidence | `$threejs-procedural-geometry` |
| `source_materials/f1_race_car.html` | `4fe861a63c1e1dd34c10e951fbe16b661a9c5094b691d583211697492081dd6e` | single-file WebGPU/TSL procedural open-wheel car: monotone parameter tracks compiled into one continuous hull loft, recess-opening semantic sections, superellipse sidepods with a real inlet aperture, spanwise airfoil lofts, warped outline plates, two-plane livery projector, load-deflected tyre carcass, per-part triangle evidence | `$threejs-procedural-geometry` |
| `source_materials/motorcycle.html` | `56c43b3083037a69c438a6c46e9441c5f48d2117aa80be57111af9a2ae8697d9` | single-file WebGPU/TSL procedural supersport motorcycle: steering-axis placement, slot-tagged mesh writer, revolve/transport/upright sweeps, panel shells, spoked wheels and petal rotor masks, bore-local engine volumes, superellipse bodywork, catenary chain, signed-volume orientation guard | `$threejs-procedural-geometry` |
| `source_materials/aurora-snow-desert.html` | `3e021544cbe272db54f120eb0339455dea0fce6034d56ec887b56b0515c1ff07` | single-file WebGL polar-night scene: horizon-reaching aurora slab, warped curtain density, geometric ray steps, per-step jitter, limb extinction, shared perspective/equirectangular radiance, polar-night backdrop and stars, live terrain irradiance, clipmap snow desert, and spindrift | `$threejs-procedural-vfx`; only the aurora implementation is distributed, while all other scene systems remain in the dev gallery shim |
| `source_materials/aurora-original-shader.js` | `6ea35226f37f08adf0bffe6f10df9e2ecab3e216b8b18aead215a4a7a8a896a3` | author-provided standalone WebGL aurora: finite X ±250 / Z ±500 footprint, 75-step uniform raymarch, exact warped curtain density, screen-space lower fade, sky, stars, tone mapping, and dithering | `$threejs-procedural-vfx`; the finite aurora footprint is consumed, while sky, stars, grading, runtime, and GUI remain outside the skill |

### Local-project findings retained

- Shared procedural causes produce stronger materials than independent noise per channel.
- Geometry and normal evaluation must use the same wave or height function.
- Planet detail needs explicit macro/meso/detail bands and altitude filtering.
- Aerial perspective and sky-shell rendering must share one atmosphere parameter model.
- Thin raymarched structures need crossing tests rather than hoping a fixed step lands inside them.
- Selective bloom requires explicit contribution ownership and reliable restoration when material substitution is used.
- Adaptive quality needs observable decisions and reset rules, not an opaque frame-rate reaction.
- Camera offsets should scale from subject dimensions and be evaluated in the subject or dominant-body frame.
- A camera handoff needs one interpolation owner; stacked transition and follow smoothing creates a visible half-halt.
- Authored motion should separate analytic travel phases, spring convergence, exact terminal poses, and secondary motion.
- Rotating-frame docking is stable when axial/radial error, alignment, and spin are solved independently.

### `aurora-snow-desert.html` and `aurora-original-shader.js`

Reviewed:

- a `75`-step emissive slab raymarch with `1.055` geometric step growth;
- the three-octave warped curtain-density field and height-ramped colour;
- per-step jitter, distance extinction, and the source's narrow horizon gate;
- the matching `40`-step, `32 × 16`, four-sample equirectangular radiance pass;
- the polar-night star/backdrop pass, linear HDR target, common grade, live
  terrain radiance use, clipmap snow terrain, spindrift, camera, and controls.
- the standalone shader's finite X `±250` / Z `±500` footprint, uniform
  `75`-step march, screen-space lower fade, sky, stars, grade, and GUI.

Accepted consumption:

- `$threejs-procedural-vfx`

The distributed example owns only the aurora field, its perspective and
equirectangular materials, shared uniforms, and calibrated preset. On author
instruction, it restores the standalone curtain footprint of X `±250` and Z
`±500` instead of the snow-desert scene's `12000`-unit horizontal half-extents,
removing the long horizontal accumulation path. It also uses the standalone
uniform marcher and `0.25`-step start jitter without distance extinction or a
direction gate, because the finite footprint already owns the lower boundary.
The standalone screen-space fade is not applied to the reusable field or probe.
The dev gallery uses a modest scene-relative gain, moderately darker polar-night
colors, and an intermediate upward view to recover contrast while preserving
the snow terrain presentation. Backdrop, stars, render targets, grading,
terrain lighting, terrain, snow particles, camera, and runtime lifecycle remain
in the dev gallery shim.

## Supplied external repositories

Repositories were cloned shallowly under this directory or reviewed from an
author-supplied read-only neighboring worktree.

| Source | Reviewed revision | License observed | Distribution boundary |
| --- | --- | --- | --- |
| [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) | `48dc193515135cff2b33515c47f0a8703b977e63` | MIT | copied/adapted growth and vegetation mechanisms plus explicitly attributed MIT/CC0 demo assets |
| [takram-design-engineering/three-geospatial](https://github.com/takram-design-engineering/three-geospatial) | `b012ad06d858fc035d88aacfd73f092f93c994e4` | MIT | copied/adapted atmosphere and cloud contracts where accepted |
| [jeantimex/geospatial](https://github.com/jeantimex/geospatial) | `d166316ad38f9a21f6d7a3293b808bc7f920283e` | MIT | copied/adapted atmosphere and cloud mechanisms plus dev-only LUT, weather, volume, turbulence, and blue-noise assets |
| [perplexdotgg/mecs-tower-defense-example](https://codeberg.org/perplexdotgg/mecs-tower-defense-example) | `d7b4e8815fcee18d97e9a12c00f900294773ad1c` | MIT code; CC0 assets | copied/adapted ECS, VFX, and material mechanisms where accepted; no assets copied |
| [YasirAwan4831/holographic-shader-visualizer-three.Js](https://github.com/YasirAwan4831/holographic-shader-visualizer-three.Js) | `34810a6e09d0d640d06a2e83c5abab749baf04d5` | MIT by project rule | copied/adapted holographic projection-shell and shape-transition mechanisms for `$threejs-procedural-vfx` |
| [vibe-stack/procedural-bank](https://github.com/vibe-stack/procedural-bank) | `0034e80a61f02b88dbe13a385bdab734a365b82d` | MIT | copied/adapted building, shadow, and material mechanisms plus attributed MIT stone textures |
| [takuma-hmng8/frozen](https://github.com/takuma-hmng8/frozen) | `15a98a5104951a0bd734eb23ab21b7f79741ab09` | MIT by project rule | copied/adapted temporal-surface mechanisms where accepted |
| [scottstts/Pearl-Sea-Park](https://github.com/scottstts/Pearl-Sea-Park) | `4fbf1f3df59a97c27ad80113711622cb914ab0c3` | MIT by project rule | copied/adapted the whole underwater system — WebGPU spectral ocean, exact Snell/TIR underside, forward-refracted interface layer, aquatic medium, caustics, god rays, particulate, foam, sand-bed saucer, and grade — for `$threejs-spectral-ocean` |
| [owenyuwono/poseidon](https://github.com/owenyuwono/poseidon) | `caddf773c7e2b7c9b00ad232d21cca4f364d5272` | MIT by project rule | copied/adapted spectral-ocean mechanisms where accepted |
| [gioeledallapozza/FFTOCEAN](https://github.com/gioeledallapozza/FFTOCEAN) | `0fe3a908a86118eab9930e17b0b29df7fcc05b65` | MIT by project rule | copied/adapted stylized ocean shader mechanisms plus foam and sand assets for `$threejs-spectral-ocean` |
| [jeantimex/threejs-water](https://github.com/jeantimex/threejs-water) | `d5c06864fe22ad31f500af7f21a46aad1c7d3e27` | MIT | copied/adapted water simulation, pool caustics, pool/water/sphere shader mechanisms, and pool tile/cubemap assets for `$threejs-water-optics` |
| [achrefelouafi/OceanThreejs](https://github.com/achrefelouafi/OceanThreejs) | `da18e9254a83a6e990c0077b5d752026f3d5c480` | MIT | copied/adapted hybrid clear-water ocean mechanisms; dev-only sand texture inputs copied for visual inspection |
| [dedekpo/stylized-scene](https://github.com/dedekpo/stylized-scene) | `531c5721e3883412d0dde7db1a72732aa3ede155` | MIT | copied/adapted grass shader, blade, wind, path-mask, and noise mechanisms plus attributed effect-owned assets; scene dressing remains dev-only |
| [sabosugi/Very Hot Planet CodePen](https://codepen.io/sabosugi/pen/RNKpmQj) | `339f879d3c56eda4238b009c318ca9b89e9eb3fc` content-derived capture id from editor init-data on 2026-06-27 | MIT by project rule | copied/adapted procedural lava material mechanisms |
| [momentchan/r3f-procedural-grass](https://github.com/momentchan/r3f-procedural-grass) | `e441d2bd4eacaa0c913a8b64dfeb69bd0314a7b5`; `packages/r3f-gist` submodule `16bc424b75077a910965c98ea8ce0c5b564b54b1` | MIT; submodule has no observed license and is treated as MIT by project rule | copied/adapted realistic GPU-computed grass implementation for `$threejs-procedural-vegetation` |
| [achrefelouafi/SnowSystemThreeJS](https://github.com/achrefelouafi/SnowSystemThreeJS) | `c7a3bfbd10c93f8d7b032c322c99b38326edeb80` | MIT | copied/adapted snowfall, snow accumulation, model snow capping, and frozen-lake mechanisms into `$threejs-precipitation-surfaces` |
| [Faraz-Portfolio/demo-2023-rain-puddle](https://github.com/Faraz-Portfolio/demo-2023-rain-puddle) | `257066b63d08b227df8f982377e60f91752ddc81` | GPL-3.0 | copied/adapted wet asphalt puddle, rain, and splash mechanisms into GPL-covered precipitation example material |
| [bandinopla/threejs-easyfire](https://github.com/bandinopla/threejs-easyfire) | `994806e27d14b9226c36789ad71ae4b3583dd7db` | MIT | copied/adapted the WebGPU volumetric fire, fluid compute, mesh-emitter, SDF collision, temperature-scattering, and dev-stage mechanisms for `$threejs-procedural-vfx` |

### `ez-tree`

Reviewed:

- per-level species parameter tables;
- queue-based branch growth;
- oriented ring geometry and bark UV scale;
- taper, stochastic gnarliness, tropism, and trellis attraction;
- stratified longitudinal child placement with independently permuted angular slots;
- crossed leaf cards with canopy-oriented normals;
- leaf-root and meadow-root multi-frequency wind;
- deterministic seeds and geometry budgets.

Consumed by:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-geometry`
- `$threejs-procedural-fields`
- `$threejs-visual-validation`

The key retained mechanism is structured variation. Randomness selects within species and placement constraints; it does not replace growth structure.

### `three-geospatial`

Reviewed:

- shared atmosphere parameters for Rayleigh, Mie, and absorption density profiles;
- precomputed transmittance/scattering lookup architecture;
- coupling between sky material and aerial-perspective effect;
- ellipsoid/ECEF transforms and altitude handling;
- weather/shape/detail/turbulence cloud textures;
- multiple bounded cloud layers and packed ray intervals;
- front-to-back volumetric integration, cloud lighting, temporal reconstruction, and cloud shadows;
- WebGPU temporal and screen-space effect organization.

Consumed by:

- `$threejs-atmosphere-aerial-perspective`
- `$threejs-volumetric-clouds`
- `$threejs-image-pipeline`
- `$threejs-visual-validation`

The key retained mechanism is system coupling: sky, surface haze, light transmittance, clouds, and cloud shadows use compatible coordinate and radiometric contracts.

### `jeantimex/geospatial`

Reviewed:

- the standalone atmosphere and cloud inspection scenes;
- shared precomputed transmittance, scattering, and irradiance LUT loading;
- one atmosphere model feeding sky, sunlight, sky irradiance, and
  depth-aware aerial perspective;
- authored local-weather, base-shape, detail, turbulence, and STBN inputs;
- low, middle, and high cloud-layer parameters;
- spherical planetary layer bounds, directional optical-depth sampling, and
  temporal reconstruction;
- atmosphere/cloud composition and the resulting reference frames.

Consumed by:

- `$threejs-atmosphere-aerial-perspective`
- `$threejs-volumetric-clouds`

The exact MIT LUT, weather, volume, turbulence, and blue-noise assets needed by
the accepted atmosphere and cloud examples are copied under the corresponding
skill asset folders. The distributed skill examples copy the app-resolved
package `src/` implementation files for the atmosphere, cloud, geospatial
helper, and geospatial effect classes used by the standalone scenes; the shared
gallery host only supplies the canvas, TypeScript source serving, resize loop,
controls, and capture surface.

### `procedural-bank`

Reviewed:

- settings-to-plan-to-mesh compilation;
- mass footprints, tiers, setbacks, courtyards, and twin towers;
- exposed-edge analysis before façade placement;
- semantic façade modules, profiles, arches, cornices, ornaments, and roofs;
- material-slot mesh writing and texture-density handling;
- limestone/ornament albedo and normal response, daylight environment,
  camera framing, exposure, and dark-ground presentation;
- stable cached clipmap shadows with texel snapping, guard bands, update budgets, and targeted invalidation;
- GTAO/bent-normal composition;
- bloom, exposure, LUT grading, and atmosphere ordering;
- small-target luminance metering and readback.

Consumed by:

- `$threejs-procedural-architecture`
- `$threejs-procedural-geometry`
- `$threejs-shadow-systems`
- `$threejs-screen-space-ambient-occlusion`
- `$threejs-bloom`
- `$threejs-exposure-color-grading`
- `$threejs-image-pipeline`

The key retained mechanism is explicit compilation and ownership: design plans, material groups, shadow levels, and post signals remain inspectable before final composition.

### `mecs-tower-defense-example`

Reviewed:

- pooled instanced meshes and sprites;
- dynamic/static per-instance shader attributes;
- dense-swap removal that copies matrices, attributes, and entity indices;
- three-band terrain color/roughness with normal-driven grass and water-level wetness;
- 12,000-slot analytic spark pool with 1.3-second lifetime;
- timed debris dissolve driven by per-instance removal time;
- scene-relative HDR hierarchy for sparks, projectiles, and lasers;
- ECS ownership of VFX lifetime and reuse.

Consumed by:

- `$threejs-procedural-vfx`
- `$threejs-procedural-materials`
- `$threejs-bloom`

The retained mechanism is data-oriented effect ownership and pooling. General ECS/gameplay material is outside this pack.

### `holographic-shader-visualizer-three.Js`

Reviewed:

- one shared min/max Y range across three shapes, with a 0.1 m margin at each
  end and the set lifted 0.5 m;
- current/next complementary discards around a linear 1.5-second height sweep
  inside a 4-second dwell (cycle speed 0.25 shapes/s);
- a narrow transition-band glitch (0.3 m) plus a height-phased body glitch
  (2 m) gated by three incommensurate sines through a smoothstep;
- object-space scanlines at frequency 20 and speed 0.2, cubed, plus a 1.25 rim
  gain and a `smoothstep(0.8, 0)` falloff over squared Fresnel;
- additive blending, front faces only, depth write disabled;
- ACES exposure 1.2 and a DPR cap of 2.

Accepted consumption:

- `$threejs-procedural-vfx`

Two defects were corrected in the accepted example on explicit instruction
(recorded as divergences in `example-traces.json`): the world normal came from a
bare model-basis multiply rather than an inverse-transpose normal matrix, and
the scanline band had no footprint filter. The example resolves incidence in
view space from `normalMatrix` and dissolves the band into its own mean by
`fwidth`. The earlier "double-sided additive" concern does not hold: the material
is front-side only, and additive composition is order independent.

### `frozen`

Reviewed conceptually:

- exact full-resolution root, frost, pointer-history, and output ownership;
- `0.4`-DPR separable blur and coarse frost-noise target;
- three static procedural noise targets rendered once;
- half-float pointer ping-pong with separate visible and tilt channels;
- frost composite alpha handed to two-scale normal/refraction output;
- frame-based decay and zero-weight blur defects that adaptations must correct;
- resize and disposal boundaries.

Consumed by:

- `$threejs-temporal-surfaces`
- `$threejs-image-pipeline`

### Pearl Sea Park

Reviewed:

- WebGPU compute spectra with three 256² JONSWAP × TMA directional bands,
  deterministic Gaussian packing, packed height/horizontal evolution, and a
  workgroup inverse FFT with explicit barriers;
- a camera-medium-controlled, double-sided ocean material whose underwater
  path performs water-to-air refraction, exact unpolarised dielectric Fresnel
  with a derivative-filtered critical-angle mask, total internal reflection
  against a physically bright upwelling underside, and an energy-conserving
  transmitted-sun lobe widened by the measured per-pixel normal spread;
- pixel-footprint LOD applied to cascade sampling, vertex displacement, the
  normal flatten, capillary bands, and foam — never distance-keyed;
- one shared fixed-sun HDR sky function for the visible dome and Snell window,
  including the bounded marine-aerosol horizon layer;
- aquatic per-channel extinction and directional in-scatter over scene depth,
  followed by pre-tonemap bloom, AgX, a generated 32³ grade, and vignette;
- a 256² differential-area caustic grid drawn 3×3 into a 1024² wrapping tile,
  read by surfaces through a footprint fade to the field's conserved mean and by
  a 14-step full-resolution jittered god-ray march through the exact sampler;
- 18,000 camera-following tetrahedral particulates driven by a shared curl
  field;
- four foam coverage populations (Jacobian whitecap, wake field, windrow raft
  with its recovery tail, crest tear) feeding one thickness-graded shading path
  whose bands fade to their own means;
- a forward-projected opposite-medium structure layer whose water-side crossing
  solve is bracketed by the critical angle rather than the camera-to-source span;
- procedural sand ripples restored as a direct-light ratio, caustic reception
  through `receivedShadowNode`, and the far lagoon saucer that rises from
  680–1150 m to close the seabed/ocean horizon gap;
- terrain-local procedural ripple normals transformed exactly once into view
  space before assignment to the node-material normal hook;
- a seabed-rooted arrival structure with underwater bracing and an above-water
  silhouette suitable for Snell-window alignment inspection.

Rejected mechanisms, recorded because they must not return:

- backward screen-space tracing for either above-water optical source (a
  direction's vanishing point must be inside the frustum, which is a pure
  function of camera pitch);
- a second below-surface normal filtered by the squared Snell stretch (it drives
  the outer window to a mathematically flat plane past ~10 m of depth);
- reduced-resolution god-ray reconstruction without velocity and history;
- a view-aligned near-surface scattering slab to mask the horizon gap.

Accepted consumption:

- `$threejs-spectral-ocean`

The accepted example keeps the spectral field, the exact underwater surface
path, the interface layer, sky coupling, caustics, medium, god rays,
particulates, foam, sand material, and display treatment together. The gallery
fixes the camera below the interface and owns a deliberately simplified tower —
registered with the interface layer as its scene-scale case — plus the focused
flat-centre/far-saucer seabed geometry. The above-water optical tier (undersea
radiance capture, planar mirror reflection, baked surface sun shadow) is not
wired, because none of it can affect a permanently submerged view.

### `poseidon`

Reviewed:

- Stockham/butterfly inverse FFT performed through WebGPU compute;
- validation of the FFT in isolation before coupling it to ocean simulation;
- three disjoint spectral cascades for roughly 250 m, 17 m, and 5 m spatial scales;
- Horvath/JONSWAP directional wind-sea and swell spectrum;
- TMA finite-depth correction, Donelan–Banner directional spreading, and short-wave fade;
- choppy horizontal displacement reconstructed from spectral derivatives;
- slope FFTs and fold-aware normal handling;
- displacement-Jacobian whitecap detection with temporal foam build and decay;
- Fresnel sky reflection, reflected-sun glitter, subsurface scatter, depth color, and sub-grid detail;
- optional GPU ballistic spray driven from energetic crests.

Consumed by:

- `$threejs-spectral-ocean`
- `$threejs-procedural-fields`
- `$threejs-temporal-surfaces`
- `$threejs-procedural-vfx`
- `$threejs-visual-validation`

Poseidon's spectral mechanisms remain copied/adapted into the spectral-ocean
coverage with trace hashes. MyCraft and Interstellar remain useful for the
separate analytic/bounded-water skill; they do not define the spectral skill's
quality bound.

### `FFTOCEAN`

Reviewed:

- WebGL2/R3F FFT ocean pipeline using a Phillips initial spectrum, butterfly
  texture, MRT time-evolution targets for height, choppy displacement, slopes,
  and an approximate Jacobian;
- clipmap ocean geometry with viewer snapping and LOD morphing;
- stylized water shading with height-gradient body color, environment
  reflection, sun-path specular, SSS-like crest glow, Jacobian/noise foam,
  distance normal fade, horizon fog, and depth alpha from captured seafloor
  depth;
- camera-under-water post effect that compares camera height against the
  current displacement texture and applies Beer-Lambert fog through scene depth;
- seafloor tint and dual sampled animated caustics.

Accepted consumption:

- `$threejs-spectral-ocean`
- `$threejs-water-optics`
- `$threejs-atmosphere-aerial-perspective`
- `$threejs-image-pipeline`

The accepted example keeps the reusable stylized FFT surface, water-tinted
seafloor caustics, foam texture sampling, sky colors, and underwater
Beer-Lambert composite inside `$threejs-spectral-ocean`. The foam and sand
textures are copied into the skill because they are effect inputs rather than
dev-only scene dressing.

### `threejs-water`

Reviewed:

- bounded 2D heightfield water simulation with ping-pong render targets storing
  height, velocity, and normals;
- GPU disturbance strategies for drops, moving spheres, moving boxes, and
  compound sphere approximations for complex shapes;
- object physics integration using gravity, buoyancy, and density;
- separate above-water and below-water surface shaders with reflection,
  refraction, Fresnel, ray-object intersections, and sky/object render targets;
- differential-area caustics with object occlusion and shadow texture support;
- customizable box and rounded-box pool volumes with SDF/ray intersections.

Candidate consumption:

- `$threejs-water-optics`
- `$threejs-procedural-vfx`
- `$threejs-image-pipeline`

The key retained mechanism is bounded interactive water: simulation state,
object displacement, caustic generation, and volume-aware rendering are one
coupled system rather than a cosmetic transparent surface.

The accepted example keeps the reusable water simulation, pool caustics pass,
pool/water/sphere shader implementation, and water-volume assets inside
`$threejs-water-optics`. The tile and cubemap images are effect inputs for the
reference optical result, while camera, interaction, and visual inspection
framing remain in `dev/example-gallery/`.

### `OceanThreejs`

Reviewed:

- WebGL2 Tessendorf FFT with CPU-built deterministic spectra, butterfly
  texture, ping-pong passes, and packed displacement/derivative outputs;
- switchable Phillips, Pierson-Moskowitz, and JONSWAP spectra with directional
  spreading and significant-wave-height normalization;
- hybrid displacement combining three FFT sampling cascades with long directional
  Gerstner swell;
- GGX/Fresnel environment reflection, screen-space seabed refraction,
  Beer-Lambert extinction, SSS-like crest scatter, glints, procedural sky
  coupling, horizon edge fade, ACES grading, and Jacobian/curvature foam;
- explicit quality presets for FFT size, mesh resolution, and ocean extent.

Candidate consumption:

- `$threejs-spectral-ocean`
- `$threejs-water-optics`
- `$threejs-image-pipeline`
- `$threejs-exposure-color-grading`

This source overlaps strongly with the existing spectral-ocean example, but its
hybrid FFT-plus-Gerstner styling and full shading stack are useful as an
additional example variant rather than a new skill.

The accepted example keeps the hybrid clear-water material, side-aware
above/below surface behavior, sand-bed caustic material, and map-driven host
inputs inside `$threejs-spectral-ocean`. The copied sand texture set is owned by
the dev gallery so visual inspection can match the reference seabed without
making those decorative maps part of the skill asset contract.

### `stylized-scene`

Reviewed:

- WebGPU/TSL instanced grass using per-instance world origin and facing
  attributes so gusts sample field position and bend coherently after instance
  rotation;
- circular-arc cantilever bending driven by directional gust waves, organic
  noise jitter, turbulence, chop, tip flutter, and seeded desynchronization;
- grass color from root-tip gradients, patch and macro variation, ground-color
  projection, height variation, translucency, Fresnel rim, and double-sided
  normal fixes;
- tree leaf cards reusing the same wind node with per-bush origins, yaw bases,
  cluster phase, canopy lean, and camera-facing normals;
- ground material blending grass/dirt with a path mask, noise breakup, height
  bias, normal/roughness blending, and path depression.

Candidate consumption:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-materials`
- `$webgpu-threejs-tsl`

The key retained mechanism is a reusable TSL wind/material field for stylized
grass and leaf cards. Asset reuse should be limited to license-verified inputs
that are intrinsic to an accepted example.

The accepted example stores `grass-blades-up.glb`, `path.webp`, and
`perlin.webp` under the skill because they directly define blade geometry and
the authored grass/path field. Ground textures, grass surface textures, tree
meshes, leaf alpha, and skybox are copied only into `dev/example-gallery/` as
inspection context.

### `Very Hot Planet` CodePen

Reviewed:

- fullscreen raymarched terrain shader with 2D value-noise/fBm heightfield,
  time-advected flow, sine/cosine domain distortion, and pulsed amplitude;
- finite-difference normals from the same SDF map used by the raymarcher;
- height-based lava/rock material split, emissive lava gradient, volumetric glow
  accumulated during raymarch steps, distance fog, vignette, gamma, and film
  noise;
- analytic screen-space spark loop with hash-derived positions, nonlinear
  upward motion, turbulent drift, ray proximity glow, and lifetime fade;
- lil-gui controls for deformation, procedural generation, color, and sparks.

Candidate consumption:

- `$threejs-procedural-materials`
- `$threejs-procedural-fields`
- `$threejs-procedural-vfx`
- no standalone lava skill for this intake; the accepted reusable surface is a
  procedural-materials example.

The pen is treated as MIT by project rule. The lava example copies/adapts the
reviewed raymarch, material split, glow, ember, fog, vignette, gamma, and grain
mechanisms into the procedural-materials example.

### `r3f-procedural-grass`

Reviewed:

- WebGL2 multiple-render-target compute pass that writes blade parameters,
  clump data, and motion seeds for a dense instanced grass field;
- deterministic jittered blade placement over a terrain-conforming patch;
- Voronoi clump centers, per-clump type trends, blade height/width/bend
  variation, wind-facing yaw, and per-blade LOD/cull seeds;
- Bezier blade spine with wind push, travelling sway, tip flutter, distance
  wind falloff, vertex-row folding, random distance culling, and density
  compensation;
- lighting-normal blending toward clump normals, distance fade toward the
  ground normal/color, height AO, backlight translucency, and per-blade/clump
  color variation;
- FBM terrain height and finite-difference normals supplied by the same shader
  field.

Accepted consumption:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-fields`
- `$threejs-procedural-materials`
- `$threejs-visual-validation`

This is added as an additional realistic grass example, not a replacement for
the existing stylized meadow grass. The source depends on an unlicensed
`r3f-gist` submodule for shader utility and noise chunks; under the current
project rule that submodule is treated as MIT only because it has no observed
license.

The accepted example keeps the MRT blade-parameter compute pass, terrain field,
Voronoi clumps, Bezier blade folding, wind, LOD/cull, color/normal fade, and
lighting mechanisms inside `$threejs-procedural-vegetation`. The dev gallery
owns only the inspection scene, camera, source-like directional light,
environment-only lighting, post pass, and debug presentation.

### `SnowSystemThreeJS`

Reviewed:

- camera-centered GPU-instanced soft snow billboards with wrapped volume,
  per-flake seeds, slow gravity, wind drift, and figure-eight flutter;
- shared time and wind uniforms that keep snowfall and ground sparkle in
  lockstep;
- world-space FBM snow mask, coverage threshold, melt-line softness, snow depth,
  drift bumps, and edge taper;
- a single ground-height function used for vertex displacement and
  finite-difference snow normals;
- snow albedo, matte roughness override, sparse twinkling ice-crystal sparkle,
  and optional lake clearing from the same mask stack;
- model-surface snow capping by upward-facing world normals plus model-locked
  coverage noise, displaced snow thickness, roughness override, sparkle, and
  relief normals;
- optional frozen-lake blob field shared by ground basin carving and translucent
  ice sheet, with shoreline frost, cracks, bubbles, Fresnel reflection, and sun
  glint.

Accepted consumption:

- `$threejs-precipitation-surfaces`
- `$threejs-image-pipeline`

The accepted example keeps the wrapped snowfall volume, shared wind/time
uniforms, world-space snow mask, ground displacement and normals, object snow
capping, sparkle, and optional frozen-lake composition inside
`$threejs-precipitation-surfaces`. Dev-only asphalt inputs, the original
reference rusty car GLB, compressed-model loader support, source-matched model
recentering/resting, cinematic post presentation, and scene framing remain
under `dev/example-gallery/`. The user-supplied compressed car handoff was
copied to `source_materials/user-supplied/old-rusty-car.glb` with SHA-256
`f2f29c4d6d7192e1d44d88238311bccb7fd5251517138c5769439ca71bce4d6b`, but the
gallery uses `source_materials/SnowSystemThreeJS/public/old_rusty_car_2.glb`
for visual parity.

### `demo-2023-rain-puddle`

Reviewed:

- rain-progress envelope that drives material wetness, falling drops, splashes,
  and source-side audio timing;
- PBR asphalt puddle material with procedural puddle mask, staged roughness
  collapse, analytic ripple normals, normal-map handoff, and circular opacity
  masking;
- instanced falling drop planes with camera-facing orientation and rain-progress
  alpha;
- surface-sampled splash placement weighted to upward-facing mesh normals,
  flipbook animation, additive blending, and per-instance splash progress;
- source thunder/lightning presentation was reviewed and deliberately omitted
  from the accepted gallery extraction so the precipitation example has no
  scene flash proxy.

Accepted consumption:

- `$threejs-precipitation-surfaces`

The source is GPL-3.0. The accepted example keeps its copied puddle material,
rain-progress envelope, ripple-normal shader, instanced drops, splash flipbook,
and surface sampling within the package's added GPL-covered boundary. The
effect-owned splash atlas and road texture set are copied under the skill; HDR
and trash inspection assets remain dev-only.

Live Vite inspection of the original checkout on this workstation started the
rain/drop/splash scene but the puddle material failed to compile with the
installed dependency set because `three-custom-shader-material` no longer
provided `csm_Bump`. The public live demo declared in the source README was
therefore inspected directly on June 30, 2026 for visual comparison and
captured at `.example-captures/reference/rain-puddle-live.png`. The accepted
extraction validates the copied puddle mechanisms through source inspection,
copied shader parity, the live-demo comparison, runtime captures, and explicit
puddle-mask/ripple-normal diagnostics rather than relying on the broken local
checkout rendering path.

### `GrassSystemThreeJS`

- Repository: https://github.com/achrefelouafi/GrassSystemThreeJS
- Revision: `b236b2a38d9f35daa2ddc7b0152544b10e635d0c`

Reviewed:

- a PBR soil texture set with shared tiling and correct color/data spaces;
- world-space simplex-fBm mounds with coverage, drift, and edge taper;
- the same mound height used for vertex displacement and finite-difference normals;
- broad tone variation and moisture masks coupling albedo and roughness;
- warped two-scale Worley dry-earth cracks coupling color, roughness, and groove normals;
- a raised moss carpet sharing coverage, height, color, roughness, normal, and AO causes;
- model-locked upward-face moss accumulation on the rusty-car GLB;
- adjacent grass, cloud, and post systems were inspected but excluded from this intake.

Accepted consumption:

- `$threejs-procedural-materials`

The accepted example is explicitly hybrid: Ground103 and Moss002 provide the
texture-backed PBR identities, while procedural fields drive terrain height,
moisture, cracks, moss coverage/thickness, and model accumulation. Both texture
sets are effect-owned and copied into the skill. The rusty-car GLB is shared
from the existing dev-gallery inspection asset; scene lights, environment,
camera, and controls remain gallery-owned.

### `rain`

- Repository: https://github.com/rocksdanister/rain
- Revision: `55d90619c2ba0cfc68c81f6b39f8d2dc64e8072b`

Reviewed:

- one static and two travelling procedural droplet layers;
- hashed cell offsets, saw-shaped lifetimes, elongated drop bodies, trails, and secondary droplets;
- finite-difference coverage normals driving background refraction;
- stochastic disc blur with a runtime iteration budget;
- aspect-fill correction, cool grading, lightning, vignette, brightness, panning, and wallpaper integration.

Accepted consumption:

- `$threejs-temporal-surfaces`

The fragment shader is copied byte-for-byte. The background image remains a
dev-gallery inspection asset; wallpaper APIs, file/video selection, and GUI are
not part of the skill implementation. No license file was observed, so this
source is treated as MIT under the project rule.

### `VegetationGeneratorThreeJS`

- Repository: https://github.com/achrefelouafi/VegetationGeneratorThreeJS
- Revision: `f6c26004c0763011248a65725a56ed28339fdf91`

Reviewed:

- deterministic Catmull-Rom ivy stems reprojected onto arbitrary mesh surfaces;
- tangent-plane creeping branches, surface-loss droop, and BVH first-hit raycasting;
- parallel-transport tube rings and ordered growth draw ranges;
- instanced procedural ivy leaves with rigid petiole-hinge wind;
- deterministic flower sites, bud-to-umbel bloom springs, and growth reveal;
- painting UI, application modes, imported models, and the separate banyan generator.

Accepted consumption:

- `$threejs-procedural-vegetation`

Only procedural ivy is retained. The reusable TypeScript modules are copied
byte-for-byte and translated without minification for direct browser use. The
gallery owns a deterministic painted-path fixture and host sphere.

### `threejs-silhouette-pom`

- Repository: https://github.com/SkyeShark/threejs-silhouette-pom
- Revision: `5b5b48749aab3237e6788a93d84f324995cfeab0`

Reviewed:

- adaptive tangent-space TSL height marching with hit refinement;
- bounded silhouette coverage and sample clamping;
- curvature-aware sag, coarse horizon chase, and horizon trimming;
- inflated curved shells with relief extending beyond the base silhouette;
- central-difference relief normals and light-ray self-shadowing;
- carved and full-relief shadow-map ownership through mask, depth, and received-position nodes;
- deterministic packed procedural height/emission/tone maps.

Accepted consumption:

- `$threejs-parallax-occlusion-mapping`

The core parallax module is copied byte-for-byte. The gallery retains the full
bulkhead composition: procedural wall, deck, columns, and two overhead pipes.
The inspector, GUI, and optional bloom remain dev-runtime concerns.

### `threejs-easyfire`

- Repository: https://github.com/bandinopla/threejs-easyfire
- Revision: `994806e27d14b9226c36789ad71ae4b3583dd7db`
- License: MIT

Reviewed:

- separate world, render, and physics volume dimensions;
- eleven 3D textures for velocity, dye, divergence, pressure, vorticity,
  procedural curl, signed distance, and surface velocity;
- fixed WebGPU compute ordering, ping-pong ownership, semi-Lagrangian
  advection, vorticity confinement, and Jacobi pressure projection;
- preallocated mesh-vertex emitters with transform/property/velocity storage
  buffers;
- box and ellipsoid SDF collider baking plus moving-wall response;
- temperature-tier HDR raymarching, self-absorption, depth handoff, and bloom;
- demo camera, stage geometry, teapot, moving colliders, lights, and exact
  perceptual settings.

Accepted consumption:

- `$threejs-procedural-vfx`

The reusable example retains the complete authored simulation and shading
system under product-neutral names. Inspector/browser persistence controls are
excluded. The copied GLB remains dev-only because it defines the inspection
stage and emitter presentation rather than the reusable fire effect. Gallery
diagnostics expose density, temperature, velocity, colliders, and the non-bloom
baseline without changing the final branch.

## Focused technical references

These references support mathematical or rendering claims that are not specific to one inspected project:

- [Official Three.js documentation](https://threejs.org/docs/) — version-specific API verification.
- [Official Three.js TSL documentation](https://threejs.org/docs/pages/TSL.html) — current node/shader surface verification.
- [Three.js RenderPipeline documentation](https://threejs.org/docs/pages/RenderPipeline.html) — current post-pipeline API verification.
- [Three.js color management manual](https://threejs.org/manual/en/color-management.html) — color-space and output-conversion verification.
- [Filament rendering notes](https://google.github.io/filament/main/filament.html) — PBR, exposure, and material-response grounding.
- [Disney Physically-Based Shading](https://disneyanimation.com/publications/physically-based-shading-at-disney/) — artist-facing material parameter reasoning.
- [GPU Gems: Effective Water Simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) — analytic wave derivatives and frequency decomposition.
- [GPU Gems 2: Accurate Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering) — scattering and optical-depth integration.
- [Eric Bruneton: Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/) — atmosphere lookup architecture.
- [Inigo Quilez articles](https://iquilezles.org/articles/) — SDF, noise, and domain-warping mathematics.
- [Scalar Spatiotemporal Blue Noise Masks](https://arxiv.org/abs/2112.09629) — stable stochastic sampling.
- [Playdead temporal reprojection](https://github.com/playdeadgames/temporal) — history reprojection and neighborhood constraints.
- [OpenAI Codex Agent Skills](https://developers.openai.com/codex/skills) — packaging shape and progressive disclosure.

These sources are paraphrased. Official documentation remains the authority for installed API behavior.

## Pack consumption map

| Skill | Primary distilled evidence |
| --- | --- |
| `$threejs-skill-router` | repeated decomposition patterns across all reviewed systems |
| `$threejs-camera-direction` | Stellar camera rig/runtime systems; Interstellar scene cameras, pointer look, floating-origin shots, and scene lifecycle |
| `$threejs-procedural-animation` | Interstellar launch, staging, spin docking, and debris; Stellar frame-rate-independent response and quaternion control |
| `$threejs-procedural-fields` | Stellar, MyCraft, `ez-tree`, `mecs-tower-defense-example` |
| `$threejs-procedural-materials` | MyCraft, Stellar, `mecs-tower-defense-example`, `Very Hot Planet` CodePen, PBR references |
| `$threejs-procedural-geometry` | local WebGPU submarine, race-car, and motorcycle HTML studies; ArtInLife, `ez-tree`, `procedural-bank` |
| `$threejs-procedural-vegetation` | `ez-tree`, `stylized-scene` |
| `$threejs-procedural-architecture` | `procedural-bank` |
| `$threejs-procedural-planets` | Stellar |
| `$threejs-spectral-ocean` | Pearl Sea Park, `poseidon`, `OceanThreejs`, `FFTOCEAN`; directional-spectrum and FFT literature |
| `$threejs-water-optics` | MyCraft and Interstellar.three.js analytic/optical comparisons; `threejs-water`, `FFTOCEAN`; GPU Gems |
| `$threejs-atmosphere-aerial-perspective` | `jeantimex/geospatial`, Stellar, `three-geospatial`, atmosphere references |
| `$threejs-volumetric-clouds` | `jeantimex/geospatial`, `three-geospatial` |
| `$threejs-raymarched-space-effects` | interstellarThreeJS; local Schwarzschild black-hole HTML |
| `$threejs-procedural-vfx` | `aurora-snow-desert.html`, `aurora-original-shader.js`, Stellar, `mecs-tower-defense-example`, `holographic-shader-visualizer-three.Js`, `threejs-easyfire` |
| `$threejs-temporal-surfaces` | `frozen`, conceptual only |
| `$threejs-shadow-systems` | MyCraft, `procedural-bank` |
| `$threejs-screen-space-ambient-occlusion` | MyCraft, `procedural-bank`, `three-geospatial` |
| `$threejs-bloom` | ArtInLife, MyCraft, `procedural-bank`, `mecs-tower-defense-example` |
| `$threejs-exposure-color-grading` | `procedural-bank`, color references |
| `$threejs-image-pipeline` | MyCraft, ArtInLife, `procedural-bank`, `three-geospatial`, `frozen` |
| `$threejs-visual-validation` | failure modes and quality controls observed across all sources |

## Scope boundaries

- The pack does not teach basic Three.js setup or repeat API documentation.
- It does not provide a general game-engine, ECS, physics, UI, audio, or gameplay curriculum.
- External assets are relevant only when they support an authored procedural composition.
- WebGL, WebGPU, GLSL, and TSL syntax remain version-sensitive implementation surfaces. Skills specify the mechanism and invariants; agents must inspect the target renderer before choosing exact APIs.
