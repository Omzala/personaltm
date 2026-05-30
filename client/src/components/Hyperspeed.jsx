import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DEFAULT_EFFECT_OPTIONS = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [12, 80],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3
  }
};

function randomRange(value) {
  if (Array.isArray(value)) {
    return Math.random() * (value[1] - value[0]) + value[0];
  }

  return Math.random() * value;
}

function pickRandom(value) {
  return Array.isArray(value) ? value[Math.floor(Math.random() * value.length)] : value;
}

function disposeObject(object) {
  if (object.geometry) object.geometry.dispose();

  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  }
}

export default function Hyperspeed({ effectOptions = DEFAULT_EFFECT_OPTIONS }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const options = {
      ...DEFAULT_EFFECT_OPTIONS,
      ...effectOptions,
      colors: {
        ...DEFAULT_EFFECT_OPTIONS.colors,
        ...effectOptions.colors
      }
    };

    let animationFrame = 0;
    let disposed = false;
    let speedBoost = 0;
    let targetBoost = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(options.colors.background);
    scene.fog = new THREE.Fog(options.colors.background, options.length * 0.08, options.length * 0.9);

    const camera = new THREE.PerspectiveCamera(options.fov, 1, 0.1, 1200);
    camera.position.set(0, 7, 12);
    camera.lookAt(0, 0, -90);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.renderToScreen = false;
    composer.addPass(renderPass);

    const bloomPass = new EffectPass(
      camera,
      new BloomEffect({
        luminanceThreshold: 0.12,
        luminanceSmoothing: 0.05,
        intensity: 1.35,
        resolutionScale: 0.8
      })
    );
    bloomPass.renderToScreen = false;
    composer.addPass(bloomPass);

    const smaaPass = new EffectPass(
      camera,
      new SMAAEffect({
        preset: SMAAPreset.MEDIUM,
        searchImage: SMAAEffect.searchImageDataURL,
        areaImage: SMAAEffect.areaImageDataURL
      })
    );
    smaaPass.renderToScreen = true;
    composer.addPass(smaaPass);

    const root = new THREE.Group();
    scene.add(root);

    const roadMaterial = new THREE.MeshBasicMaterial({ color: options.colors.roadColor });
    const islandMaterial = new THREE.MeshBasicMaterial({ color: options.colors.islandColor });
    const lineMaterial = new THREE.MeshBasicMaterial({ color: options.colors.brokenLines });
    const shoulderMaterial = new THREE.MeshBasicMaterial({ color: options.colors.shoulderLines });

    const roadGeometry = new THREE.PlaneGeometry(options.roadWidth, options.length, 1, 1);
    const islandGeometry = new THREE.PlaneGeometry(options.islandWidth, options.length, 1, 1);

    const leftRoad = new THREE.Mesh(roadGeometry, roadMaterial);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-(options.roadWidth + options.islandWidth) / 2, 0, -options.length / 2);
    root.add(leftRoad);

    const rightRoad = new THREE.Mesh(roadGeometry.clone(), roadMaterial.clone());
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set((options.roadWidth + options.islandWidth) / 2, 0, -options.length / 2);
    root.add(rightRoad);

    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.rotation.x = -Math.PI / 2;
    island.position.set(0, 0.01, -options.length / 2);
    root.add(island);

    const movingObjects = [];
    const laneLineGeometry = new THREE.BoxGeometry(options.roadWidth * options.brokenLinesWidthPercentage, 0.035, options.length * 0.045);
    const shoulderGeometry = new THREE.BoxGeometry(options.roadWidth * options.shoulderLinesWidthPercentage, 0.04, options.length * 0.06);

    function addRoadMarks(roadCenterX) {
      const laneWidth = options.roadWidth / options.lanesPerRoad;

      for (let lane = 1; lane < options.lanesPerRoad; lane += 1) {
        const x = roadCenterX - options.roadWidth / 2 + lane * laneWidth;
        for (let i = 0; i < 18; i += 1) {
          const line = new THREE.Mesh(laneLineGeometry.clone(), lineMaterial.clone());
          line.position.set(x, 0.05, -i * 24);
          root.add(line);
          movingObjects.push({ mesh: line, speed: 72, wrap: options.length, zOffset: -i * 24 });
        }
      }

      [-1, 1].forEach((side) => {
        for (let i = 0; i < 12; i += 1) {
          const line = new THREE.Mesh(shoulderGeometry.clone(), shoulderMaterial.clone());
          line.position.set(roadCenterX + side * options.roadWidth / 2, 0.06, -i * 34);
          root.add(line);
          movingObjects.push({ mesh: line, speed: 70, wrap: options.length, zOffset: -i * 34 });
        }
      });
    }

    addRoadMarks(leftRoad.position.x);
    addRoadMarks(rightRoad.position.x);

    const lightGeometry = new THREE.BoxGeometry(0.08, 0.08, 1);
    const laneWidth = options.roadWidth / options.lanesPerRoad;

    function addCarLights(roadCenterX, colors, speeds, direction) {
      for (let i = 0; i < options.lightPairsPerRoadWay; i += 1) {
        const lane = i % options.lanesPerRoad;
        const baseX = roadCenterX - options.roadWidth / 2 + laneWidth * lane + laneWidth / 2;
        const shift = randomRange(options.carShiftX) * laneWidth;
        const carWidth = randomRange(options.carWidthPercentage) * laneWidth;
        const z = -Math.random() * options.length;
        const length = randomRange(options.carLightsLength);
        const speed = randomRange(speeds);
        const color = pickRandom(colors);
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.92
        });

        [-1, 1].forEach((side) => {
          const streak = new THREE.Mesh(lightGeometry.clone(), material.clone());
          streak.scale.set(randomRange(options.carLightsRadius) * 8, randomRange(options.carLightsRadius) * 8, length);
          streak.position.set(baseX + shift + side * carWidth / 2, 0.75 + randomRange(options.carFloorSeparation) * 0.08, z);
          root.add(streak);
          movingObjects.push({ mesh: streak, speed: speed * direction, wrap: options.length, zOffset: z });
        });
      }
    }

    addCarLights(leftRoad.position.x, options.colors.leftCars, options.movingAwaySpeed, 1);
    addCarLights(rightRoad.position.x, options.colors.rightCars, options.movingCloserSpeed, -1);

    const stickGeometry = new THREE.BoxGeometry(1, 1, 0.08);
    const stickMaterial = new THREE.MeshBasicMaterial({
      color: options.colors.sticks,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < options.totalSideLightSticks; i += 1) {
      [-1, 1].forEach((side) => {
        const stick = new THREE.Mesh(stickGeometry.clone(), stickMaterial.clone());
        const width = randomRange(options.lightStickWidth);
        const height = randomRange(options.lightStickHeight);
        stick.scale.set(width, height, 1);
        stick.position.set(side * (options.roadWidth + options.islandWidth + 2.4), height / 2, -i * (options.length / options.totalSideLightSticks));
        root.add(stick);
        movingObjects.push({ mesh: stick, speed: 62, wrap: options.length, zOffset: stick.position.z });
      });
    }

    const clock = new THREE.Clock();

    function resize() {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    function speedUp(event) {
      targetBoost = options.speedUp;
      camera.fov = options.fovSpeedUp;
      camera.updateProjectionMatrix();
      options.onSpeedUp(event);
    }

    function slowDown(event) {
      targetBoost = 0;
      camera.fov = options.fov;
      camera.updateProjectionMatrix();
      options.onSlowDown(event);
    }

    container.addEventListener('mousedown', speedUp);
    container.addEventListener('mouseup', slowDown);
    container.addEventListener('mouseleave', slowDown);
    container.addEventListener('touchstart', speedUp, { passive: true });
    container.addEventListener('touchend', slowDown, { passive: true });

    function tick() {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.04);
      const elapsed = clock.elapsedTime;
      speedBoost += (targetBoost - speedBoost) * 0.08;

      root.position.x = Math.sin(elapsed * 0.7) * 0.35;
      root.rotation.z = Math.sin(elapsed * 0.35) * 0.012;

      movingObjects.forEach(({ mesh, speed, wrap }) => {
        mesh.position.z += speed * (1 + speedBoost) * delta;
        if (mesh.position.z > 18) mesh.position.z -= wrap;
        if (mesh.position.z < -wrap) mesh.position.z += wrap;
      });

      composer.render(delta);
      animationFrame = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();

      container.removeEventListener('mousedown', speedUp);
      container.removeEventListener('mouseup', slowDown);
      container.removeEventListener('mouseleave', slowDown);
      container.removeEventListener('touchstart', speedUp);
      container.removeEventListener('touchend', slowDown);

      scene.traverse(disposeObject);
      scene.clear();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [effectOptions]);

  return <div className="hyperspeed-canvas" ref={containerRef} aria-hidden="true" />;
}
