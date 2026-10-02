import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// A toothed rim, open spokes and central hub read correctly from either side.
function gearGeometry(radius, depth, teeth = 32) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= teeth * 4; i++) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const r = radius * (i % 4 < 2 ? 1 : 0.92);
    const x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.68, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const rim = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 40,
  });
  rim.translate(0, 0, -depth / 2);
  const parts = [rim];
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.BoxGeometry(
      radius * 1.5,
      radius * 0.13,
      depth,
    ).toNonIndexed();
    spoke.rotateZ((i * Math.PI) / 3);
    parts.push(spoke);
  }
  const hub = new THREE.CylinderGeometry(
    radius * 0.19,
    radius * 0.19,
    depth * 1.7,
    20,
  ).toNonIndexed();
  hub.rotateX(Math.PI / 2);
  parts.push(hub);
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged.rotateX(-Math.PI / 2);
}

// Layer definitions matching the Disassembly architecture
export const REFERENCE_LAYERS = [
  {
    index: 0,
    id: "bezel_crystal",
    label: "Bezel & Sapphire",
    desc: "Double-domed anti-reflective sapphire crystal seated inside a high-polish 316L stainless steel tachymeter bezel.",
    material: "Sapphire Crystal (Mohs 9) · 316L Steel",
    finish: "Mirror Bevelled · Satin Radial Brush",
    offset: 2.8,
  },
  {
    index: 1,
    id: "dial_hands",
    label: "Stepped Dial & Hands",
    desc: "Deep sunray lacquer dial with open-heart aperture, faceted diamond-cut indices, and Super-LumiNova C3 luminescence.",
    material: "Brass Substrate · Rhodium Plating",
    finish: "Sunburst Lacquer · Diamond Polished",
    offset: 1.8,
  },
  {
    index: 2,
    id: "chronograph_works",
    label: "Column Wheel & Levers",
    desc: "Classic 7-pillar column wheel with operating levers, clutch rocker, and heart cams coordinating start, stop, and flyback.",
    material: "Glucydur · Tempered Spring Steel",
    finish: "Straight Grained (Traits-tirés) · Hand-Chamfered",
    offset: 0.9,
  },
  {
    index: 3,
    id: "bridges_wheels",
    label: "Bridges & Train Wheels",
    desc: "Hand-chamfered Y-clutch bridge and wheel train transferring power from the mainspring barrel to the centre pinion.",
    material: "CuBe2 Beryllium Bronze · German Silver",
    finish: "Côtes de Genève · Hand Anglage",
    offset: -0.8,
  },
  {
    index: 4,
    id: "escapement_balance",
    label: "Escapement & Oscillator",
    desc: "Free-sprung variable inertia balance wheel with gold micro-regulating screws, blued Breguet overcoil hairspring, and ruby pallet fork.",
    material: "Glucydur · Synthetic Ruby (Al2O3)",
    finish: "Black Polish (Spéculaire) · Heat-Blued",
    offset: -1.7,
  },
  {
    index: 5,
    id: "mainplate_case",
    label: "Mainplate & Mid-Case",
    desc: "Solid circular-grained mainplate setting the assembly datum, encased within the 39.7mm sculptural asymmetric mid-case.",
    material: "316L Surgical Steel · Rhodium Brass",
    finish: "Perlage Graining · Micro-Blasted Lugs",
    offset: -2.6,
  },
  {
    index: 6,
    id: "bracelet_clasp",
    label: "Flat-Link Bracelet",
    desc: "Articulated 5-row flat-link steel bracelet with seamless curved endlinks and micro-adjusting folding deployment clasp.",
    material: "Solid 316L Stainless Steel",
    finish: "Brushed Links · Mirror-Polished Outer Edges",
    offset: -3.6,
  },
];

export class WatchAssembly {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = "WatchAssemblyRoot";

