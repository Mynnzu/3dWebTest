import * as THREE from "three";
import "@fontsource/italiana/latin-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { WatchAssembly, REFERENCE_LAYERS } from "./watch-model.js";
import { ConfiguratorManager } from "./configurator.js";

const $ = (id) => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const chapters = [
  "Intro",
  "Disassembly",
  "Heart",
  "Presentation",
  "Bracelet",
  "Perspectives",
  "Configurator",
  "Reassembly",
  "Archive",
];
const names = [
  "Introduction",
  "Inside the calibre",
  "The beating heart",
  "The architecture",
  "A seamless connection",
  "Two perspectives",
  "Your composition",
  "Coming together",
  "The editions",
];
// The camera has a dedicated product viewport so the object never competes with copy.
const poses = [
  {
    distance: 24,
    target: [0, -0.3, 0],
    rotation: [0.18, -0.36, -0.25],
    spread: 0,
  },
  {
    distance: 27,
    target: [0, 0, 0],
    rotation: [0.4, -0.85, -0.24],
    spread: 1.4,
  },
  {
    distance: 6.2,
    target: [-0.72, -0.62, 0.2],
    rotation: [0, 0, 0],
    spread: 0,
  },
  { distance: 20, target: [0, 0, 0], rotation: [0.55, -0.8, -0.45], spread: 0 },
  {
    distance: 13,
    target: [0, -3.1, -1],
    rotation: [0.22, -0.2, 0.08],
    spread: 0,
  },
  { distance: 25, target: [0, 0, 0], rotation: [0, 0, 0], spread: 0 },
  {
    distance: 23,
    target: [0, -0.2, 0],
    rotation: [0.12, -0.25, -0.12],
    spread: 0,
  },
  {
    distance: 27,
    target: [0, 0, 0],
    rotation: [0.4, -0.8, -0.25],
    spread: 1.4,
  },
  {
    distance: 24,
    target: [0, -0.3, 0],
    rotation: [0.18, -0.36, -0.25],
    spread: 0,
  },
];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
let renderer, scene, camera, watch, environment;
let active = -1,
  scroll = window.scrollY,
  targetScroll = window.scrollY,
  maxScroll = 1;
let selectedLayer = null,
  playing = false,
  dirty = true,
  settleUntil = 0,
  frameId = 0;
let lastFrame = 0,
  mechanicalTime = 0,
  width = innerWidth,
  height = innerHeight;
let drag = null,
  rotationX = 0,
  rotationY = 0;
const overlays = [...document.querySelectorAll(".scene-overlay")];
const drawer = $("chapter-nav");
const position = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const targetRotation = new THREE.Euler();

