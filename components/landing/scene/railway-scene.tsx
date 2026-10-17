"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  SCENE_COLORS,
  DemoSceneState,
  SceneMode,
  QualityTier,
} from "./scene-tokens";

interface RailwaySceneProps {
  demoState: DemoSceneState;
  isPaused: boolean;
  qualityTier: QualityTier;
  onContextLost?: () => void;
  onAdaptiveDowngrade?: () => void;
}

export function RailwayScene({
  demoState,
  isPaused,
  qualityTier,
  onContextLost,
  onAdaptiveDowngrade,
}: RailwaySceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    demoState,
    isPaused,
    qualityTier,
    scrollProgress: 0,
    pointer: { x: 0, y: 0, targetX: 0, targetY: 0 },
    isFinePointer: true,
    isIntersecting: true,
    isDocumentVisible: true,
    themeMode: "light" as SceneMode,
    targetThemeMode: "light" as SceneMode,
    themeLerpProgress: 1.0,
    recoveredTime: 0,
    trainSpeed: 0.022,
    baseTrackPos: 0.12,
  });

  // Keep stateRef synced with changing props
  useEffect(() => {
    stateRef.current.demoState = demoState;
    if (demoState === "recovered") {
      stateRef.current.recoveredTime = performance.now();
    }
  }, [demoState]);

  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  useEffect(() => {
    stateRef.current.qualityTier = qualityTier;
  }, [qualityTier]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect fine pointer vs touch
    const finePointerMQL = window.matchMedia("(hover: hover) and (pointer: fine)");
    stateRef.current.isFinePointer = finePointerMQL.matches;

    // Detect dark mode from html element
    const isDark = document.documentElement.classList.contains("dark");
    stateRef.current.themeMode = isDark ? "dark" : "light";
    stateRef.current.targetThemeMode = isDark ? "dark" : "light";
    stateRef.current.themeLerpProgress = 1.0;

    const width = container.clientWidth || 1440;
    const height = container.clientHeight || 900;

    // -------------------------------------------------------------------------
    // 1. Scene, Camera & Renderer Setup
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    const initialPalette = SCENE_COLORS[stateRef.current.themeMode];

    const fogColor = new THREE.Color(initialPalette.fog);
    scene.background = fogColor;
    const sceneFog = new THREE.FogExp2(fogColor, 0.012);
    scene.fog = sceneFog;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 260);
    // Broad gauge realistic eye-level perspective: ~1.6m above rail, ~20 deg off-axis
    camera.position.set(3.4, 2.2, 17.5);
    camera.lookAt(5.8, 1.2, -8.0);

    const dpr =
      qualityTier === "high"
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : 1.0;

    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: dpr <= 1.25,
      alpha: false,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (qualityTier === "high") {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      renderer.shadowMap.enabled = false;
    }

    container.appendChild(renderer.domElement);

    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onContextLost?.();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    // -------------------------------------------------------------------------
    // 2. Procedural Canvas Textures (Generated in memory, <2MB total)
    // -------------------------------------------------------------------------
    function createSkyTexture(mode: SceneMode): THREE.CanvasTexture {
      const cv = document.createElement("canvas");
      cv.width = 512;
      cv.height = 512;
      const ctx = cv.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      const pal = SCENE_COLORS[mode];
      grad.addColorStop(0.0, pal.skyTop);
      grad.addColorStop(0.48, pal.skyMid);
      grad.addColorStop(0.85, pal.horizonGlow);
      grad.addColorStop(1.0, pal.fog);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function createBallastTexture(): THREE.CanvasTexture {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 256;
      const ctx = cv.getContext("2d")!;
      ctx.fillStyle = "#262422";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2800; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 0.8 + Math.random() * 2.2;
        const shade = Math.floor(40 + Math.random() * 65);
        ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 5})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      return tex;
    }

    function createContactShadowTexture(): THREE.CanvasTexture {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 256;
      const ctx = cv.getContext("2d")!;
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, "rgba(0,0,0,0.65)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.3)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(cv);
      return tex;
    }

    const skyTexDark = createSkyTexture("dark");
    const skyTexLight = createSkyTexture("light");
    const ballastTex = createBallastTexture();
    const contactShadowTex = createContactShadowTexture();

    // -------------------------------------------------------------------------
    // 3. Sky Dome & Horizon Dissolve
    // -------------------------------------------------------------------------
    const skyGeo = new THREE.SphereGeometry(180, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const skyMat = new THREE.MeshBasicMaterial({
      map: stateRef.current.themeMode === "dark" ? skyTexDark : skyTexLight,
      side: THREE.BackSide,
      fog: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.y = -6;
    scene.add(skyMesh);

    // -------------------------------------------------------------------------
    // 4. Lighting Rig
    // -------------------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(
      new THREE.Color(initialPalette.skyMid),
      new THREE.Color(initialPalette.ground),
      stateRef.current.themeMode === "dark" ? 0.75 : 1.15
    );
    scene.add(hemiLight);

    // Warm low sun from behind-right: creates dramatic rim lights on train roof & rails
    const sunLight = new THREE.DirectionalLight(
      new THREE.Color(initialPalette.warmLight),
      stateRef.current.themeMode === "dark" ? 1.4 : 1.85
    );
    sunLight.position.set(26, 14, -22);
    if (qualityTier === "high") {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 1.0;
      sunLight.shadow.camera.far = 70;
      sunLight.shadow.camera.left = -16;
      sunLight.shadow.camera.right = 16;
      sunLight.shadow.camera.top = 16;
      sunLight.shadow.camera.bottom = -16;
      sunLight.shadow.bias = -0.0006;
      sunLight.shadow.radius = 2.4;
    }
    scene.add(sunLight);

    // Soft cool fill light from front-left
    const fillLight = new THREE.DirectionalLight(
      new THREE.Color(initialPalette.fillLight),
      stateRef.current.themeMode === "dark" ? 0.45 : 0.65
    );
    fillLight.position.set(-18, 10, 20);
    scene.add(fillLight);

    // -------------------------------------------------------------------------
    // 5. Ground Plane with Soft Undulation
    // -------------------------------------------------------------------------
    const groundGeo = new THREE.PlaneGeometry(180, 180, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Keep track corridor flat while gently undulating distant landscape
      const distToTrack = Math.abs(vx - (vz * -0.22 + 4.0));
      if (distToTrack > 4.5) {
        const h = Math.sin(vx * 0.08) * Math.cos(vz * 0.07) * 0.7;
        posAttr.setY(i, h - 0.1);
      } else {
        posAttr.setY(i, -0.05);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.ground),
      roughness: 0.92,
      metalness: 0.04,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = qualityTier === "high";
    scene.add(groundMesh);

    // -------------------------------------------------------------------------
    // 6. Ridgeline Hills (Noise profile ribbons, layered & fogged, no pyramids)
    // -------------------------------------------------------------------------
    const hillsGroup = new THREE.Group();

    function createRidgelineRibbon(
      zDist: number,
      baseHeight: number,
      maxRidge: number,
      colorHex: string,
      segments = 64
    ) {
      const geo = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const indices: number[] = [];
      const widthSpan = 220;

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const x = (u - 0.5) * widthSpan;
        // Layered sine frequencies for natural undulating ridgeline
        const noise =
          Math.sin(u * 7.5 + zDist * 0.1) * 0.5 +
          Math.sin(u * 14.2) * 0.28 +
          Math.cos(u * 3.8) * 0.35;
        const topY = baseHeight + noise * maxRidge;
        const botY = -4.0;

        vertices.push(x, topY, zDist);
        vertices.push(x, botY, zDist);

        if (i < segments) {
          const idx = i * 2;
          indices.push(idx, idx + 1, idx + 2);
          indices.push(idx + 1, idx + 3, idx + 2);
        }
      }

      geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
      });
      return new THREE.Mesh(geo, mat);
    }

    const farHills = createRidgelineRibbon(-85, 14, 8, initialPalette.farHills);
    const midHills = createRidgelineRibbon(-60, 9, 6.5, initialPalette.midHills);
    const nearHills = createRidgelineRibbon(-40, 5, 4.5, initialPalette.nearHills);

    hillsGroup.add(farHills);
    hillsGroup.add(midHills);
    hillsGroup.add(nearHills);
    scene.add(hillsGroup);

    // -------------------------------------------------------------------------
    // 7. Track Curve, Broad Gauge Rails & Instanced Sleepers
    // -------------------------------------------------------------------------
    // Curved gently along diagonal (from lower-left toward right horizon)
    const curvePoints = [
      new THREE.Vector3(-1.8, 0, 22),
      new THREE.Vector3(0.6, 0, 13),
      new THREE.Vector3(3.2, 0, 4),
      new THREE.Vector3(6.5, 0, -8),
      new THREE.Vector3(10.8, 0, -24),
      new THREE.Vector3(16.5, 0, -46),
      new THREE.Vector3(24.0, 0, -78),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints);
    trackCurve.curveType = "catmullrom";
    trackCurve.tension = 0.5;

    // Ballast shoulder ribbon
    const ballastGeo = new THREE.BufferGeometry();
    const ballastPts = trackCurve.getPoints(90);
    const ballastVerts: number[] = [];
    const bWidth = 1.35;

    for (let i = 0; i < ballastPts.length; i++) {
      const pt = ballastPts[i]!;
      const t = i / (ballastPts.length - 1);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(bWidth));
      const right = pt.clone().add(normal.clone().multiplyScalar(-bWidth));

      ballastVerts.push(left.x, 0.02, left.z);
      ballastVerts.push(right.x, 0.02, right.z);
    }

    const ballastIdx: number[] = [];
    for (let i = 0; i < ballastPts.length - 1; i++) {
      const base = i * 2;
      ballastIdx.push(base, base + 1, base + 2);
      ballastIdx.push(base + 1, base + 3, base + 2);
    }
    ballastGeo.setAttribute("position", new THREE.Float32BufferAttribute(ballastVerts, 3));
    ballastGeo.setIndex(ballastIdx);
    ballastGeo.computeVertexNormals();

    const ballastMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.ballast),
      map: ballastTex,
      roughness: 0.9,
    });
    const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
    ballastMesh.receiveShadow = qualityTier === "high";
    scene.add(ballastMesh);

    // Sleepers (0.65m spacing, instanced with slight color variation)
    const sleeperCount = 110;
    const sleeperGeo = new THREE.BoxGeometry(1.55, 0.09, 0.24);
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.sleepers),
      roughness: 0.85,
      metalness: 0.08,
    });
    const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
    sleeperInstanced.receiveShadow = qualityTier === "high";
    sleeperInstanced.castShadow = qualityTier === "high";

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat = new THREE.Quaternion();
    const upVec = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < sleeperCount; i++) {
      const t = i / (sleeperCount - 1);
      const pt = trackCurve.getPoint(t);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const rotMatrix = new THREE.Matrix4().makeBasis(normal, upVec, tangent);
      dummyQuat.setFromRotationMatrix(rotMatrix);

      dummyMatrix.compose(
        new THREE.Vector3(pt.x, 0.05, pt.z),
        dummyQuat,
        new THREE.Vector3(1, 1, 1)
      );
      sleeperInstanced.setMatrixAt(i, dummyMatrix);

      // Subtle concrete tone variation
      const shade = 0.94 + (Math.sin(i * 1.7) * 0.06);
      sleeperInstanced.setColorAt(
        i,
        new THREE.Color(initialPalette.sleepers).multiplyScalar(shade)
      );
    }
    sleeperInstanced.instanceMatrix.needsUpdate = true;
    if (sleeperInstanced.instanceColor) sleeperInstanced.instanceColor.needsUpdate = true;
    scene.add(sleeperInstanced);

    // Broad gauge steel rails (1.676m gauge -> 0.62 offset each side)
    const gaugeHalf = 0.62;
    const railMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.rails),
      metalness: 0.92,
      roughness: 0.32,
    });

    function createCurvedRail(offset: number) {
      const pts: THREE.Vector3[] = [];
      const samples = 75;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = trackCurve.getPoint(t);
        const tangent = trackCurve.getTangent(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        pts.push(pt.clone().add(normal.clone().multiplyScalar(offset)));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 60, 0.042, 6, false);
      const mesh = new THREE.Mesh(tube, railMat);
      mesh.position.y = 0.13;
      mesh.castShadow = qualityTier === "high";
      mesh.receiveShadow = qualityTier === "high";
      return mesh;
    }

    const leftRail = createCurvedRail(gaugeHalf);
    const rightRail = createCurvedRail(-gaugeHalf);
    scene.add(leftRail);
    scene.add(rightRail);

    // -------------------------------------------------------------------------
    // 8. Overhead Traction Line (OHE Catenary Masts & Dual Wire)
    // -------------------------------------------------------------------------
    const poleCount = 12;
    const poleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.pole),
      roughness: 0.7,
      metalness: 0.3,
    });
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialPalette.wire),
    });

    const mastGeo = new THREE.CylinderGeometry(0.045, 0.06, 3.4, 6);
    const mastArmGeo = new THREE.BoxGeometry(1.4, 0.04, 0.04);
    const polesGroup = new THREE.Group();
    const contactWirePts: THREE.Vector3[] = [];
    const catenaryWirePts: THREE.Vector3[] = [];

    for (let i = 0; i < poleCount; i++) {
      const t = i / (poleCount - 1);
      const pt = trackCurve.getPoint(t);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const polePos = pt.clone().add(normal.clone().multiplyScalar(1.65));
      const pole = new THREE.Mesh(mastGeo, poleMat);
      pole.position.set(polePos.x, 1.7, polePos.z);
      pole.castShadow = qualityTier === "high";

      const arm = new THREE.Mesh(mastArmGeo, poleMat);
      arm.position.set(-0.55, 1.45, 0);
      pole.add(arm);

      pole.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);
      polesGroup.add(pole);

      contactWirePts.push(new THREE.Vector3(pt.x, 2.85, pt.z));
      catenaryWirePts.push(new THREE.Vector3(pt.x, 3.15, pt.z));
    }
    scene.add(polesGroup);

    const contactWireCurve = new THREE.CatmullRomCurve3(contactWirePts);
    const contactWireGeo = new THREE.TubeGeometry(contactWireCurve, 50, 0.012, 4, false);
    const contactWire = new THREE.Mesh(contactWireGeo, wireMat);
    scene.add(contactWire);

    const catenaryCurve = new THREE.CatmullRomCurve3(catenaryWirePts);
    const catenaryGeo = new THREE.TubeGeometry(catenaryCurve, 50, 0.01, 4, false);
    const catenaryWire = new THREE.Mesh(catenaryGeo, wireMat);
    scene.add(catenaryWire);

    // -------------------------------------------------------------------------
    // 9. Station Platform, Canopy & Dual Aspect Signal
    // -------------------------------------------------------------------------
    const stationGroup = new THREE.Group();
    const stationT = 0.28; // Stopping coordinate during cancelled demo state
    const stationPt = trackCurve.getPoint(stationT);
    const stationTangent = trackCurve.getTangent(stationT).normalize();
    const stationNormal = new THREE.Vector3(
      -stationTangent.z,
      0,
      stationTangent.x
    ).normalize();

    // Raised concrete platform edge
    const platGeo = new THREE.BoxGeometry(2.6, 0.28, 16.0);
    const platMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.platform),
      roughness: 0.88,
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, 0.14, 0);
    platform.receiveShadow = qualityTier === "high";
    stationGroup.add(platform);

    // Modern curved station canopy
    const canopyRoofGeo = new THREE.BoxGeometry(3.0, 0.08, 12.0);
    const canopyRoofMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.canopyRoof),
      roughness: 0.65,
      metalness: 0.25,
    });
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, canopyRoofMat);
    canopyRoof.position.set(-0.2, 2.7, 0);
    canopyRoof.castShadow = qualityTier === "high";
    stationGroup.add(canopyRoof);

    // Tubular pillars supporting canopy
    const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.canopyPillars),
      metalness: 0.5,
      roughness: 0.5,
    });
    for (const zOff of [-4.5, -1.5, 1.5, 4.5]) {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(0.6, 1.35, zOff);
      p.castShadow = qualityTier === "high";
      stationGroup.add(p);
    }

    // Platform benches
    const benchGeo = new THREE.BoxGeometry(0.5, 0.35, 1.4);
    const benchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.amberTrim),
      roughness: 0.7,
    });
    for (const zOff of [-3.0, 3.0]) {
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(0.6, 0.35, zOff);
      stationGroup.add(bench);
    }

    // Dual-aspect railway signal post
    const signalMastGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.4, 6);
    const signalMast = new THREE.Mesh(signalMastGeo, pillarMat);
    signalMast.position.set(0.8, 1.2, -7.5);

    const signalHeadGeo = new THREE.BoxGeometry(0.2, 0.52, 0.16);
    const signalHead = new THREE.Mesh(signalHeadGeo, pillarMat);
    signalHead.position.set(0, 0.95, 0);
    signalMast.add(signalHead);

    const lampGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const redLampMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialPalette.signalRed),
    });
    const greenLampMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialPalette.signalGreen),
    });

    const redLamp = new THREE.Mesh(lampGeo, redLampMat);
    redLamp.position.set(0, 0.14, 0.09);
    signalHead.add(redLamp);

    const greenLamp = new THREE.Mesh(lampGeo, greenLampMat);
    greenLamp.position.set(0, -0.14, 0.09);
    signalHead.add(greenLamp);

    stationGroup.add(signalMast);

    // Orient station alongside track
    const stationRot = new THREE.Matrix4().makeBasis(stationNormal, upVec, stationTangent);
    stationGroup.quaternion.setFromRotationMatrix(stationRot);
    const platformPos = stationPt.clone().add(stationNormal.clone().multiplyScalar(1.95));
    stationGroup.position.set(platformPos.x, 0, platformPos.z);
    scene.add(stationGroup);

    // -------------------------------------------------------------------------
    // 10. The Train: WAP-7 Locomotive + 7 Coaches (Spans >=40% hero width)
    // -------------------------------------------------------------------------
    const trainGroup = new THREE.Group();

    // Material definitions for train
    const trainNavyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.trainNavy),
      roughness: 0.45,
      metalness: 0.3,
    });
    const trainStripeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.creamStripe),
      roughness: 0.5,
    });
    const trainAmberMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.amberTrim),
      roughness: 0.5,
    });
    const trainRoofMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.trainRoof),
      roughness: 0.6,
      metalness: 0.35,
    });
    const trainWindowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.windows),
      emissive: new THREE.Color(initialPalette.windowEmissive),
      emissiveIntensity: initialPalette.windowEmissiveIntensity,
      roughness: 0.15,
      metalness: 0.8,
    });
    const headlightMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialPalette.headlight),
    });
    const bogieMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1a1c20),
      roughness: 0.8,
      metalness: 0.6,
    });

    // Helper: Build a realistic coach or electric locomotive
    function createTrainUnit(isLoco: boolean) {
      const unit = new THREE.Group();
      const length = isLoco ? 2.8 : 3.1;
      const width = 0.92;
      const height = 1.05;

      // Main coach / loco body
      const bodyGeo = new THREE.BoxGeometry(width, height * 0.72, length);
      const body = new THREE.Mesh(bodyGeo, trainNavyMat);
      body.position.y = height * 0.36 + 0.22;
      body.castShadow = qualityTier === "high";
      unit.add(body);

      // Cream waist stripe
      const stripeGeo = new THREE.BoxGeometry(width + 0.015, 0.1, length);
      const stripe = new THREE.Mesh(stripeGeo, trainStripeMat);
      stripe.position.y = body.position.y - 0.05;
      unit.add(stripe);

      // Amber accent pinstripe
      const amberGeo = new THREE.BoxGeometry(width + 0.018, 0.024, length);
      const amberStripe = new THREE.Mesh(amberGeo, trainAmberMat);
      amberStripe.position.y = stripe.position.y - 0.065;
      unit.add(amberStripe);

      // Rounded aerodynamic roof
      const roofGeo = new THREE.CylinderGeometry(
        width * 0.5,
        width * 0.5,
        length,
        12,
        1,
        false,
        0,
        Math.PI
      );
      roofGeo.rotateZ(Math.PI / 2);
      roofGeo.rotateX(Math.PI / 2);
      const roof = new THREE.Mesh(roofGeo, trainRoofMat);
      roof.position.y = body.position.y + height * 0.36;
      roof.castShadow = qualityTier === "high";
      unit.add(roof);

      // Roof AC pods
      const acGeo = new THREE.BoxGeometry(width * 0.7, 0.12, 0.85);
      const ac1 = new THREE.Mesh(acGeo, trainRoofMat);
      ac1.position.set(0, roof.position.y + 0.12, -0.6);
      unit.add(ac1);
      const ac2 = new THREE.Mesh(acGeo, trainRoofMat);
      ac2.position.set(0, roof.position.y + 0.12, 0.6);
      unit.add(ac2);

      // Windows band
      const winGeo = new THREE.BoxGeometry(width + 0.022, 0.18, length - 0.45);
      const win = new THREE.Mesh(winGeo, trainWindowMat);
      win.position.y = body.position.y + 0.11;
      unit.add(win);

      // Bogies with wheels (front and back)
      for (const zBog of [-length * 0.32, length * 0.32]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.14, 0.65), bogieMat);
        b.position.set(0, 0.16, zBog);
        unit.add(b);

        // Wheels (instanced cylinders on left & right)
        for (const wSide of [-gaugeHalf, gaugeHalf]) {
          for (const wZ of [-0.2, 0.2]) {
            const wheel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10),
              bogieMat
            );
            wheel.rotateZ(Math.PI / 2);
            wheel.position.set(wSide, 0.12, zBog + wZ);
            unit.add(wheel);
          }
        }
      }

      // Locomotive specific: Sloped aerodynamic cab nose, twin headlights, pantograph
      if (isLoco) {
        // Aerodynamic cab front
        const noseGeo = new THREE.BoxGeometry(width * 0.94, height * 0.68, 0.55);
        const nose = new THREE.Mesh(noseGeo, trainNavyMat);
        nose.position.set(0, body.position.y - 0.02, -length * 0.5 - 0.22);
        nose.castShadow = qualityTier === "high";
        unit.add(nose);

        // Sloped windscreen
        const screenGeo = new THREE.BoxGeometry(width * 0.84, 0.22, 0.06);
        const screen = new THREE.Mesh(screenGeo, trainWindowMat);
        screen.position.set(0, body.position.y + 0.18, -length * 0.5 - 0.42);
        unit.add(screen);

        // Twin central headlights
        const lightGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const headlight = new THREE.Mesh(lightGeo, headlightMat);
        headlight.position.set(0, body.position.y - 0.04, -length * 0.5 - 0.5);
        unit.add(headlight);

        // Roof pantograph reaching up to touch catenary contact wire
        const pantoGroup = new THREE.Group();
        const pantoBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6);
        const pantoArm1 = new THREE.Mesh(pantoBarGeo, bogieMat);
        pantoArm1.rotateX(Math.PI / 3);
        pantoArm1.position.set(0, 0.22, -0.12);
        pantoGroup.add(pantoArm1);

        const pantoArm2 = new THREE.Mesh(pantoBarGeo, bogieMat);
        pantoArm2.rotateX(-Math.PI / 3);
        pantoArm2.position.set(0, 0.22, 0.12);
        pantoGroup.add(pantoArm2);

        // Contact head touching wire
        const headGeo = new THREE.BoxGeometry(0.8, 0.03, 0.12);
        const pHead = new THREE.Mesh(headGeo, bogieMat);
        pHead.position.set(0, 0.45, 0);
        pantoGroup.add(pHead);

        pantoGroup.position.set(0, roof.position.y + 0.12, 0.4);
        unit.add(pantoGroup);
      } else {
        // Rubber vestibule gangway
        const gangwayGeo = new THREE.BoxGeometry(width * 0.72, height * 0.65, 0.18);
        const gangway = new THREE.Mesh(gangwayGeo, bogieMat);
        gangway.position.set(0, body.position.y, -length * 0.5 - 0.08);
        unit.add(gangway);
      }

      return unit;
    }

    const trainUnits: { group: THREE.Group; offsetT: number }[] = [];
    const coachCurveSpacing = 0.042; // Spacing along curve

    // Unit 0: Electric Locomotive
    const loco = createTrainUnit(true);
    trainGroup.add(loco);
    trainUnits.push({ group: loco, offsetT: 0 });

    // Units 1 to 7: 7 Passenger Coaches
    for (let c = 1; c <= 7; c++) {
      const coach = createTrainUnit(false);
      trainGroup.add(coach);
      trainUnits.push({ group: coach, offsetT: c * coachCurveSpacing });
    }

    scene.add(trainGroup);

    // Medium Tier: Soft contact shadow blob under train
    let contactBlob: THREE.Mesh | null = null;
    if (qualityTier === "medium") {
      const blobGeo = new THREE.PlaneGeometry(1.6, 26);
      blobGeo.rotateX(-Math.PI / 2);
      const blobMat = new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      contactBlob = new THREE.Mesh(blobGeo, blobMat);
      contactBlob.position.y = 0.02;
      scene.add(contactBlob);
    }

    // -------------------------------------------------------------------------
    // 11. Scenery: Palm Trees, Roadside Shrubs & Atmospheric Dust
    // -------------------------------------------------------------------------
    const sceneryGroup = new THREE.Group();

    // Indian feather palms
    const palmCount = qualityTier === "high" ? 18 : 8;
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 2.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x3e3228),
      roughness: 0.9,
    });
    const frondGeo = new THREE.ConeGeometry(1.1, 0.4, 6);
    const frondMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialPalette.foliage),
      roughness: 0.8,
    });

    for (let i = 0; i < palmCount; i++) {
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.4;
      palm.add(trunk);

      for (let j = 0; j < 5; j++) {
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.rotateZ(0.6 + Math.random() * 0.3);
        frond.rotateY((j / 5) * Math.PI * 2);
        frond.position.set(0, 2.7, 0);
        palm.add(frond);
      }

      // Distribute along right landscape & distant backdrop
      const side = Math.random() > 0.4 ? 1 : -1;
      const px = 10 + Math.random() * 18 * side;
      const pz = -10 - Math.random() * 45;
      palm.position.set(px, 0, pz);
      const sc = 0.75 + Math.random() * 0.5;
      palm.scale.set(sc, sc, sc);
      palm.rotation.y = Math.random() * Math.PI;
      sceneryGroup.add(palm);
    }
    scene.add(sceneryGroup);

    // Atmospheric dust motes (High tier only, ~120 particles in sunbeam)
    let dustParticles: THREE.Points | null = null;
    let dustPositions: Float32Array | null = null;
    if (qualityTier === "high") {
      const dustCount = 120;
      dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.2) * 20;
        dustPositions[i * 3 + 1] = 0.5 + Math.random() * 5.5;
        dustPositions[i * 3 + 2] = -15 + Math.random() * 32;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dustMat = new THREE.PointsMaterial({
        color: new THREE.Color(initialPalette.dust),
        size: 0.08,
        transparent: true,
        opacity: 0.55,
      });
      dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);
    }

    // -------------------------------------------------------------------------
    // 12. Dynamic Framing: Reserved Free Band Calculation (Section 5)
    // -------------------------------------------------------------------------
    function computeCameraFraming() {
      if (!container) return;
      const w = container.clientWidth || 1440;
      const h = container.clientHeight || 900;
      camera.aspect = w / h;

      // Find lowest point of hero interactive content
      let lowestY = 560; // Safe desktop default
      const heroContainer = container.closest("section");
      if (heroContainer) {
        const heroRect = heroContainer.getBoundingClientRect();
        const contentGrid = heroContainer.querySelector(".relative.z-10");
        if (contentGrid) {
          const gridRect = contentGrid.getBoundingClientRect();
          lowestY = gridRect.bottom - heroRect.top;
        }
      }

      // Ensure at least 24% of hero height remains free below all content
      const freeBandHeight = Math.max(h * 0.24, h - lowestY);
      const freeBandCenterY = lowestY + freeBandHeight * 0.5;

      // Vertical offset: Shift optical axis so track and train center inside free band
      // Center of container is h * 0.5
      const pixelOffset = freeBandCenterY - h * 0.5;
      camera.setViewOffset(w, h, 0, Math.round(pixelOffset * 0.38), w, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    computeCameraFraming();

    // -------------------------------------------------------------------------
    // 13. Event Listeners & Observers
    // -------------------------------------------------------------------------
    const handlePointerMove = (e: MouseEvent) => {
      if (!stateRef.current.isFinePointer) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.pointer.targetX = normX;
      stateRef.current.pointer.targetY = normY;
    };
    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroH = container.clientHeight || 900;
      stateRef.current.scrollProgress = Math.min(1, Math.max(0, scrollY / heroH));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        stateRef.current.isIntersecting = entry ? entry.isIntersecting : true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibility = () => {
      stateRef.current.isDocumentVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        computeCameraFraming();
      }, 100);
    };
    window.addEventListener("resize", handleResize);

    // Watch for document dark mode changes (MutationObserver)
    const themeObserver = new MutationObserver(() => {
      const darkActive = document.documentElement.classList.contains("dark");
      const newMode: SceneMode = darkActive ? "dark" : "light";
      if (newMode !== stateRef.current.targetThemeMode) {
        stateRef.current.targetThemeMode = newMode;
        stateRef.current.themeLerpProgress = 0.0;
        // Swap sky texture smoothly
        skyMat.map = newMode === "dark" ? skyTexDark : skyTexLight;
        skyMat.needsUpdate = true;
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // -------------------------------------------------------------------------
    // 14. Performance Monitoring & Adaptive Downgrade (Section 9)
    // -------------------------------------------------------------------------
    let frameCount = 0;
    const warmUpFrames = 60;
    const monitorFrames = 180;
    let accumulatedTime = 0;
    let monitoredCount = 0;

    // -------------------------------------------------------------------------
    // 15. Animation Render Loop
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Skip render if off-screen or tab hidden
      if (!stateRef.current.isIntersecting || !stateRef.current.isDocumentVisible) {
        return;
      }

      // If user paused, render a single still frame
      if (stateRef.current.isPaused) {
        renderer.render(scene, camera);
        return;
      }

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      const frameDeltaMs = currentTime - lastTime;
      lastTime = currentTime;

      // Adaptive performance tracking
      frameCount++;
      if (frameCount > warmUpFrames && monitoredCount < monitorFrames) {
        accumulatedTime += frameDeltaMs;
        monitoredCount++;
        if (monitoredCount === monitorFrames) {
          const avgFrameTime = accumulatedTime / monitorFrames;
          if (avgFrameTime > 24.0) {
            onAdaptiveDowngrade?.();
          }
        }
      }

      // Smooth 400ms Theme Lerp
      if (stateRef.current.themeLerpProgress < 1.0) {
        stateRef.current.themeLerpProgress = Math.min(
          1.0,
          stateRef.current.themeLerpProgress + delta * 2.5
        );
        const t = stateRef.current.themeLerpProgress;
        const fromPal =
          stateRef.current.targetThemeMode === "dark"
            ? SCENE_COLORS.light
            : SCENE_COLORS.dark;
        const toPal = SCENE_COLORS[stateRef.current.targetThemeMode];

        // Lerp Fog & Background
        fogColor.lerpColors(new THREE.Color(fromPal.fog), new THREE.Color(toPal.fog), t);
        sceneFog.color = fogColor;
        scene.background = fogColor;

        // Lerp Lights
        sunLight.color.lerpColors(
          new THREE.Color(fromPal.warmLight),
          new THREE.Color(toPal.warmLight),
          t
        );
        fillLight.color.lerpColors(
          new THREE.Color(fromPal.fillLight),
          new THREE.Color(toPal.fillLight),
          t
        );
        hemiLight.color.lerpColors(
          new THREE.Color(fromPal.skyMid),
          new THREE.Color(toPal.skyMid),
          t
        );
        hemiLight.groundColor.lerpColors(
          new THREE.Color(fromPal.ground),
          new THREE.Color(toPal.ground),
          t
        );

        // Lerp Hills
        (farHills.material as THREE.MeshBasicMaterial).color.lerpColors(
          new THREE.Color(fromPal.farHills),
          new THREE.Color(toPal.farHills),
          t
        );
        (midHills.material as THREE.MeshBasicMaterial).color.lerpColors(
          new THREE.Color(fromPal.midHills),
          new THREE.Color(toPal.midHills),
          t
        );
        (nearHills.material as THREE.MeshBasicMaterial).color.lerpColors(
          new THREE.Color(fromPal.nearHills),
          new THREE.Color(toPal.nearHills),
          t
        );

        // Lerp Ground & Materials
        groundMat.color.lerpColors(
          new THREE.Color(fromPal.ground),
          new THREE.Color(toPal.ground),
          t
        );
        ballastMat.color.lerpColors(
          new THREE.Color(fromPal.ballast),
          new THREE.Color(toPal.ballast),
          t
        );
        sleeperMat.color.lerpColors(
          new THREE.Color(fromPal.sleepers),
          new THREE.Color(toPal.sleepers),
          t
        );
        railMat.color.lerpColors(
          new THREE.Color(fromPal.rails),
          new THREE.Color(toPal.rails),
          t
        );

        // Lerp Train Windows & Emissive
        trainWindowMat.color.lerpColors(
          new THREE.Color(fromPal.windows),
          new THREE.Color(toPal.windows),
          t
        );
        trainWindowMat.emissive.lerpColors(
          new THREE.Color(fromPal.windowEmissive),
          new THREE.Color(toPal.windowEmissive),
          t
        );
        trainWindowMat.emissiveIntensity = THREE.MathUtils.lerp(
          fromPal.windowEmissiveIntensity,
          toPal.windowEmissiveIntensity,
          t
        );

        if (t >= 1.0) {
          stateRef.current.themeMode = stateRef.current.targetThemeMode;
        }
      }

      const { demoState, scrollProgress } = stateRef.current;

      // A. Signal Aspect Logic based on Demo State
      if (demoState === "cancelled") {
        redLamp.visible = true;
        greenLamp.visible = false;
      } else {
        redLamp.visible = false;
        greenLamp.visible = true;
      }

      // B. Train Motion Logic based on Demo State
      let targetT = stateRef.current.baseTrackPos;

      if (demoState === "cancelled") {
        // Smoothly brake to a stop right at the platform
        targetT = stationT;
      } else if (demoState === "recovered") {
        // Accelerate smoothly out along track over ~2.2s (eased quad)
        const elapsed = (currentTime - stateRef.current.recoveredTime) / 1000;
        const progress = Math.min(1, Math.max(0, elapsed / 2.2));
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        targetT = stationT + eased * 0.45;
      } else {
        // Idle: Slow gentle cruise along curve
        stateRef.current.baseTrackPos += delta * 0.015;
        if (stateRef.current.baseTrackPos > 0.62) stateRef.current.baseTrackPos = 0.06;
        targetT = stateRef.current.baseTrackPos + scrollProgress * 0.08;
      }

      // Update position and tangent banking for Locomotive + 7 Coaches
      for (const unit of trainUnits) {
        const uT = Math.max(0.001, Math.min(0.999, targetT + unit.offsetT));
        const pt = trackCurve.getPoint(uT);
        const tangent = trackCurve.getTangent(uT).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const orientMatrix = new THREE.Matrix4().makeBasis(normal, upVec, tangent);
        unit.group.quaternion.setFromRotationMatrix(orientMatrix);

        // Gentle realistic railway body sway (~0.08 deg)
        const sway = Math.sin(currentTime * 0.005 + unit.offsetT * 10) * 0.002;
        unit.group.rotateZ(sway);

        unit.group.position.set(pt.x, 0.16, pt.z);
      }

      // Sync medium tier contact shadow under train
      if (contactBlob) {
        const leadT = Math.max(0.001, Math.min(0.999, targetT + 0.14));
        const leadPt = trackCurve.getPoint(leadT);
        contactBlob.position.set(leadPt.x, 0.03, leadPt.z);
      }

      // Animate floating dust motes (High tier)
      if (dustParticles && dustPositions) {
        const attr = dustParticles.geometry.attributes.position as THREE.BufferAttribute;
        const count = dustPositions.length / 3;
        for (let i = 0; i < count; i++) {
          let y = attr.getY(i) - delta * 0.12;
          if (y < 0.5) y = 5.5;
          attr.setY(i, y);
        }
        attr.needsUpdate = true;
      }

      // C. Camera Sway & Pointer Parallax (Capped at ~3 degrees, smoothed)
      if (stateRef.current.isFinePointer) {
        stateRef.current.pointer.x +=
          (stateRef.current.pointer.targetX - stateRef.current.pointer.x) * 0.04;
        stateRef.current.pointer.y +=
          (stateRef.current.pointer.targetY - stateRef.current.pointer.y) * 0.04;
      } else {
        stateRef.current.pointer.x = 0;
        stateRef.current.pointer.y = 0;
      }

      const swayX = stateRef.current.pointer.x * 0.42;
      const swayY = stateRef.current.pointer.y * 0.28;
      const scrollCamPull = scrollProgress * 2.4;

      camera.position.x = 3.4 + swayX;
      camera.position.y = 2.2 + swayY + scrollCamPull * 0.35;
      camera.position.z = 17.5 + scrollCamPull;
      camera.lookAt(5.8 + swayX * 0.4, 1.2, -8.0 - scrollCamPull * 1.8);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // -------------------------------------------------------------------------
    // 16. Comprehensive Disposal on Unmount
    // -------------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);

      // Dispose textures
      skyTexDark.dispose();
      skyTexLight.dispose();
      ballastTex.dispose();
      contactShadowTex.dispose();

      // Dispose scene geometries & materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [onContextLost, onAdaptiveDowngrade, qualityTier]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    />
  );
}