    // Store references for animation & materials
    this.materials = {
      steelPolished: new THREE.MeshStandardMaterial({
        color: 0xd8dcde,
        roughness: 0.12,
        metalness: 0.96,
        envMapIntensity: 1.2,
      }),
      steelBrushed: new THREE.MeshStandardMaterial({
        color: 0xc4c9ce,
        roughness: 0.34,
        metalness: 0.92,
        envMapIntensity: 0.9,
      }),
      goldHardware: new THREE.MeshStandardMaterial({
        color: 0xd9be85,
        roughness: 0.22,
        metalness: 0.88,
        envMapIntensity: 1.1,
      }),
      bluedSteel: new THREE.MeshStandardMaterial({
        color: 0x1a3b70,
        roughness: 0.18,
        metalness: 0.85,
      }),
      rubyJewel: new THREE.MeshPhysicalMaterial({
        color: 0xb50e33,
        roughness: 0.1,
        transmission: 0.8,
        thickness: 0.6,
        ior: 1.77,
        transparent: true,
        opacity: 0.9,
      }),
      sapphireGlass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.04,
        transmission: 0.96,
        thickness: 1.4,
        ior: 1.77,
        transparent: true,
        opacity: 0.35,
        reflectivity: 0.9,
      }),
      dialBase: new THREE.MeshStandardMaterial({
        color: 0x111417,
        roughness: 0.45,
        metalness: 0.18,
      }),
      dialAccents: new THREE.MeshStandardMaterial({
        color: 0xf2f4f7,
        roughness: 0.15,
        metalness: 0.9,
      }),
      lume: new THREE.MeshStandardMaterial({
        color: 0xc8f0d0,
        emissive: 0x103018,
        emissiveIntensity: 0.35,
        roughness: 0.3,
      }),
    };

    // Bracelet materials must be independent from the case and movement.
    this.materials.braceletBrushed = this.materials.steelBrushed.clone();
    this.materials.braceletPolished = this.materials.steelPolished.clone();
    this.materials.handMetal = this.materials.steelPolished.clone();
    this.materials.movementBrass = this.materials.goldHardware.clone();

    // Sub-assemblies by layer
    this.layers = new Map();
    for (const l of REFERENCE_LAYERS) {
      const g = new THREE.Group();
      g.name = `Layer_${l.id}`;
      g.userData = {
        layerIndex: l.index,
        basePos: new THREE.Vector3(0, 0, 0),
        explodedOffset: l.offset,
        info: l,
      };
      this.root.add(g);
      this.layers.set(l.index, g);
    }

    // Dynamic animatable parts
    this.balanceWheelGroup = null;
    this.palletForkGroup = null;
    this.columnWheelGroup = null;
    this.secondsHand = null;
    this.minuteHand = null;
    this.hourHand = null;
    this.chronoHand = null;
    this.braceletLinks = [];

    this.buildModel();
  }

  buildModel() {
    this.buildLayer0_BezelCrystal();
    this.buildLayer1_DialHands();
    this.buildLayer2_ChronographWorks();
    this.buildLayer3_BridgesGearTrain();
    this.buildLayer4_EscapementBalance();
    this.buildLayer5_MainplateCase();
    this.buildLayer6_BraceletClasp();
  }

  // --- LAYER 0: Sapphire Crystal & Tachymeter Bezel ---
  buildLayer0_BezelCrystal() {
    const layer = this.layers.get(0);

    // Front Bezel Ring
    const bezelGeo = new THREE.CylinderGeometry(2.32, 2.38, 0.22, 64, 1, true);
    const bezel = new THREE.Mesh(bezelGeo, this.materials.steelBrushed);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.z = 0.52;
    layer.add(bezel);

    // Bezel Insert (black ceramic / anodized ring with tachymeter notches)
    const insertGeo = new THREE.RingGeometry(2.06, 2.32, 64);
    const insertMat = new THREE.MeshStandardMaterial({
      color: 0x181c20,
      roughness: 0.2,
      metalness: 0.8,
    });
    const insert = new THREE.Mesh(insertGeo, insertMat);
    insert.position.z = 0.63;
    layer.add(insert);

    // Tachymeter markers around the insert
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 2.12 : 2.18;
      const rOuter = 2.26;
      const markerGeo = new THREE.PlaneGeometry(
        isMajor ? 0.024 : 0.012,
        rOuter - rInner,
      );
      const marker = new THREE.Mesh(markerGeo, this.materials.dialAccents);
      marker.position.set(
        (Math.cos(angle) * (rInner + rOuter)) / 2,
        (Math.sin(angle) * (rInner + rOuter)) / 2,
        0.635,
      );
      marker.rotation.z = angle + Math.PI / 2;
      layer.add(marker);
    }

    // Double-domed front sapphire crystal
    const domeGeo = new THREE.CircleGeometry(2.055, 64);
    const crystal = new THREE.Mesh(domeGeo, this.materials.sapphireGlass);
    crystal.position.z = 0.65;
    crystal.material.transmission = 0;
    crystal.material.opacity = 0.055;
    crystal.material.depthWrite = false;
    layer.add(crystal);

    // Polished concentric edges give the bezel a precise machined silhouette.
    [2.055, 2.33].forEach((radius) => {
      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035, 10, 96),
        this.materials.steelPolished,
      );
      lip.position.z = 0.635;
      layer.add(lip);
    });
  }

  // --- LAYER 1: Stepped Open-Heart Dial & Diamond-Cut Hands ---
  buildLayer1_DialHands() {
    const layer = this.layers.get(1);

    // Main Dial Face with Open-Heart Cutout
    // We construct a composite dial with open-heart circular cutout at (-0.72, -0.65)
    const dialShape = new THREE.Shape();
    dialShape.absarc(0, 0, 2.05, 0, Math.PI * 2, false);

    // Open heart aperture hole
    const holePath = new THREE.Path();
    holePath.absarc(-0.72, -0.62, 0.52, 0, Math.PI * 2, true);
    dialShape.holes.push(holePath);

    const dialGeo = new THREE.ShapeGeometry(dialShape, 64);
    const dialMesh = new THREE.Mesh(dialGeo, this.materials.dialBase);
    dialMesh.position.z = 0.4;
    layer.add(dialMesh);
    this.dialMesh = dialMesh;

    // Fine printed minute track and dial typography, rendered locally as a texture.
    const dialCanvas = document.createElement("canvas");
    dialCanvas.width = dialCanvas.height = 1024;
    const context = dialCanvas.getContext("2d");
    context.translate(512, 512);
    context.strokeStyle = "#c5c7b7";
    for (let i = 0; i < 60; i++) {
      context.save();
      context.rotate((i / 60) * Math.PI * 2);
      context.lineWidth = i % 5 === 0 ? 3 : 1.5;
      context.beginPath();
      context.moveTo(0, -467);
      context.lineTo(0, i % 5 === 0 ? -450 : -458);
      context.stroke();
      context.restore();
    }
    context.fillStyle = "#d7d6c4";
    context.textAlign = "center";
    context.font = "26px Georgia";
    context.fillText("A E T H E R", 0, -337);
    context.font = "12px sans-serif";
    context.fillText("O P E N   H E A R T", 0, -310);
    context.font = "13px sans-serif";
    context.fillText("C A L .  A E – 3 2 1", 0, 322);
    context.font = "10px sans-serif";
    context.fillText("M E C H A N I C A L", 0, 345);
    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    dialTexture.colorSpace = THREE.SRGBColorSpace;
    const printing = new THREE.Mesh(
      new THREE.PlaneGeometry(4.1, 4.1),
      new THREE.MeshBasicMaterial({
        map: dialTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    printing.position.z = 0.412;
    layer.add(printing);

    // Polished rim around the open-heart cutout
    const apertureRimGeo = new THREE.RingGeometry(0.5, 0.54, 48);
    const apertureRim = new THREE.Mesh(
      apertureRimGeo,
      this.materials.steelPolished,
    );
    apertureRim.position.set(-0.72, -0.62, 0.405);
    layer.add(apertureRim);

    // 3 Sunken Subdials (30-min at x=0.95, y=0; 12-hr at x=0, y=-0.95; small seconds at x=-0.95, y=0.55)
    const subdialPositions = [
      { x: 1.02, y: 0.2, r: 0.4 },
      { x: 0, y: 0.85, r: 0.44 },
      { x: 0.72, y: -0.78, r: 0.4 },
    ];

    subdialPositions.forEach((sd) => {
      const ringGeo = new THREE.RingGeometry(sd.r - 0.04, sd.r, 36);
      const ring = new THREE.Mesh(ringGeo, this.materials.dialAccents);
      ring.position.set(sd.x, sd.y, 0.402);
      layer.add(ring);

      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(0.008, 0.045),
          this.materials.dialAccents,
        );
        mark.position.set(
          sd.x + Math.sin(angle) * (sd.r - 0.065),
          sd.y + Math.cos(angle) * (sd.r - 0.065),
          0.414,
        );
        mark.rotation.z = -angle;
        layer.add(mark);
      }

      // Subdial mini hand
      const subHandGeo = new THREE.CylinderGeometry(
        0.012,
        0.018,
        sd.r * 0.75,
        8,
      );
      const subHand = new THREE.Mesh(subHandGeo, this.materials.dialAccents);
      subHand.position.set(sd.x, sd.y + sd.r * 0.35, 0.42);
      layer.add(subHand);
    });

    // 12 Faceted Baton Indices with Super-LumiNova
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.PI / 2;
      const isDoubled = i === 0; // 12 o'clock double marker
      const rad = 1.76;

      const createBaton = (offsetAngle = 0) => {
        const a = angle + offsetAngle;
        const batonGeo = new THREE.BoxGeometry(0.06, 0.28, 0.04);
        const baton = new THREE.Mesh(batonGeo, this.materials.dialAccents);
        baton.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0.42);
        baton.rotation.z = a - Math.PI / 2;
        layer.add(baton);

        // Lume pip on inner edge
        const lumeGeo = new THREE.BoxGeometry(0.03, 0.12, 0.045);
        const lume = new THREE.Mesh(lumeGeo, this.materials.lume);
        lume.position.set(
          Math.cos(a) * (rad - 0.05),
          Math.sin(a) * (rad - 0.05),
          0.422,
        );
        lume.rotation.z = a - Math.PI / 2;
        layer.add(lume);
      };

      if (isDoubled) {
        createBaton(-0.04);
        createBaton(0.04);
      } else {
        createBaton(0);
      }
    }

    // Faceted Alpha Hands (Hour & Minute)
    const hourHandGroup = new THREE.Group();
    hourHandGroup.position.set(0, 0, 0.46);
    const hourGeo = new THREE.ConeGeometry(0.09, 1.1, 4);
    hourGeo.rotateX(Math.PI);
    const hourMesh = new THREE.Mesh(hourGeo, this.materials.handMetal);
    hourMesh.position.y = 0.55;
    hourMesh.scale.set(1, 1, 0.3);
    hourHandGroup.add(hourMesh);
    hourHandGroup.rotation.z = -Math.PI * 0.35; // ~10:10 classic aesthetic
    layer.add(hourHandGroup);
    this.hourHand = hourHandGroup;

    const minuteHandGroup = new THREE.Group();
    minuteHandGroup.position.set(0, 0, 0.48);
    const minGeo = new THREE.ConeGeometry(0.075, 1.6, 4);
    minGeo.rotateX(Math.PI);
    const minMesh = new THREE.Mesh(minGeo, this.materials.handMetal);
    minMesh.position.y = 0.8;
    minMesh.scale.set(1, 1, 0.3);
    minuteHandGroup.add(minMesh);
    minuteHandGroup.rotation.z = Math.PI * 0.35;
    layer.add(minuteHandGroup);
    this.minuteHand = minuteHandGroup;

    // Central Sweep Chronograph Hand (Needle thin with teardrop counterbalance)
    const chronoHandGroup = new THREE.Group();
    chronoHandGroup.position.set(0, 0, 0.5);
    const chronoNeedle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.016, 1.85, 8),
      this.materials.bluedSteel,
    );
    chronoNeedle.position.y = 0.72;
    chronoHandGroup.add(chronoNeedle);

    // Teardrop counterweight
    const counterGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const counterMesh = new THREE.Mesh(counterGeo, this.materials.bluedSteel);
    counterMesh.position.y = -0.32;
    chronoHandGroup.add(counterMesh);

    // Central jewel cap
    const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16);
    const cap = new THREE.Mesh(capGeo, this.materials.steelPolished);
    cap.rotation.x = Math.PI / 2;
    chronoHandGroup.add(cap);

    layer.add(chronoHandGroup);
    this.chronoHand = chronoHandGroup;
  }

  // --- LAYER 2: Chronograph Works (Column Wheel, Clutch Rocker, Operating Levers) ---
  buildLayer2_ChronographWorks() {
    const layer = this.layers.get(2);

    // Column Wheel (Iconic 7 pillars)
    const colWheelGroup = new THREE.Group();
    colWheelGroup.position.set(0.65, 0.75, 0.25);

    // Base ratchet wheel
    const colBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.08, 28),
      this.materials.steelPolished,
    );
    colBase.rotation.x = Math.PI / 2;
    colWheelGroup.add(colBase);

    // 7 Pillars
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.16, 12),
        this.materials.steelPolished,
      );
      pillar.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0.1);
      pillar.rotation.x = Math.PI / 2;
      colWheelGroup.add(pillar);
    }
    // Center fastening screw
    const colScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16),
      this.materials.bluedSteel,
    );
    colScrew.position.z = 0.18;
    colScrew.rotation.x = Math.PI / 2;
    colWheelGroup.add(colScrew);

    layer.add(colWheelGroup);
    this.columnWheelGroup = colWheelGroup;

    // Operating Lever & Hammer Levers (sculpted curved steel levers)
    const createLever = (start, end, width = 0.07) => {
      const curve = new THREE.LineCurve3(start, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 12, width / 2, 8, false);
      const lever = new THREE.Mesh(tubeGeo, this.materials.steelBrushed);
      layer.add(lever);
      return lever;
    };

    createLever(
      new THREE.Vector3(0.65, 0.75, 0.26),
      new THREE.Vector3(1.2, 0.45, 0.24),
    );
    createLever(
      new THREE.Vector3(0.65, 0.75, 0.26),
      new THREE.Vector3(0.1, 0.35, 0.25),
    );
    createLever(
      new THREE.Vector3(0.1, 0.35, 0.25),
      new THREE.Vector3(-0.4, 0.7, 0.23),
    );

    // Chronograph intermediate runner wheel
    const interWheel = new THREE.Mesh(
      gearGeometry(0.42, 0.04),
      this.materials.movementBrass,
    );
    interWheel.position.set(0.25, 0.15, 0.22);
    interWheel.rotation.x = Math.PI / 2;
    layer.add(interWheel);
  }

  // --- LAYER 3: Bridges & Gear Train (Geneva Stripes, Jewels, Pinions) ---
  buildLayer3_BridgesGearTrain() {
    const layer = this.layers.get(3);

    // Iconic Y-Clutch Bridge
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(0.2, 0.1);
    bridgeShape.lineTo(0.9, 0.6);
    bridgeShape.lineTo(1.1, 0.2);
    bridgeShape.lineTo(0.7, -0.4);
    bridgeShape.lineTo(0.1, -0.2);
    bridgeShape.closePath();

    const extrudeSettings = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    const yBridgeGeo = new THREE.ExtrudeGeometry(bridgeShape, extrudeSettings);
    const yBridge = new THREE.Mesh(yBridgeGeo, this.materials.goldHardware);
    yBridge.position.set(-0.2, 0.1, 0.05);
    layer.add(yBridge);

    // Jewel chatons on the bridge (Gold chaton + ruby core + blued screws)
    const addJewel = (x, y, z) => {
      const chaton = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16),
        this.materials.goldHardware,
      );
      chaton.position.set(x, y, z + 0.12);
      chaton.rotation.x = Math.PI / 2;
      layer.add(chaton);

      const ruby = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.06, 16),
        this.materials.rubyJewel,
      );
      ruby.position.set(x, y, z + 0.13);
      ruby.rotation.x = Math.PI / 2;
      layer.add(ruby);

      // Fastening screws
      [-0.12, 0.12].forEach((offset) => {
        const screw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12),
          this.materials.bluedSteel,
        );
        screw.position.set(x + offset, y, z + 0.13);
        screw.rotation.x = Math.PI / 2;
        layer.add(screw);
      });
    };

    addJewel(0.4, 0.35, 0.1);
    addJewel(0.7, 0.0, 0.1);

    // Mainspring Barrel Drum (stores power)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.2, 48),
      this.materials.steelBrushed,
    );
    barrel.position.set(-0.7, 0.65, 0.02);
    barrel.rotation.x = Math.PI / 2;
    layer.add(barrel);

    // Center Wheel, Third Wheel, Fourth Wheel
    const centerWheel = new THREE.Mesh(
      gearGeometry(0.55, 0.05, 36),
      this.materials.movementBrass,
    );
    centerWheel.position.set(0, 0, 0.08);
    centerWheel.rotation.x = Math.PI / 2;
    layer.add(centerWheel);

    const thirdWheel = new THREE.Mesh(
      gearGeometry(0.46, 0.04),
      this.materials.movementBrass,
    );
    thirdWheel.position.set(-0.35, -0.25, 0.06);
    thirdWheel.rotation.x = Math.PI / 2;
    layer.add(thirdWheel);

    const fourthWheel = new THREE.Mesh(
      gearGeometry(0.38, 0.04),
      this.materials.movementBrass,
    );
    fourthWheel.position.set(0.15, -0.45, 0.04);
    fourthWheel.rotation.x = Math.PI / 2;
    layer.add(fourthWheel);

    // Concentric barrel graining and blued screw heads on the exhibition side.
    for (let i = 1; i <= 7; i++) {
      const grain = new THREE.Mesh(
        new THREE.TorusGeometry(i * 0.095, 0.004, 4, 64),
        this.materials.movementBrass,
      );
      grain.position.set(-0.7, 0.65, -0.084);
      layer.add(grain);
    }
    [
      [0, 0],
      [-0.35, -0.25],
      [0.15, -0.45],
      [-0.7, 0.65],
    ].forEach(([x, y]) => {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.045, 16),
        this.materials.bluedSteel,
      );
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, -0.1);
      layer.add(screw);
    });
  }

  // --- LAYER 4: Escapement & Balance Wheel (The Mechanical Heart) ---
  buildLayer4_EscapementBalance() {
    const layer = this.layers.get(4);

    // Balance Assembly Group (oscillates in realtime)
    const balanceGroup = new THREE.Group();
    balanceGroup.position.set(-0.72, -0.62, 0.18);

    // Balance Wheel Rim
    const rimGeo = new THREE.TorusGeometry(0.48, 0.038, 16, 48);
    const rim = new THREE.Mesh(rimGeo, this.materials.goldHardware);
    balanceGroup.add(rim);

    // 4 Crossed Balance Arms
    for (let i = 0; i < 4; i++) {
      const armAngle = (i / 4) * Math.PI;
      const armGeo = new THREE.BoxGeometry(0.92, 0.042, 0.02);
      const arm = new THREE.Mesh(armGeo, this.materials.goldHardware);
      arm.rotation.z = armAngle;
      balanceGroup.add(arm);
    }

    // Regulating Screws around balance rim
    for (let i = 0; i < 8; i++) {
      const sa = (i / 8) * Math.PI * 2;
      const screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12);
      const screw = new THREE.Mesh(screwGeo, this.materials.goldHardware);
      screw.position.set(Math.cos(sa) * 0.51, Math.sin(sa) * 0.51, 0);
      screw.rotation.z = sa + Math.PI / 2;
      balanceGroup.add(screw);
    }

    // Blued Spiral Breguet Overcoil Hairspring
    const springPoints = [];
    const coils = 5.5;
    for (let t = 0; t <= 1; t += 0.01) {
      const theta = t * Math.PI * 2 * coils;
      const r = 0.06 + t * 0.28;
      springPoints.push(
        new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, t * 0.04),
      );
    }
    const springCurve = new THREE.CatmullRomCurve3(springPoints);
    const springGeo = new THREE.TubeGeometry(springCurve, 128, 0.008, 6, false);
    const hairspring = new THREE.Mesh(springGeo, this.materials.bluedSteel);
    hairspring.position.z = 0.04;
    balanceGroup.add(hairspring);

    layer.add(balanceGroup);
    this.balanceWheelGroup = balanceGroup;

    // Pallet Fork & Escape Wheel
    const palletGroup = new THREE.Group();
    palletGroup.position.set(-0.38, -0.75, 0.16);

    const palletBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.05, 0.03),
      this.materials.steelPolished,
    );
    palletGroup.add(palletBody);

    // Synthetic Ruby Pallet Stones
    [-0.1, 0.1].forEach((off) => {
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.05, 0.04),
        this.materials.rubyJewel,
      );
      stone.position.set(off, 0.04, 0);
      palletGroup.add(stone);
    });

    layer.add(palletGroup);
    this.palletForkGroup = palletGroup;

    // Escape Wheel (with angled club teeth)
    const escapeWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.03, 15),
      this.materials.steelPolished,
    );
    escapeWheel.position.set(-0.18, -0.88, 0.15);
    escapeWheel.rotation.x = Math.PI / 2;
    layer.add(escapeWheel);

    // Balance Cock (Structural bridge spanning over the balance wheel)
    const cockShape = new THREE.Shape();
    cockShape.moveTo(-1.3, -0.6);
    cockShape.lineTo(-0.72, -0.62);
    cockShape.lineTo(-0.55, -0.9);
    cockShape.lineTo(-0.95, -1.05);
    cockShape.closePath();

    const cockGeo = new THREE.ExtrudeGeometry(cockShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    const balanceCock = new THREE.Mesh(cockGeo, this.materials.goldHardware);
    balanceCock.position.z = 0.24;
    layer.add(balanceCock);

    // Incabloc shock absorber ruby bearing
    const shockAbsorber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16),
      this.materials.rubyJewel,
    );
    shockAbsorber.position.set(-0.72, -0.62, 0.38);
    shockAbsorber.rotation.x = Math.PI / 2;
    layer.add(shockAbsorber);
  }

  // --- LAYER 5: Mainplate, Mid-Case, Pushers & Exhibition Caseback ---
  buildLayer5_MainplateCase() {
    const layer = this.layers.get(5);

    // Circular Grained Mainplate (Calibre Base)
    const plateGeo = new THREE.RingGeometry(1.62, 2.05, 64);
    const mainplate = new THREE.Mesh(plateGeo, this.materials.steelBrushed);
    mainplate.material.side = THREE.DoubleSide;
    mainplate.position.z = -0.06;
    layer.add(mainplate);

    // Asymmetric 39.7mm Stainless Steel Mid-Case Body
    const caseGeo = new THREE.CylinderGeometry(2.36, 2.42, 0.65, 64, 1, true);
    const midCase = new THREE.Mesh(caseGeo, this.materials.steelBrushed);
    midCase.rotation.x = Math.PI / 2;
    midCase.position.z = 0.12;
    layer.add(midCase);

    // Sculpted Stepped Lyre Lugs (4 lugs)
    const lugPositions = [
      { x: -1.25, y: 2.05, rot: 0.15 },
      { x: 1.25, y: 2.05, rot: -0.15 },
      { x: -1.25, y: -2.05, rot: -0.15 },
      { x: 1.25, y: -2.05, rot: 0.15 },
    ];

    lugPositions.forEach((lp) => {
      const lugGeo = new RoundedBoxGeometry(0.38, 0.85, 0.55, 3, 0.07);
      const lug = new THREE.Mesh(lugGeo, this.materials.steelPolished);
      lug.position.set(lp.x, lp.y, 0.08);
      lug.rotation.z = lp.rot;
      layer.add(lug);
    });

    // Crown at 3 o'clock (x=2.5, y=0)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(2.55, 0, 0.12);
    crownGroup.rotation.z = -Math.PI / 2;

    const crownBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.32, 24),
      this.materials.steelPolished,
    );
    crownGroup.add(crownBody);

    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.29, 0.025),
        this.materials.steelBrushed,
      );
      ridge.position.set(Math.cos(angle) * 0.322, 0, Math.sin(angle) * 0.322);
      ridge.rotation.y = -angle;
      crownGroup.add(ridge);
    }

    // Crown embossed star
    const crownLogo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.34, 6),
      this.materials.goldHardware,
    );
    crownGroup.add(crownLogo);
    layer.add(crownGroup);

    // Chronograph Pushers at 2 and 4 o'clock
    [Math.PI / 6, -Math.PI / 6].forEach((angle) => {
      const pusher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.38, 20),
        this.materials.steelPolished,
      );
      pusher.position.set(Math.cos(angle) * 2.52, Math.sin(angle) * 2.52, 0.12);
      pusher.rotation.z = angle - Math.PI / 2;
      layer.add(pusher);
    });

    // Rear Exhibition Caseback Ring & Sapphire Glass
    const casebackRing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.34, 2.38, 0.15, 64, 1, true),
      this.materials.steelPolished,
    );
    casebackRing.rotation.x = Math.PI / 2;
    casebackRing.position.z = -0.22;
    layer.add(casebackRing);

    const rearSapphire = new THREE.Mesh(
      new THREE.CircleGeometry(1.88, 48),
      this.materials.sapphireGlass,
    );
    rearSapphire.material.side = THREE.DoubleSide;
    rearSapphire.position.z = -0.24;
    layer.add(rearSapphire);
  }

  // --- LAYER 6: 5-Row Articulated Flat-Link Bracelet & Clasp ---
  buildLayer6_BraceletClasp() {
    const layer = this.layers.get(6);

    // Build upper & lower bracelet segments (10 rows each side)
    const buildStrapHalf = (direction) => {
      const rows = 9;
      for (let r = 0; r < rows; r++) {
        const linkRow = new THREE.Group();
        const dist = 2.15 + r * 0.42;
        const curY = direction * dist;
        // Natural ergonomic wrist curve
        const curZ = 0.05 - Math.pow(r * 0.35, 1.8) * 0.4;
        const rotX = direction * (0.08 + r * 0.09);

        linkRow.position.set(0, curY, curZ);
        linkRow.rotation.x = rotX;

        // 3 center polished links + 2 brushed outer links
        const rowWidth = 2.2 - r * 0.06;
        const centerW = rowWidth * 0.48;
        const outerW = (rowWidth - centerW) / 2;

        // Center link
        const centerMesh = new THREE.Mesh(
          new RoundedBoxGeometry(centerW, 0.36, 0.18, 2, 0.035),
          this.materials.braceletPolished,
        );
        linkRow.add(centerMesh);

        // Left outer link
        const leftMesh = new THREE.Mesh(
          new RoundedBoxGeometry(outerW, 0.36, 0.2, 2, 0.035),
          this.materials.braceletBrushed,
        );
        leftMesh.position.x = -(centerW / 2 + outerW / 2);
        linkRow.add(leftMesh);

        // Right outer link
        const rightMesh = new THREE.Mesh(
          new RoundedBoxGeometry(outerW, 0.36, 0.2, 2, 0.035),
          this.materials.braceletBrushed,
        );
        rightMesh.position.x = centerW / 2 + outerW / 2;
        linkRow.add(rightMesh);

        layer.add(linkRow);
        this.braceletLinks.push(linkRow);
      }
    };

    buildStrapHalf(1); // Upper 12 o'clock side
    buildStrapHalf(-1); // Lower 6 o'clock side

    // Deployment Clasp Cover
    const claspMesh = new THREE.Mesh(
      new RoundedBoxGeometry(1.65, 1.1, 0.24, 3, 0.08),
      this.materials.braceletBrushed,
    );
    claspMesh.position.set(0, -5.9, -1.8);
    layer.add(claspMesh);

    // Engraved Logo Badge on Clasp
    const claspBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.04, 20),
      this.materials.goldHardware,
    );
    claspBadge.position.set(0, -5.9, -1.66);
    claspBadge.rotation.x = Math.PI / 2;
    layer.add(claspBadge);
  }

  // --- Dynamic Disassembly Offset Engine ---
  setDisassemblySpread(
    spreadProgress,
    selectedLayerIndex = null,
    holdValue = 0,
  ) {
    this.layers.forEach((layerGroup, layerIndex) => {
      const baseOffset = layerGroup.userData.explodedOffset;
      let targetZ =
        baseOffset * spreadProgress * (1 + holdValue * 0.65) +
        (layerIndex === 2 ? -0.25 : 0);

      // If a layer is clicked/inspected, expand focus
      if (selectedLayerIndex !== null) {
        if (selectedLayerIndex === layerIndex) {
          targetZ += 0.8;
          layerGroup.position.z = THREE.MathUtils.lerp(
            layerGroup.position.z,
            targetZ,
            0.15,
          );
          layerGroup.scale.setScalar(1.08);
        } else {
          // Dim / push other layers away
          targetZ += layerIndex < selectedLayerIndex ? 0.4 : -0.4;
          layerGroup.position.z = THREE.MathUtils.lerp(
            layerGroup.position.z,
            targetZ,
            0.15,
          );
          layerGroup.scale.setScalar(0.96);
        }
      } else {
        layerGroup.position.z = THREE.MathUtils.lerp(
          layerGroup.position.z,
          targetZ,
          0.15,
        );
        layerGroup.scale.setScalar(1.0);
      }
    });
  }

  // --- Realtime Mechanical Oscillation ---
  update(time, dt) {
    // 3 Hz Escapement Rhythm: 6 alternances per second = 21,600 VPH
    const oscAngle = Math.sin(time * Math.PI * 6) * 0.65;
    if (this.balanceWheelGroup) {
      this.balanceWheelGroup.rotation.z = oscAngle;
    }

    // Pallet fork micro-rocking synchronously
    if (this.palletForkGroup) {
      this.palletForkGroup.rotation.z = Math.sign(oscAngle) * 0.14;
    }

    // Smooth sweeping chrono seconds hand
    if (this.chronoHand) {
      this.chronoHand.rotation.z -= (dt * Math.PI * 2) / 60;
    }

    // Smooth sweeping main hour & minute progression
    if (this.minuteHand) {
      this.minuteHand.rotation.z -= (dt * Math.PI * 2) / 3600;
    }
  }

  // --- Material Configuration Updates ---
  applyConfiguration(config) {
    // 1. Dial Customization
    if (config.dial && this.dialMesh) {
      const dialPalette = {
        ink: { color: 0x111417, roughness: 0.45, metalness: 0.18 },
        blue: { color: 0x15273b, roughness: 0.38, metalness: 0.32 },
        silver: { color: 0xc2c6ca, roughness: 0.32, metalness: 0.45 },
        emerald: { color: 0x122b22, roughness: 0.36, metalness: 0.28 },
      };
      const p = dialPalette[config.dial] || dialPalette.ink;
      this.dialMesh.material.color.setHex(p.color);
      this.dialMesh.material.roughness = p.roughness;
      this.dialMesh.material.metalness = p.metalness;
    }

    // 2. Hardware / Bridge Customization
    if (config.hardware) {
      const hwPalette = {
        steel: { color: 0xd8dcde, roughness: 0.18, metalness: 0.95 },
        gold: { color: 0xd9be85, roughness: 0.22, metalness: 0.88 },
        rose: { color: 0xcf9c86, roughness: 0.22, metalness: 0.86 },
        graphite: { color: 0x474d53, roughness: 0.28, metalness: 0.92 },
      };
      const h = hwPalette[config.hardware] || hwPalette.steel;
      this.materials.goldHardware.color.setHex(h.color);
      this.materials.goldHardware.roughness = h.roughness;
      this.materials.goldHardware.metalness = h.metalness;
      this.materials.handMetal.color.setHex(h.color);
      this.materials.handMetal.roughness = h.roughness;
    }

    // 3. Bracelet / Strap Customization
    if (config.strap) {
      const strapPalette = {
        steel: { color: 0xc4c9ce, roughness: 0.34, metalness: 0.92 },
        dark: { color: 0x50565e, roughness: 0.32, metalness: 0.95 },
        cognac: { color: 0x97704b, roughness: 0.35, metalness: 0.85 },
      };
      const s = strapPalette[config.strap] || strapPalette.steel;
      this.materials.braceletBrushed.color.setHex(s.color);
      this.materials.braceletBrushed.roughness = s.roughness;
      this.materials.braceletBrushed.metalness = s.metalness;
      this.materials.braceletPolished.color.setHex(s.color);
      this.materials.braceletPolished.metalness = s.metalness;
    }
  }
}