function invalidate() {
  dirty = true;
  settleUntil = performance.now() + 700;
}
function setPlaying(value) {
  playing = value;
  $("btn-play-story").setAttribute("aria-pressed", String(value));
  $("btn-play-story").querySelector(".btn-text").textContent = value
    ? "Pause the story"
    : "Play the story";
  $("btn-play-story").querySelector(".play-icon").textContent = value
    ? "Ⅱ"
    : "▷";
  $("btn-story-toggle").textContent = value ? "Ⅱ" : "▷";
  $("btn-story-toggle").setAttribute(
    "aria-label",
    value ? "Pause story" : "Play story",
  );
  $("btn-story-toggle").setAttribute("aria-pressed", String(value));
  invalidate();
}
function goTo(index, smooth = true) {
  index = clamp(index, 0, 8);
  setPlaying(false);
  window.scrollTo({
    top: (maxScroll * index) / 8,
    behavior: smooth && !reducedMotion.matches ? "smooth" : "instant",
  });
  closeMenu(false);
  invalidate();
}
function closeMenu(restoreFocus = true) {
  const wasOpen = !drawer.hidden;
  drawer.hidden = true;
  $("nav-backdrop").hidden = true;
  $("btn-menu").setAttribute("aria-expanded", "false");
  $("experience").inert = false;
  document.querySelector(".chapter-footer").inert = false;
  $("canvas-container").inert = false;
  document.querySelector(".view-controls").inert = false;
  document.querySelector(".header-links").inert = false;
  if (wasOpen && restoreFocus) $("btn-menu").focus();
}
function selectLayer(index) {
  selectedLayer = selectedLayer === index ? null : index;
  document.querySelectorAll(".layer-tab").forEach((button, i) => {
    button.classList.toggle("is-selected", selectedLayer === i);
    button.setAttribute("aria-pressed", String(selectedLayer === i));
  });
  $("component-card").hidden = selectedLayer === null;
  if (selectedLayer !== null) {
    const layer = REFERENCE_LAYERS[selectedLayer];
    $("card-title").textContent = layer.label;
    $("card-desc").textContent = layer.desc;
    $("card-material").textContent = layer.material;
    $("card-finish").textContent = layer.finish;
    $("component-card").scrollIntoView({
      block: "nearest",
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }
  invalidate();
}
function setupUI() {
  const storyToggle = document.createElement("button");
  storyToggle.id = "btn-story-toggle";
  storyToggle.className = "chapter-arrow story-toggle";
  storyToggle.type = "button";
  storyToggle.textContent = "▷";
  storyToggle.setAttribute("aria-label", "Play story");
  storyToggle.setAttribute("aria-pressed", "false");
  $("btn-next").before(storyToggle);
  for (const [index, key] of chapters.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = `${String(index + 1).padStart(2, "0")} / ${names[index]}`;
    button.setAttribute("aria-label", button.title);
    button.addEventListener("click", () => goTo(index));
    $("chapter-progress").append(button);
  }
  REFERENCE_LAYERS.forEach((layer) => {
    const button = document.createElement("button");
    button.className = "layer-tab";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="layer-idx">0${layer.index + 1}</span><span>${layer.label}</span>`;
    button.addEventListener("click", () => selectLayer(layer.index));
    $("layer-selector").append(button);
  });
  $("btn-close-card").addEventListener("click", () => {
    const previous = selectedLayer;
    selectLayer(selectedLayer);
    document.querySelectorAll(".layer-tab")[previous]?.focus();
  });
  $("btn-menu").addEventListener("click", () => {
    if (!drawer.hidden) return closeMenu();
    setPlaying(false);
    drawer.hidden = false;
    $("nav-backdrop").hidden = false;
    $("btn-menu").setAttribute("aria-expanded", "true");
    $("experience").inert = true;
    document.querySelector(".chapter-footer").inert = true;
    $("canvas-container").inert = true;
    document.querySelector(".view-controls").inert = true;
    document.querySelector(".header-links").inert = true;
    drawer.querySelector("a").focus();
  });
  $("nav-backdrop").addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      setPlaying(false);
    }
    if (!drawer.hidden && event.key === "Tab") {
      const focusables = [$("btn-menu"), ...drawer.querySelectorAll("a")];
      const next =
        (focusables.indexOf(document.activeElement) +
          (event.shiftKey ? -1 : 1) +
          focusables.length) %
        focusables.length;
      event.preventDefault();
      focusables[next].focus();
    }
  });
  document.querySelectorAll("[data-section-target]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      goTo(chapters.indexOf(link.dataset.sectionTarget));
      history.replaceState(null, "", link.getAttribute("href"));
      $("experience").focus({ preventScroll: true });
    }),
  );
  $("btn-previous").addEventListener("click", () => goTo(active - 1));
  $("btn-next").addEventListener("click", () => goTo(active + 1));
  $("btn-back-top").addEventListener("click", () => goTo(0));
  [$("btn-play-story"), storyToggle].forEach((button) =>
    button.addEventListener("click", () => {
      if (!playing && scroll / maxScroll > 0.99) {
        window.scrollTo({ top: 0, behavior: "instant" });
        scroll = 0;
      }
      setPlaying(!playing);
    }),
  );
  $("btn-reset").addEventListener("click", () => {
    rotationX = rotationY = 0;
    invalidate();
  });
  $("btn-motion").addEventListener("click", () => {
    paused = !paused;
    syncMotion();
    invalidate();
  });
  $("btn-retry").addEventListener("click", () => location.reload());
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    syncMotion();
    invalidate();
  });
  syncMotion();
  const canvas = $("watch-canvas");
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !drawer.hidden) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    setPlaying(false);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    rotationY += (event.clientX - drag.x) * 0.008;
    if (event.pointerType !== "touch")
      rotationX = clamp(
        rotationX + (event.clientY - drag.y) * 0.005,
        -0.9,
        0.9,
      );
    drag.x = event.clientX;
    drag.y = event.clientY;
    invalidate();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    canvas.addEventListener(type, () => {
      drag = null;
    }),
  );
  canvas.addEventListener("keydown", (event) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    if (event.key === "Home") rotationX = rotationY = 0;
    if (event.key === "ArrowLeft") rotationY -= 0.15;
    if (event.key === "ArrowRight") rotationY += 0.15;
    if (event.key === "ArrowUp") rotationX = clamp(rotationX - 0.15, -0.9, 0.9);
    if (event.key === "ArrowDown")
      rotationX = clamp(rotationX + 0.15, -0.9, 0.9);
    invalidate();
  });
  window.addEventListener(
    "scroll",
    () => {
      targetScroll = window.scrollY;
      invalidate();
    },
    { passive: true },
  );
  ["wheel", "touchstart"].forEach((type) =>
    window.addEventListener(
      type,
      () => {
        if (playing) setPlaying(false);
      },
      { passive: true },
    ),
  );
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      setPlaying(false);
    } else {
      lastFrame = performance.now();
      invalidate();
      frameId = requestAnimationFrame(renderLoop);
    }
  });
}
function syncMotion() {
  $("btn-motion").setAttribute("aria-pressed", String(paused));
  const label = paused
    ? "Resume mechanical animation"
    : "Pause mechanical animation";
  $("btn-motion").setAttribute("aria-label", label);
  $("btn-motion").title = label;
  $("btn-motion").textContent = paused ? "▷" : "Ⅱ";
}
function resize() {
  width = innerWidth;
  height = innerHeight;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
  renderer?.setPixelRatio(
    Math.min(devicePixelRatio, width <= 760 ? 1.5 : 1.75),
  );
  renderer?.setSize(width, height);
  invalidate();
}
function updateChapter(index) {
  if (active === index) return;
  active = index;
  rotationX = rotationY = 0;
  selectedLayer = null;
  $("component-card").hidden = true;
  document.querySelectorAll(".layer-tab").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  document.body.dataset.section = chapters[index];
  overlays.forEach((overlay, i) => {
    const visible = i === index;
    overlay.classList.toggle("is-visible", visible);
    overlay.inert = !visible;
    overlay.setAttribute("aria-hidden", String(!visible));
    if (visible) overlay.scrollTop = 0;
  });
  $("chapter-number").textContent = String(index + 1).padStart(2, "0");
  $("chapter-name").textContent = names[index];
  $("btn-previous").disabled = index === 0;
  $("btn-next").disabled = index === 8;
  $("stage-label").textContent =
    index === 1
      ? "CAL. AE–321 / SEVEN LAYERS"
      : index === 2
        ? "CAL. AE–321 / THE ESCAPEMENT"
        : "CAL. AE–321 / OPEN HEART";
  $("interaction-hint").textContent =
    index === 1 ? "SELECT A LAYER TO INSPECT" : "DRAG TO EXPLORE";
  [...$("chapter-progress").children].forEach((button, i) => {
    button.classList.toggle("is-active", i === index);
    button.classList.toggle("is-past", i < index);
    if (i === index) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  drawer.querySelectorAll("a").forEach((link, i) => {
    link.classList.toggle("is-active", i === index);
    if (i === index) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  invalidate();
}
function setupScene() {
  renderer = new THREE.WebGLRenderer({
    canvas: $("watch-canvas"),
    alpha: true,
    antialias: true,
    powerPreference: "default",
  });
  renderer.setClearColor(0xeeeae2, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.05;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff7e6, 0x707b69, 0.8));
  const key = new THREE.DirectionalLight(0xfff6e7, 2);
  key.position.set(-3, 5, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdceaff, 1.4);
  rim.position.set(5, 2, -1);
  scene.add(rim);
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  watch = new WatchAssembly();
  scene.add(watch.root);
  $("watch-canvas").addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    showFallback();
  });
  $("watch-canvas").addEventListener("webglcontextrestored", () =>
    location.reload(),
  );
}
function showFallback() {
  $("webgl-fallback").hidden = false;
  $("watch-canvas").hidden = true;
  document.querySelector(".view-controls").hidden = true;
  renderer = null;
}
function viewport(x, top, w, h, viewCamera = camera) {
  renderer.setViewport(x, height - top - h, w, h);
  renderer.setScissor(x, height - top - h, w, h);
  viewCamera.aspect = w / h;
  viewCamera.updateProjectionMatrix();
}
const frontCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const rearCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
function renderPerspectives() {
  watch.root.rotation.set(0, 0, 0);
  watch.setDisassemblySpread(0);
  ["viewport-front", "viewport-rear"].forEach((id, index) => {
    const rect = $(id).getBoundingClientRect();
    const viewCamera = index ? rearCamera : frontCamera;
    const distance = Math.max(24, 11 / (rect.width / rect.height));
    viewCamera.position.set(0, -0.25, index ? -distance : distance);
    viewCamera.lookAt(0, -0.25, 0);
    viewport(rect.x, rect.y, rect.width, rect.height, viewCamera);
    renderer.render(scene, viewCamera);
  });
}
function renderLoop(time) {
  if (document.hidden) return;
  frameId = requestAnimationFrame(renderLoop);
  if (time - lastFrame < 1000 / 30) return;
  const dt = Math.min((time - lastFrame) / 1000, 0.08);
  lastFrame = time;
  if (playing) {
    targetScroll = Math.min(maxScroll, window.scrollY + (maxScroll * dt) / 100);
    window.scrollTo({ top: targetScroll, behavior: "instant" });
    if (targetScroll >= maxScroll - 1) setPlaying(false);
    invalidate();
  }
  const difference = targetScroll - scroll;
  scroll =
    reducedMotion.matches || Math.abs(difference) < 0.1
      ? targetScroll
      : scroll + difference * Math.min(1, dt * 12);
  const chapterPosition = clamp((scroll / maxScroll) * 8, 0, 8);
  // Midpoint selection gives all nine chapters, including the final edition, a stable destination.
  updateChapter(clamp(Math.round(chapterPosition), 0, 8));
  if (Math.abs(difference) > 0.1) invalidate();
  const animated = !paused;
  if (!dirty && !animated && time > settleUntil) return;
  $("scroll-progress-fill").style.width = `${(scroll / maxScroll) * 100}%`;
  const assemblyProgress = clamp((chapterPosition - 7) / 0.42, 0, 1);
  if (active === 7) {
    $("reassembly-pct-text").textContent =
      `${Math.round(assemblyProgress * 100)}%`;
    $("reassembly-fill").style.width = `${assemblyProgress * 100}%`;
    $("reassembly-step-title").textContent =
      assemblyProgress > 0.95
        ? "ASSEMBLY COMPLETE"
        : assemblyProgress > 0.5
          ? "THE CASE CLOSES"
          : "COMPONENTS ALIGNING";
  }
  if (renderer && watch) {
    if (animated) {
      mechanicalTime += dt;
      watch.update(mechanicalTime, dt);
    }
    const lower = Math.floor(chapterPosition),
      upper = Math.min(8, lower + 1);
    const fraction = reducedMotion.matches
      ? 0
      : THREE.MathUtils.smoothstep(chapterPosition - lower, 0.18, 0.82);
    const a = poses[reducedMotion.matches ? active : lower],
      b = poses[reducedMotion.matches ? active : upper];
    const distance = THREE.MathUtils.lerp(a.distance, b.distance, fraction);
    lookTarget.set(...a.target).lerp(position.set(...b.target), fraction);
    camera.position.set(lookTarget.x, lookTarget.y, lookTarget.z + distance);
    camera.lookAt(lookTarget);
    targetRotation.set(
      THREE.MathUtils.lerp(a.rotation[0], b.rotation[0], fraction) + rotationX,
      THREE.MathUtils.lerp(a.rotation[1], b.rotation[1], fraction) + rotationY,
      THREE.MathUtils.lerp(a.rotation[2], b.rotation[2], fraction),
    );
    watch.root.rotation.copy(targetRotation);
    let spread = THREE.MathUtils.lerp(a.spread, b.spread, fraction);
    if (active === 7 && chapterPosition >= 7)
      spread = 1.4 * (1 - assemblyProgress);
    watch.setDisassemblySpread(spread, active === 1 ? selectedLayer : null);
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    if (active === 5) renderPerspectives();
    else {
      if (width <= 760)
        viewport(0, 111, width, Math.max(140, (height - 148) * 0.45 - 25));
      else
        viewport(width * 0.42, 165, width * 0.55, Math.max(180, height - 310));
      renderer.render(scene, camera);
    }
    renderer.setScissorTest(false);
  }
  dirty = false;
}

setupUI();
try {
  setupScene();
} catch (error) {
  console.warn("3D preview unavailable:", error.message);
  showFallback();
}
new ConfiguratorManager(watch, invalidate);
resize();
const initialLink = [
  ...document.querySelectorAll("[data-section-target]"),
].find((link) => link.getAttribute("href") === location.hash);
if (initialLink) {
  goTo(chapters.indexOf(initialLink.dataset.sectionTarget), false);
  scroll = targetScroll = window.scrollY;
}
updateChapter(Math.round((scroll / maxScroll) * 8));
frameId = requestAnimationFrame(renderLoop);
requestAnimationFrame(() => $("loading-screen").classList.add("is-loaded"));
