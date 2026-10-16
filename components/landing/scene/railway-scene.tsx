"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { SCENE_COLORS, DemoSceneState, SceneMode } from "./scene-tokens";

interface RailwaySceneProps {
  demoState: DemoSceneState;
  isPaused: boolean;
  onContextLost?: () => void;
}

export function RailwayScene({
  demoState,
  isPaused,
  onContextLost,
}: RailwaySceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    demoState,
    isPaused,
    scrollProgress: 0,
    pointer: { x: 0, y: 0, targetX: 0, targetY: 0 },
    isFinePointer: true,
    isIntersecting: true,
    isDocumentVisible: true,
    themeMode: "light" as SceneMode,
    recoveredTime: 0,
  });

  // Keep stateRef in sync with props
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
    const container = mountRef.current;
    if (!container) return;

    // Detect fine pointer vs touch
    const finePointerMQL = window.matchMedia("(hover: hover) and (pointer: fine)");
    stateRef.current.isFinePointer = finePointerMQL.matches;

    // Detect dark mode from html class
    const isDark = document.documentElement.classList.contains("dark");
    stateRef.current.themeMode = isDark ? "dark" : "light";

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 675;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const colors = SCENE_COLORS[stateRef.current.themeMode];
    scene.background = new THREE.Color(colors.paper);
    scene.fog = new THREE.FogExp2(colors.paper, 0.015);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 150);
    camera.position.set(2.5, 3.8, 14.5);
    camera.lookAt(4.5, 0.5, -6);

    // 3. Renderer setup
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "low-power",
      antialias: dpr === 1,
      alpha: false,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Handle WebGL context loss
    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onContextLost?.();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    // 4. Lighting (No shadow maps, high performance)
    const hemiLight = new THREE.HemisphereLight(
      colors.ambientLight,
      colors.ground,
      stateRef.current.themeMode === "dark" ? 0.8 : 1.1
    );
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(
      colors.directionalLight,
      stateRef.current.themeMode === "dark" ? 0.7 : 1.2
    );
    dirLight.position.set(12, 18, 10);
    scene.add(dirLight);

    // 5. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshBasicMaterial({
      color: colors.ground,
      depthWrite: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // 6. Track Curve Definition (Curves toward right horizon)
    const curvePoints = [
      new THREE.Vector3(2.0, 0, 18),
      new THREE.Vector3(3.2, 0, 10),
      new THREE.Vector3(4.5, 0, 2),
      new THREE.Vector3(6.2, 0, -8),
      new THREE.Vector3(8.5, 0, -22),
      new THREE.Vector3(12.0, 0, -42),
      new THREE.Vector3(16.5, 0, -70),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints);
    trackCurve.curveType = "catmullrom";
    trackCurve.tension = 0.5;

    // 7. Ballast Bed (Ribbon along track)
    const ballastGeo = new THREE.BufferGeometry();
    const ballastPoints = trackCurve.getPoints(80);
    const ballastVertices: number[] = [];
    const ballastWidth = 1.1;

    for (let i = 0; i < ballastPoints.length; i++) {
      const pt = ballastPoints[i]!;
      const t = i / (ballastPoints.length - 1);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(ballastWidth));
      const right = pt.clone().add(normal.clone().multiplyScalar(-ballastWidth));

      ballastVertices.push(left.x, 0.01, left.z);
      ballastVertices.push(right.x, 0.01, right.z);
    }

    const ballastIndices: number[] = [];
    for (let i = 0; i < ballastPoints.length - 1; i++) {
      const base = i * 2;
      ballastIndices.push(base, base + 1, base + 2);
      ballastIndices.push(base + 1, base + 3, base + 2);
    }
    ballastGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(ballastVertices, 3)
    );
    ballastGeo.setIndex(ballastIndices);
    ballastGeo.computeVertexNormals();

    const ballastMat = new THREE.MeshBasicMaterial({ color: colors.ballast });
    const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
    scene.add(ballastMesh);

    // 8. Sleepers (InstancedMesh)
    const sleeperCount = 95;
    const sleeperGeo = new THREE.BoxGeometry(1.4, 0.08, 0.22);
    const sleeperMat = new THREE.MeshLambertMaterial({ color: colors.sleepers });
    const sleeperInstanced = new THREE.InstancedMesh(
      sleeperGeo,
      sleeperMat,
      sleeperCount
    );

    const dummyMatrix = new THREE.Matrix4();
    const dummyQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < sleeperCount; i++) {
      const t = i / (sleeperCount - 1);
      const pt = trackCurve.getPoint(t);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const rotMatrix = new THREE.Matrix4().makeBasis(normal, up, tangent);
      dummyQuat.setFromRotationMatrix(rotMatrix);

      dummyMatrix.compose(
        new THREE.Vector3(pt.x, 0.05, pt.z),
        dummyQuat,
        new THREE.Vector3(1, 1, 1)
      );
      sleeperInstanced.setMatrixAt(i, dummyMatrix);
    }
    sleeperInstanced.instanceMatrix.needsUpdate = true;
    scene.add(sleeperInstanced);

    // 9. Rails (Continuous extruded tubes along curve)
    const gauge = 0.55;
    const railMat = new THREE.MeshLambertMaterial({ color: colors.rails });

    function createRail(offset: number) {
      const railCurvePts: THREE.Vector3[] = [];
      const sampleCount = 60;
      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        const pt = trackCurve.getPoint(t);
        const tangent = trackCurve.getTangent(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        railCurvePts.push(pt.clone().add(normal.clone().multiplyScalar(offset)));
      }
      const railCurve = new THREE.CatmullRomCurve3(railCurvePts);
      const tubeGeo = new THREE.TubeGeometry(railCurve, 50, 0.035, 5, false);
      const railMesh = new THREE.Mesh(tubeGeo, railMat);
      railMesh.position.y = 0.12;
      return railMesh;
    }

    const leftRail = createRail(gauge);
    const rightRail = createRail(-gauge);
    scene.add(leftRail);
    scene.add(rightRail);

    // 10. Overhead Line Poles & Wire
    const poleCount = 14;
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.8, 6);
    const armGeo = new THREE.BoxGeometry(1.3, 0.04, 0.04);
    const poleMat = new THREE.MeshLambertMaterial({ color: colors.pole });

    const poleGroup = new THREE.Group();
    const wirePoints: THREE.Vector3[] = [];

    for (let i = 0; i < poleCount; i++) {
      const t = i / (poleCount - 1);
      const pt = trackCurve.getPoint(t);
      const tangent = trackCurve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const polePos = pt.clone().add(normal.clone().multiplyScalar(1.5));
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(polePos.x, 1.4, polePos.z);

      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(-0.5, 1.25, 0);
      pole.add(arm);

      pole.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);
      poleGroup.add(pole);

      wirePoints.push(new THREE.Vector3(pt.x, 2.65, pt.z));
    }
    scene.add(poleGroup);

    const wireCurve = new THREE.CatmullRomCurve3(wirePoints);
    const wireGeo = new THREE.TubeGeometry(wireCurve, 40, 0.015, 4, false);
    const wireMat = new THREE.MeshBasicMaterial({ color: colors.wire });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // 11. Low-Poly Distant Hills
    const hillsGroup = new THREE.Group();
    const hillMat = new THREE.MeshLambertMaterial({
      color: colors.hills,
      flatShading: true,
    });
    const distantHillMat = new THREE.MeshLambertMaterial({
      color: colors.hillsDistant,
      flatShading: true,
    });

    const hill1 = new THREE.Mesh(new THREE.ConeGeometry(18, 9, 7), hillMat);
    hill1.position.set(22, 4.5, -45);
    hillsGroup.add(hill1);

    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(24, 12, 6), distantHillMat);
    hill2.position.set(10, 6, -65);
    hillsGroup.add(hill2);

    const hill3 = new THREE.Mesh(new THREE.ConeGeometry(16, 7, 6), hillMat);
    hill3.position.set(34, 3.5, -35);
    hillsGroup.add(hill3);
    scene.add(hillsGroup);

    // 12. Station Platform Canopy & Signal Light
    const stationGroup = new THREE.Group();
    const stationT = 0.28; // Position where train rests during cancelled
    const stationPt = trackCurve.getPoint(stationT);
    const stationTangent = trackCurve.getTangent(stationT).normalize();
    const stationNormal = new THREE.Vector3(
      -stationTangent.z,
      0,
      stationTangent.x
    ).normalize();

    // Canopy Roof
    const canopyRoofGeo = new THREE.BoxGeometry(2.4, 0.08, 9.0);
    const canopyRoofMat = new THREE.MeshLambertMaterial({
      color: colors.canopyRoof,
    });
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, canopyRoofMat);
    canopyRoof.position.set(0, 2.4, 0);

    // Canopy Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6);
    const pillarMat = new THREE.MeshLambertMaterial({
      color: colors.canopyPillars,
    });

    for (const zOff of [-3.5, 0, 3.5]) {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(0.8, 1.2, zOff);
      stationGroup.add(p);
    }
    stationGroup.add(canopyRoof);

    // Orient station alongside track
    const stationRot = new THREE.Matrix4().makeBasis(
      stationNormal,
      up,
      stationTangent
    );
    stationGroup.quaternion.setFromRotationMatrix(stationRot);
    const platformPos = stationPt
      .clone()
      .add(stationNormal.clone().multiplyScalar(1.6));
    stationGroup.position.set(platformPos.x, 0, platformPos.z);
    scene.add(stationGroup);

    // Signal Mast with Dual Lamps
    const signalMastGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
    const signalMastMat = new THREE.MeshLambertMaterial({
      color: colors.signalMast,
    });
    const signalMast = new THREE.Mesh(signalMastGeo, signalMastMat);
    signalMast.position.set(0.8, 1.1, -4.8);

    const signalHeadGeo = new THREE.BoxGeometry(0.18, 0.45, 0.14);
    const signalHead = new THREE.Mesh(signalHeadGeo, signalMastMat);
    signalHead.position.set(0, 0.8, 0);
    signalMast.add(signalHead);

    // Coral (Red) Lamp & Green Lamp
    const lampGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const redLampMat = new THREE.MeshBasicMaterial({
      color: colors.signalRed,
    });
    const greenLampMat = new THREE.MeshBasicMaterial({
      color: colors.signalGreen,
    });

    const redLamp = new THREE.Mesh(lampGeo, redLampMat);
    redLamp.position.set(0, 0.12, 0.07);
    signalHead.add(redLamp);

    const greenLamp = new THREE.Mesh(lampGeo, greenLampMat);
    greenLamp.position.set(0, -0.12, 0.07);
    signalHead.add(greenLamp);

    stationGroup.add(signalMast);

    // 13. Low-Poly Indian Railway Train (Locomotive + 5 Coaches)
    const trainGroup = new THREE.Group();

    // Train Materials
    const navyMat = new THREE.MeshLambertMaterial({
      color: colors.trainNavy,
      flatShading: true,
    });
    const stripeMat = new THREE.MeshLambertMaterial({
      color: colors.trainStripe,
    });
    const roofMat = new THREE.MeshLambertMaterial({
      color: colors.trainRoof,
      flatShading: true,
    });
    const windowMat = new THREE.MeshBasicMaterial({
      color: colors.trainWindows,
    });

    // Helper: Create a single coach unit
    function createCoachUnit(isLoco = false) {
      const unit = new THREE.Group();
      const length = isLoco ? 2.6 : 3.0;
      const width = 0.85;
      const height = 0.95;

      // Main body
      const bodyGeo = new THREE.BoxGeometry(width, height * 0.7, length);
      const body = new THREE.Mesh(bodyGeo, navyMat);
      body.position.y = height * 0.35 + 0.18;
      unit.add(body);

      // Stripe
      const stripeGeo = new THREE.BoxGeometry(width + 0.01, 0.08, length);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = body.position.y - 0.06;
      unit.add(stripe);

      // Curved Roof
      const roofGeo = new THREE.CylinderGeometry(
        width * 0.5,
        width * 0.5,
        length,
        8,
        1,
        false,
        0,
        Math.PI
      );
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.x = Math.PI / 2;
      roof.position.y = body.position.y + height * 0.35;
      unit.add(roof);

      // Windows strips (left & right)
      const windowLength = length - 0.4;
      const winGeo = new THREE.BoxGeometry(width + 0.02, 0.16, windowLength);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.y = body.position.y + 0.12;
      unit.add(win);

      // Locomotive specific cab nose
      if (isLoco) {
        const noseGeo = new THREE.BoxGeometry(width * 0.9, height * 0.6, 0.4);
        const nose = new THREE.Mesh(noseGeo, navyMat);
        nose.position.set(0, body.position.y - 0.05, -length * 0.5 - 0.15);
        unit.add(nose);
      }

      return unit;
    }

    const trainUnits: { group: THREE.Group; offsetT: number }[] = [];
    const coachSpacing = 0.048; // Spacing along curve

    // Locomotive (unit 0)
    const loco = createCoachUnit(true);
    trainGroup.add(loco);
    trainUnits.push({ group: loco, offsetT: 0 });

    // 5 Coaches
    for (let c = 1; c <= 5; c++) {
      const coach = createCoachUnit(false);
      trainGroup.add(coach);
      trainUnits.push({ group: coach, offsetT: c * coachSpacing });
    }

    scene.add(trainGroup);

    // 14. Pointer interaction & event listeners
    const handlePointerMove = (e: MouseEvent) => {
      if (!stateRef.current.isFinePointer) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.pointer.targetX = normX;
      stateRef.current.pointer.targetY = normY;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    // Scroll progress listener
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = container.clientHeight || 700;
      const prog = Math.min(1, Math.max(0, scrollY / heroHeight));
      stateRef.current.scrollProgress = prog;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Visibility / Intersection observer
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

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 15. Animation Loop
    let animationFrameId: number;
    let baseTrackPos = 0.15; // Starting position along track curve
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Skip render if paused, off-screen, or tab hidden
      if (
        !stateRef.current.isIntersecting ||
        !stateRef.current.isDocumentVisible
      ) {
        return;
      }

      if (stateRef.current.isPaused) {
        // When paused, render single still frame without updating animation time
        renderer.render(scene, camera);
        return;
      }

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const { demoState, scrollProgress } = stateRef.current;

      // A. Signal Aspect Logic based on Demo State
      if (demoState === "cancelled") {
        redLamp.visible = true;
        greenLamp.visible = false;
      } else if (demoState === "recovered") {
        redLamp.visible = false;
        greenLamp.visible = true;
      } else {
        redLamp.visible = false;
        greenLamp.visible = true;
      }

      // B. Train Motion Logic based on Demo State
      let targetT = baseTrackPos;

      if (demoState === "cancelled") {
        // Train halted at station canopy
        targetT = stationT;
      } else if (demoState === "recovered") {
        // Accelerate along track over ~2 seconds
        const elapsed = (currentTime - stateRef.current.recoveredTime) / 1000;
        const progress = Math.min(1, Math.max(0, elapsed / 2.2));
        // Quad ease in-out
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        targetT = stationT + eased * 0.42;
      } else {
        // Idle: gentle loop along track
        baseTrackPos += delta * 0.016;
        if (baseTrackPos > 0.65) baseTrackPos = 0.08;
        targetT = baseTrackPos + scrollProgress * 0.08;
      }

      // Position each train unit along CatmullRom curve
      for (const unit of trainUnits) {
        const uT = Math.max(0.001, Math.min(0.999, targetT + unit.offsetT));
        const pt = trackCurve.getPoint(uT);
        const tangent = trackCurve.getTangent(uT).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const orientMatrix = new THREE.Matrix4().makeBasis(normal, up, tangent);
        unit.group.quaternion.setFromRotationMatrix(orientMatrix);
        unit.group.position.set(pt.x, 0.16, pt.z);
      }

      // C. Camera Sway with smooth Lerp (bounded at ~3 degrees)
      if (stateRef.current.isFinePointer) {
        stateRef.current.pointer.x +=
          (stateRef.current.pointer.targetX - stateRef.current.pointer.x) * 0.05;
        stateRef.current.pointer.y +=
          (stateRef.current.pointer.targetY - stateRef.current.pointer.y) * 0.05;
      } else {
        stateRef.current.pointer.x = 0;
        stateRef.current.pointer.y = 0;
      }

      const swayX = stateRef.current.pointer.x * 0.35;
      const swayY = stateRef.current.pointer.y * 0.25;
      const scrollCamPull = scrollProgress * 2.2;

      camera.position.x = 2.5 + swayX;
      camera.position.y = 3.8 + swayY + scrollCamPull * 0.4;
      camera.position.z = 14.5 + scrollCamPull;
      camera.lookAt(4.5 + swayX * 0.5, 0.5, -6 - scrollCamPull * 2);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 16. Comprehensive Disposal on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);

      // Traverse & dispose geometries, materials, renderer
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
  }, [onContextLost]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    />
  );
}
