import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { getAllFurniture, getRecommendedFurniture, savePlacement, getPlacements } from '../services/api';
import { getAutoPlacement, getMockPlacement } from '../services/placementService';
import FurnitureList from './FurnitureList';
import SaveLoadPanel from './SaveLoadPanel';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const CM_TO_M = 0.01;
// const ROOM_WIDTH = 400; // cm
// const ROOM_DEPTH = 400; // cm
// const ROOM_HEIGHT = 250; // cm

// 사용자 입력값 불러오기
const getRoomSize = () => {
  try {
    const saved = localStorage.getItem('roomSize');
    if (saved) {
      const { width, length, height } = JSON.parse(saved);
      return {
        width: Number(width) || 400,
        depth: Number(length) || 400,
        height: Number(height) || 250
      };
    }
  } catch (e) {}
  return { width: 400, depth: 400, height: 250 };
};

const RoomVisualizer = () => {
  const mountRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const centerRef = useRef(null);
  const [username, setUsername] = useState('');
  const [doorSizes, setDoorSizes] = useState([]);
  const [currentStyle, setCurrentStyle] = useState('dontknow');
  // 가구/상태 관련
  const [furniture, setFurniture] = useState([]);
  const [filteredFurniture, setFilteredFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [placedFurniture, setPlacedFurniture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplacing, setIsAutoplacing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [savedPlacements, setSavedPlacements] = useState([]);
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(false);
  const [budget, setBudget] = useState('800000');
  const [pointColor, setPointColor] = useState('beige');
  const [recommendedFurnitureForRender, setRecommendedFurnitureForRender] = useState([]);

  // Three.js 관련 레퍼런스
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const furnitureModelsRef = useRef({});
  const animationFrameRef = useRef(null);
  
  // 카메라 회전 관련 상태
  const [isRotating, setIsRotating] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const rotationStateRef = useRef({
    currentDirection: 0, // 0: South, 1: East, 2: North, 3: West
    targetDirection: 0,
    progress: 0,
    startPosition: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    isAnimating: false
  });
  const orbitStateRef = useRef({
    angle: 0, // 현재 회전 각도 (라디안)
    radius: 0, // 회전 반경
    speed: 0.005, // 회전 속도 (더 빠르게)
    isActive: false // 궤도 회전 활성 상태
  });
  
  const styleDescriptions = {
  modern: `✨ 세련되고 효율적인 공간을 위해 설계된 모던 스타일 배치입니다. 
불필요한 장식을 배제하고, 선이 깔끔한 가구들을 중심으로 여백과 기능성을 중시합니다. 
가구들은 벽을 따라 밀착 배치되며, 동선은 간결하고 방 전체의 시야를 탁 트이게 구성되어 
작은 공간에서도 넓어 보이는 효과를 줍니다. 
'간결함 속의 질서'를 추구하며, 현대적인 감성과 실용성의 균형을 맞추는 것이 이 스타일의 핵심입니다.`,

  natural: `🌿 자연과 조화를 이루는 따뜻한 공간을 지향하는 내추럴 스타일 배치입니다. 
창문 근처나 햇빛이 잘 드는 벽을 우선적으로 활용하며, 가구 사이에는 여유 공간을 두어 
자연스러운 여백과 흐름을 만듭니다. 
가구 배치는 너무 딱 맞지 않도록 여유 있게 배치되며, 나무 질감의 가구나 부드러운 컬러를 선호합니다. 
'살아 숨 쉬는 공간'을 목표로 하며, 아늑하면서도 답답하지 않은 분위기를 만들어냅니다.`,

  cozy: `🛋️ 포근하고 감성적인 분위기를 중심으로 한 코지 스타일 배치입니다. 
침대, 소파 등 휴식을 위한 가구를 중심으로 공간의 중심을 잡고, 
벽이나 다른 가구에 가까이 배치하여 안정감을 줍니다. 
자연광과 같은 조용하고 닫힌 공간에서 오는 아늑함을 중시하며, 
가구들이 서로 어울리게 모여있는 배치를 통해 '혼자 있어도 외롭지 않은 방'을 구현합니다. 
작은 소품이나 데코레이션을 둘 공간도 염두에 두고 설계되며, 사용자의 감정을 편안하게 만들어주는 침구류들을 이용하는 것이 이 스타일의 핵심입니다.`,

  dontknow: `🤖 당신의 취향이나 방 구조를 바탕으로, 최적의 스타일을 인공지능이 자동으로 판단하여 배치합니다. 
모던, 내추럴, 코지 등 여러 스타일의 배치 원칙을 비교하고, 
사용자의 선택 및 환경 데이터를 분석하여 가장 어울리는 조합을 선택합니다. 
'알아서 잘 해주는' 배치를 원하신다면 이 스타일이 적합하며, 
개인의 취향을 존중하면서도 효율적인 공간 구성을 보장합니다.`
};

const styleNameMap = {
  modern: '모던',
  natural: '내추럴',
  cozy: '코지',
  dontknow: '모르겠음'
};
useEffect(() => {
  const normalizeStyle = (style) => {
    switch (style) {
      case '모던': return 'modern';
      case '내추럴': return 'natural';
      case '코지': return 'cozy';
      case '모르겠음': return 'dontknow';
      default: return 'dontknow';
    }
  };
  const rawStyle = localStorage.getItem('style');
  const normalized = normalizeStyle(rawStyle);
  setCurrentStyle(normalized);
}, []);
  // 방 크기 상태를 컴포넌트 내부에서 선언
  const [roomSize, setRoomSize] = useState(getRoomSize());

  // 중앙 영역 크기 측정
  useEffect(() => {
    const updateSize = () => {
      if (centerRef.current) {
        setContainerSize({
          width: centerRef.current.clientWidth,
          height: centerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const updateRoomSize = () => setRoomSize(getRoomSize()); 
    window.addEventListener('storage', updateRoomSize);
    updateRoomSize();
    return () => window.removeEventListener('storage', updateRoomSize);
  }, []);

  // Load furniture on component mount
  useEffect(() => {
    console.log('RoomVisualizer MOUNTED');
    const loadFurniture = async () => {
      try {
        const furnitureData = await getAllFurniture();
        console.log('Loaded furniture:', furnitureData);
        setFurniture(furnitureData);
        setFilteredFurniture(furnitureData);
      } catch (error) {
        console.error('Failed to load furniture:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFurniture();
    return () => {
      console.log('RoomVisualizer UNMOUNTED');
      setFurniture([]);
      setFilteredFurniture([]);
      setSelectedItems([]);
      // 기타 필요한 상태 초기화
    };
  }, []);

  // Load user info on component mount
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user'));
      console.log('Stored user info:', userInfo); // 디버깅용
      if (userInfo && userInfo.username) {
        setUsername(userInfo.username);
      }
    } catch (error) {
      console.error('Error parsing user info:', error);
    }
  }, []);

  // Load saved placements on component mount
  useEffect(() => {
    loadSavedPlacements();
  }, []);

  // Load door sizes on component mount
  useEffect(() => {
    try {
      const savedDoorSizes = JSON.parse(localStorage.getItem('doorSizes')) || [];
      setDoorSizes(savedDoorSizes);
    } catch (e) {
      console.error('Error loading door sizes:', e);
      setDoorSizes([]);
    }
  }, []);

  // Three.js 초기화 및 방/가구 렌더링
  useEffect(() => {
    if (!mountRef.current) return;

    // 방 크기(m 단위)
    const roomWidth = roomSize.width * CM_TO_M;
    const roomDepth = roomSize.depth * CM_TO_M;
    const roomHeight = roomSize.height * CM_TO_M;
    const maxRoomSize = Math.max(roomWidth, roomDepth, roomHeight);

    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 카메라 생성 (방 중심 기준)
    const camera = new THREE.PerspectiveCamera(
      65,
      canvasWidth / canvasHeight,
      0.1,
      1000
    );
    // 카메라 시점 변경
    // camera.position.set(0, maxRoomSize * 0.8, maxRoomSize * 1.2);
    // camera.position.set(roomWidth * 0.7, roomHeight * 1.2, roomDepth * 0.7);
    // camera.position.set(0, roomHeight * 1.2, roomDepth * 1.2);
    camera.position.set(0, roomHeight / 2, roomDepth * 1.2);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, roomHeight / 2, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 마운트 지점에 추가
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 바닥
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);

    // 벽 material 준비 (각 벽마다 clone)
    const wallMaterialBack = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, side: THREE.DoubleSide, transparent: true, opacity: 1 });
    const wallMaterialFront = wallMaterialBack.clone();
    const wallMaterialLeft = wallMaterialBack.clone();
    const wallMaterialRight = wallMaterialBack.clone();

    // 뒷벽(북쪽)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterialBack
    );
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2;
    backWall.name = 'backWall';
    scene.add(backWall);

    // 앞벽(남쪽)
    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterialFront
    );
    frontWall.position.z = roomDepth / 2;
    frontWall.position.y = roomHeight / 2;
    frontWall.rotation.y = Math.PI;
    frontWall.name = 'frontWall';
    scene.add(frontWall);

    // 왼쪽 벽(서쪽)
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomDepth, roomHeight),
      wallMaterialLeft
    );
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.name = 'leftWall';
    scene.add(leftWall);

    // 오른쪽 벽(동쪽)
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomDepth, roomHeight),
      wallMaterialRight
    );
    rightWall.position.x = roomWidth / 2;
    rightWall.position.y = roomHeight / 2;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.name = 'rightWall';
    scene.add(rightWall);

    // 그리드 헬퍼
    const gridHelper = new THREE.GridHelper(
      Math.max(roomWidth, roomDepth), // 방의 더 큰 크기를 기준으로 그리드 생성
      Math.max(roomWidth, roomDepth) / 0.25, // 50cm 간격으로 그리드 라인 생성
      new THREE.Color(0x888888), // 그리드 색상
      new THREE.Color(0xcccccc)  // 중앙선 색상
    );
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 1); // m 단위
    dirLight.castShadow = true;
    scene.add(dirLight);

    // OrbitControls (방 중심 기준)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, roomHeight / 2, 0);
    controls.update();
    controlsRef.current = controls;


    // 문(door) 텍스처 로드
    const textureLoader = new THREE.TextureLoader();
    const doorTexture = textureLoader.load('/textures/door_wood.jpg');

    // 문(door) 표시
    let doorSizes = [];
    try {
      doorSizes = JSON.parse(localStorage.getItem('doorSizes')) || [];
    } catch (e) {}
    const thickness = 0.005; // 문 두께(5cm)
    doorSizes.forEach(door => {
      if (!door.wall || !door.width || !door.height) return;
      const doorWidth = Number(door.width) * CM_TO_M;
      const doorHeight = Number(door.height) * CM_TO_M;
      const offset = Number(door.offset) * CM_TO_M;
      const geometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
      const material = new THREE.MeshStandardMaterial({ 
        map: doorTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.98
      });
      const doorMesh = new THREE.Mesh(geometry, material);
      const doorMeshBack = doorMesh.clone();
      switch (door.wall) {
        case 'north': // 뒷벽 (북쪽 벽 - 북->남 시점 왼쪽 기준)
          doorMesh.position.set(
            roomWidth / 2 - offset - doorWidth / 2,
            doorHeight / 2,
            -roomDepth / 2 + thickness
          );
          doorMeshBack.position.set(
            roomWidth / 2 - offset - doorWidth / 2,
            doorHeight / 2,
            -roomDepth / 2 - thickness
          );
          break;
        case 'south': // 앞벽 (남쪽 벽 - 남->북 시점 왼쪽 기준)
          doorMesh.position.set(
            -roomWidth / 2 + offset + doorWidth / 2,
            doorHeight / 2,
            roomDepth / 2 - thickness
          );
          doorMesh.rotation.y = Math.PI;
          doorMeshBack.position.set(
            -roomWidth / 2 + offset + doorWidth / 2,
            doorHeight / 2,
            roomDepth / 2 + thickness
          );
          doorMeshBack.rotation.y = Math.PI;
          break;
        case 'west': // 왼쪽 벽 (서쪽 벽 - 서->동 시점 왼쪽 기준)
          doorMesh.position.set(
            -roomWidth / 2 + thickness,
            doorHeight / 2,
            -roomWidth / 2 + doorWidth + offset / 2  // Z calculation
            
          ); console.log(`west positioned at: (from input: x=${-roomWidth / 2 + thickness}cm, y=${-roomWidth / 2 + offset + (doorWidth - offset)}cm)`);
          doorMesh.rotation.y = Math.PI / 2;
          doorMeshBack.position.set(
            -roomWidth / 2 - thickness,
            doorHeight / 2,
            -roomWidth / 2 + doorWidth + offset / 2 // Z calculation
          );
          doorMeshBack.rotation.y = Math.PI / 2;
          break;
        case 'east': // 오른쪽 벽 (동쪽 벽 - 동->서 시점 왼쪽 기준)
          doorMesh.position.set(
            roomWidth / 2 - thickness,
            doorHeight / 2,
            roomDepth / 2 - offset - doorWidth / 2 // Z calculation
          );
          doorMesh.rotation.y = -Math.PI / 2;
          doorMeshBack.position.set(
            roomWidth / 2 + thickness,
            doorHeight / 2,
            roomDepth / 2 - offset - doorWidth / 2 // Z calculation
          );
          doorMeshBack.rotation.y = -Math.PI / 2;
          break;
      }
      scene.add(doorMesh);
      scene.add(doorMeshBack);
    });

    // 창문(window) 텍스처/재질 준비 (예: 반투명 파란색)
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb, // Sky blue
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });

    // 창문(window) 표시
    let windowSizes = [];
    try {
      windowSizes = JSON.parse(localStorage.getItem('windowSizes')) || [];
    } catch (e) {
      console.error('Error loading windowSizes from localStorage:', e);
    }

    const windowThickness = 0.005; // 창문 두께 (5mm)
    windowSizes.forEach(win => {
      if (!win.wall || !win.width || !win.height || typeof win.altitude === 'undefined' || typeof win.offset === 'undefined') {
        console.warn('[RoomVisualizer] Incomplete window data, skipping:', win);
        return;
      }
      const windowWidth = Number(win.width) * CM_TO_M;
      const windowHeight = Number(win.height) * CM_TO_M;
      const altitude = Number(win.altitude) * CM_TO_M;
      const offset = Number(win.offset) * CM_TO_M;

      const geometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
      const windowMesh = new THREE.Mesh(geometry, windowMaterial.clone()); // 재질 복제 사용
      const windowMeshBack = windowMesh.clone(); // 뒷면용 복제

      // 창문의 y 위치는 (바닥으로부터의 높이 + 창문 높이의 절반)
      const posY = altitude + windowHeight / 2;

      switch (win.wall.toLowerCase()) {
        case 'north': // 뒷벽 (북쪽)
          windowMesh.position.set(
            roomWidth / 2 - offset - windowWidth / 2, 
            posY, 
            -roomDepth / 2 + windowThickness
          );
          windowMeshBack.position.set(
            roomWidth / 2 - offset - windowWidth / 2, 
            posY, 
            -roomDepth / 2 - windowThickness
          );
          break;
        case 'south': // 앞벽 (남쪽)
          windowMesh.position.set(
            -roomWidth / 2 + offset + windowWidth / 2, 
            posY, 
            roomDepth / 2 - windowThickness
          );
          windowMesh.rotation.y = Math.PI;
          windowMeshBack.position.set(
            -roomWidth / 2 + offset + windowWidth / 2, 
            posY, 
            roomDepth / 2 + windowThickness
          );
          windowMeshBack.rotation.y = Math.PI;
          break;
        case 'west': // 왼쪽 벽 (서쪽)
          windowMesh.position.set(
            -roomWidth / 2 + windowThickness, 
            posY, 
            -roomDepth / 2 + offset + windowWidth / 2 // 이전 roomWidth를 roomDepth로 수정
          );
          windowMesh.rotation.y = Math.PI / 2;
          windowMeshBack.position.set(
            -roomWidth / 2 - windowThickness, 
            posY, 
            -roomDepth / 2 + offset + windowWidth / 2 // 이전 roomWidth를 roomDepth로 수정
          );
          windowMeshBack.rotation.y = Math.PI / 2;
          break;
        case 'east': // 오른쪽 벽 (동쪽)
          windowMesh.position.set(
            roomWidth / 2 - windowThickness, 
            posY, 
            roomDepth / 2 - offset - windowWidth / 2
          );
          windowMesh.rotation.y = -Math.PI / 2;
          windowMeshBack.position.set(
            roomWidth / 2 + windowThickness, 
            posY, 
            roomDepth / 2 - offset - windowWidth / 2
          );
          windowMeshBack.rotation.y = -Math.PI / 2;
          break;
        default:
          console.warn('[RoomVisualizer] Unknown wall for window:', win.wall);
          return; // 알 수 없는 벽이면 스킵
      }
      scene.add(windowMesh);
      scene.add(windowMeshBack);
      console.log('[RoomVisualizer] Added window:', { ...win, calculatedY: posY });
    });

    // Partition zones 표시
    let partitionZones = [];
    try {
      partitionZones = JSON.parse(localStorage.getItem('partitionZones')) || [];
    } catch (e) {}
    partitionZones.forEach(zone => {
      if (zone.type === 'partition') {
        // 가벽: 벽에 평행하게 배치 - cm → m 변환
        const length = Number(zone.length) * 0.01;
        const wallOffset = Number(zone.wallOffset) * 0.01 || 0;
        const height = Number(zone.height) * 0.01;
        if (!length || !height) return;
        const geometry = new THREE.PlaneGeometry(length, height);
        const material = new THREE.MeshStandardMaterial({
          color: 0xbbbbbb,
          side: THREE.DoubleSide,
          opacity: 0.95,
          transparent: true
        });
        const mesh = new THREE.Mesh(geometry, material);
    
        // 벽에 평행하게 배치하도록 방향과 위치 계산
        switch (zone.wall) {
          case 'north':
            mesh.position.set(
              roomWidth / 2 - length / 2, // x: 방의 왼쪽 끝에서 length/2만큼 이동
              height / 2, // y: 높이의 중앙
              -roomDepth / 2 + wallOffset // z: 북쪽 벽에서 wallOffset만큼 떨어짐
            );
            mesh.rotation.y = 0; // 북쪽 벽에 평행
            break;
          case 'south':
            mesh.position.set(
              -roomWidth / 2 + length / 2,
              height / 2,
              roomDepth / 2 - wallOffset // z: 남쪽 벽에서 wallOffset만큼 떨어짐
            );
            mesh.rotation.y = 0; // 남쪽 벽에 평행
            break;
          case 'west':
            mesh.position.set(
              -roomWidth / 2 + wallOffset, // x: 서쪽 벽에서 wallOffset만큼 떨어짐
              height / 2,
              -roomDepth / 2 + length / 2 // z: 방의 아래쪽 끝에서 length/2만큼 이동
            );
            mesh.rotation.y = Math.PI / 2; // 서쪽 벽에 평행
            break;
          case 'east':
            mesh.position.set(
              roomWidth / 2 - wallOffset, // x: 동쪽 벽에서 wallOffset만큼 떨어짐
              height / 2,
              roomDepth / 2 - length / 2
            );
            mesh.rotation.y = Math.PI / 2; // 동쪽 벽에 평행
            break;
        }
        // 가벽(mesh)은 무조건 추가
        scene.add(mesh);

        // 문 렌더링 (가벽에 문이 있는 경우)
        if (zone.doors && Array.isArray(zone.doors) && zone.doors.length > 0) {
          zone.doors.forEach(door => {
            const doorWidth = Number(door.width) * 0.01;
            const doorHeight = Number(door.height) * 0.01;
            const doorOffset = Number(door.offset) * 0.01;
            if (!doorWidth || !doorHeight) {
              console.warn('문 크기 오류:', door);
              return;
            }
            // 나무 텍스처 적용
            const doorGeometry = new THREE.PlaneGeometry(doorWidth, doorHeight);
            const doorMaterial = new THREE.MeshStandardMaterial({ 
              map: doorTexture,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.98
            });
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            const doorMeshBack = doorMesh.clone();
            switch (zone.wall) {
              case 'north': {
                const baseZ = -roomDepth / 2 + wallOffset; // Use wallOffset (meters)
                const posX = roomWidth / 2 - doorOffset - doorWidth / 2;
                const posZ = baseZ + 0.01;
                doorMesh.position.set(posX, doorHeight / 2, posZ);
                doorMeshBack.position.set(posX, doorHeight / 2, baseZ - 0.01);
                console.log('[가벽문 north] length:', length, 'doorWidth:', doorWidth, 'doorOffset:', doorOffset, 'posX:', posX, 'posZ:', posZ);
                break;
              }
              case 'south': {
                const baseZ = roomDepth / 2 - wallOffset; // Use wallOffset (meters)
                const posX = -roomWidth / 2 + doorOffset + doorWidth / 2;
                const posZ = baseZ - 0.01;
                doorMesh.position.set(posX, doorHeight / 2, posZ);
                doorMesh.rotation.y = Math.PI;
                doorMeshBack.position.set(posX, doorHeight / 2, baseZ + 0.01);
                doorMeshBack.rotation.y = Math.PI;
                console.log('[가벽문 south] length:', length, 'doorWidth:', doorWidth, 'doorOffset:', doorOffset, 'posX:', posX, 'posZ:', posZ);
                break;
              }
              case 'west': {
                const baseX = -roomWidth / 2 + wallOffset; // Use wallOffset (meters)
                const posX = baseX + 0.01;
                const posZ = -roomWidth / 2 + doorOffset + doorWidth / 2;
                doorMesh.position.set(posX, doorHeight / 2, posZ);
                doorMesh.rotation.y = Math.PI / 2;
                doorMeshBack.position.set(baseX - 0.01, doorHeight / 2, posZ);
                doorMeshBack.rotation.y = Math.PI / 2;
                console.log('[가벽문 west] length:', length, 'doorWidth:', doorWidth, 'doorOffset:', doorOffset, 'posX:', posX, 'posZ:', posZ);
                break;
              }
              case 'east': {
                const baseX = roomWidth / 2 - wallOffset; // Use wallOffset (meters)
                const posX = baseX - 0.01;
                const posZ = roomDepth / 2 - doorOffset - doorWidth / 2;
                doorMesh.position.set(posX, doorHeight / 2, posZ);
                doorMesh.rotation.y = Math.PI / 2;
                doorMeshBack.position.set(baseX + 0.01, doorHeight / 2, posZ);
                doorMeshBack.rotation.y = Math.PI / 2;
                console.log('[가벽문 east] length:', length, 'doorWidth:', doorWidth, 'doorOffset:', doorOffset, 'posX:', posX, 'posZ:', posZ);
                break;
              }
            }
            scene.add(doorMesh);
            scene.add(doorMeshBack);
            console.log('가벽 문 렌더링:', { wall: zone.wall, doorWidth, doorHeight, doorOffset, position: doorMesh.position });
          });
        }
      } else if (zone.type === 'color') {
        // 색상 구역: 단위 변환 수정 (cm → m)
        const widthCm = Number(zone.width);
        const depthCm = Number(zone.depth);
        if (!widthCm || !depthCm) {
          console.warn('Invalid dimensions for color zone:', zone);
          return;
        }
        
        // cm to m conversion
        const width = widthCm * CM_TO_M;
        const depth = depthCm * CM_TO_M;
        const xCm = Number(zone.x);
        const yCm = Number(zone.y);
        
        let color = zone.color || '#4CAF50';
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
          console.warn(`Invalid color format for zone: ${color}, using default green (#4CAF50)`);
          color = '#4CAF50';
        }
        console.log('Applying color to zone:', color, 'Dimensions (m):', width, 'x', depth);
        
        const geometry = new THREE.PlaneGeometry(width, depth);
        const material = new THREE.MeshStandardMaterial({
          color: color,
          side: THREE.DoubleSide,
          opacity: zone.isDoorZone ? 0.7 : 1,
          transparent: zone.isDoorZone ? true : false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        
        // 좌표 변환: cm → m, 좌표계 변환
        const x = (xCm * CM_TO_M) - (roomWidth / 2) + (width / 2);
        const z = (roomDepth / 2) - (yCm * CM_TO_M) - (depth / 2);
        
        mesh.position.set(x, 0.02, z);
        scene.add(mesh);
        
        console.log(`Color zone positioned at: x=${x.toFixed(3)}m, z=${z.toFixed(3)}m (from input: x=${xCm}cm, y=${yCm}cm)`);
      }
    });

    // 애니메이션 루프
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // OrbitControls 업데이트 (궤도 회전 중이 아닐 때만)
      if (controlsRef.current && !orbitStateRef.current.isActive) {
        controlsRef.current.update();
      }
      
      // 카메라 회전 애니메이션 업데이트
      updateCameraRotation();
      // 카메라 궤도 회전 업데이트
      updateCameraOrbit();
      // 벽 투명도 동적 조절
      updateWallTransparency();
      renderer.render(scene, camera);
    };

    // 벽 투명도 조절 함수
    function updateWallTransparency() {
      const cameraPos = camera.position;
      const wallCenters = {
        frontWall: new THREE.Vector3(0, roomHeight / 2, roomDepth / 2),
        backWall: new THREE.Vector3(0, roomHeight / 2, -roomDepth / 2),
        leftWall: new THREE.Vector3(-roomWidth / 2, roomHeight / 2, 0),
        rightWall: new THREE.Vector3(roomWidth / 2, roomHeight / 2, 0),
      };
      
      // 궤도 회전 중일 때는 모든 벽을 더 투명하게 설정
      const isOrbiting = orbitStateRef.current.isActive;
      
      ['frontWall', 'backWall', 'leftWall', 'rightWall'].forEach(name => {
        const wall = scene.getObjectByName(name);
        if (wall) {
          if (isOrbiting) {
            // 궤도 회전 중: 모든 벽을 반투명하게 (0.3 opacity)
            wall.material.opacity = 0.3;
          } else {
            // 일반 모드: 거리 기반 투명도
            const dist = cameraPos.distanceTo(wallCenters[name]);
            wall.material.opacity = Math.max(0.2, Math.min(1, (dist - 2) / 2));
          }
          wall.material.transparent = true;
          wall.material.needsUpdate = true;
        }
      });
    }

    animate();

    // 정리
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      
      // Dispose of controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (sceneRef.current) {
        const children = [...sceneRef.current.children];
        children.forEach((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
              object.material.forEach(material => {
                if (material.map) material.map.dispose();
              });
          } else {
              if (object.material.map) object.material.map.dispose();
            }
            object.material.dispose();
          }

          // Also remove the object from the scene
          sceneRef.current.remove(object);
      });

      // Dispose of renderer
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null; // Clear renderer ref immediately after disposing
      }

        // Clear scene and camera refs
      sceneRef.current = null;
      cameraRef.current = null;
      }

      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [roomSize, canvasWidth, canvasHeight]);

  // 캔버스 리사이즈 시 카메라/렌더러 갱신
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(canvasWidth, canvasHeight);
      cameraRef.current.aspect = canvasWidth / canvasHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [canvasWidth, canvasHeight]);


  // ResizableBox의 최대 크기 제한 계산
  const maxWidth = containerSize.width ? containerSize.width - 40 : 1000;




  const resetCameraPosition = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomHeight = roomSize.height * CM_TO_M;
      const roomDepth = roomSize.depth * CM_TO_M;
      cameraRef.current.position.set(0, roomHeight / 2, roomDepth * 1.2);
      cameraRef.current.lookAt(0, roomHeight / 2, 0);
      controlsRef.current.target.set(0, roomHeight / 2, 0);
      controlsRef.current.update();
    }
  };

  const setTopDownView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomWidth = roomSize.width * CM_TO_M;
      const roomDepth = roomSize.depth * CM_TO_M;
      const roomHeight = roomSize.height * CM_TO_M;
      
      // Position camera directly above the room center
      const maxRoomSize = Math.max(roomWidth, roomDepth);
      const cameraHeight = Math.max(maxRoomSize * 1.5, roomHeight * 3);
      
      cameraRef.current.position.set(0, cameraHeight, 0);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setEastView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomWidth = roomSize.width * CM_TO_M;
      const roomHeight = roomSize.height * CM_TO_M;
      
      // Position camera on the east side (positive X), looking west toward center
      const distance = roomWidth * 1.2;
      
      cameraRef.current.position.set(distance, roomHeight / 2, 0);
      cameraRef.current.lookAt(0, roomHeight / 2, 0);
      controlsRef.current.target.set(0, roomHeight / 2, 0);
      controlsRef.current.update();
    }
  };

  const setWestView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomWidth = roomSize.width * CM_TO_M;
      const roomHeight = roomSize.height * CM_TO_M;
      
      // Position camera on the west side (negative X), looking east toward center
      const distance = roomWidth * 1.2;
      
      cameraRef.current.position.set(-distance, roomHeight / 2, 0);
      cameraRef.current.lookAt(0, roomHeight / 2, 0);
      controlsRef.current.target.set(0, roomHeight / 2, 0);
      controlsRef.current.update();
    }
  };

  const setSouthView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomDepth = roomSize.depth * CM_TO_M;
      const roomHeight = roomSize.height * CM_TO_M;
      
      // Position camera on the south side (positive Z), looking north toward center
      const distance = roomDepth * 1.2;
      
      cameraRef.current.position.set(0, roomHeight / 2, distance);
      cameraRef.current.lookAt(0, roomHeight / 2, 0);
      controlsRef.current.target.set(0, roomHeight / 2, 0);
      controlsRef.current.update();
    }
  };

  const setNorthView = () => {
    if (cameraRef.current && controlsRef.current) {
      const roomDepth = roomSize.depth * CM_TO_M;
      const roomHeight = roomSize.height * CM_TO_M;
      
      // Position camera on the north side (negative Z), looking south toward center
      const distance = roomDepth * 1.2;
      
      cameraRef.current.position.set(0, roomHeight / 2, -distance);
      cameraRef.current.lookAt(0, roomHeight / 2, 0);
      controlsRef.current.target.set(0, roomHeight / 2, 0);
      controlsRef.current.update();
    }
  };

  // 카메라 회전 애니메이션 업데이트 함수
  const updateCameraRotation = () => {
    if (!rotationStateRef.current.isAnimating || !cameraRef.current || !controlsRef.current) return;
    
    const state = rotationStateRef.current;
    state.progress += 0.02; // 애니메이션 속도 (값이 클수록 빠름)
    
    if (state.progress >= 1) {
      // 애니메이션 완료
      state.progress = 1;
      state.isAnimating = false;
      state.currentDirection = state.targetDirection;
    }
    
    // easeInOutQuad 애니메이션 곡선 적용
    const easeProgress = state.progress < 0.5 
      ? 2 * state.progress * state.progress 
      : 1 - Math.pow(-2 * state.progress + 2, 2) / 2;
    
    // 시작 위치와 목표 위치 사이를 보간
    const currentPos = new THREE.Vector3().lerpVectors(
      state.startPosition, 
      state.targetPosition, 
      easeProgress
    );
    
    cameraRef.current.position.copy(currentPos);
    
    // 항상 방 중심을 바라보도록 설정
    const roomHeight = roomSize.height * CM_TO_M;
    const lookAtTarget = new THREE.Vector3(0, roomHeight / 2, 0);
    cameraRef.current.lookAt(lookAtTarget);
    controlsRef.current.target.copy(lookAtTarget);
    controlsRef.current.update();
    
    // 애니메이션이 완료되면 회전 상태 업데이트
    if (!state.isAnimating) {
      setIsRotating(false);
    }
  };

  // 다음 방향으로 부드럽게 회전하는 함수
  const rotateToNextDirection = () => {
    if (rotationStateRef.current.isAnimating || isOrbiting) return; // 이미 애니메이션 중이거나 궤도 회전 중이면 무시
    
    const roomWidth = roomSize.width * CM_TO_M;
    const roomDepth = roomSize.depth * CM_TO_M;
    const roomHeight = roomSize.height * CM_TO_M;
    const distance = Math.max(roomWidth, roomDepth) * 1.2;
    
    const state = rotationStateRef.current;
    
    // 다음 방향 계산 (South → East → North → West → South)
    state.targetDirection = (state.currentDirection + 1) % 4;
    
    // 현재 카메라 위치를 시작 위치로 설정
    if (cameraRef.current) {
      state.startPosition.copy(cameraRef.current.position);
    }
    
    // 목표 위치 계산
    switch (state.targetDirection) {
      case 0: // South (positive Z)
        state.targetPosition.set(0, roomHeight / 2, roomDepth * 1.2);
        break;
      case 1: // East (positive X)
        state.targetPosition.set(roomWidth * 1.2, roomHeight / 2, 0);
        break;
      case 2: // North (negative Z)
        state.targetPosition.set(0, roomHeight / 2, -roomDepth * 1.2);
        break;
      case 3: // West (negative X)
        state.targetPosition.set(-roomWidth * 1.2, roomHeight / 2, 0);
        break;
    }
    
    // 애니메이션 시작
    state.progress = 0;
    state.isAnimating = true;
    setIsRotating(true);
  };

  // 연속 궤도 회전 업데이트 함수
  const updateCameraOrbit = () => {
    const orbitState = orbitStateRef.current;
    
    if (!orbitState.isActive || !cameraRef.current) return;
    
    const roomWidth = roomSize.width * CM_TO_M;
    const roomDepth = roomSize.depth * CM_TO_M;
    const roomHeight = roomSize.height * CM_TO_M;
    
    // 각도 증가 (연속 회전)
    orbitState.angle += orbitState.speed;
    
    // 2π를 넘으면 0으로 리셋 (무한 회전)
    if (orbitState.angle >= Math.PI * 2) {
      orbitState.angle = 0;
    }
    
    // 회전 반경 계산 (방 크기에 기반)
    orbitState.radius = Math.max(roomWidth, roomDepth) * 1.2;
    
    // 원형 궤도 위치 계산
    const x = Math.cos(orbitState.angle) * orbitState.radius;
    const z = Math.sin(orbitState.angle) * orbitState.radius;
    const y = roomHeight / 2; // 눈높이 유지
    
    // 카메라 위치 설정
    cameraRef.current.position.set(x, y, z);
    
    // 항상 방 중심을 바라보도록 설정
    const lookAtTarget = new THREE.Vector3(0, roomHeight / 2, 0);
    cameraRef.current.lookAt(lookAtTarget);
    
    // // 디버깅: 매 60프레임마다 위치 로그
    // if (Math.floor(orbitState.angle * 100) % 20 === 0) {
    //   console.log(`Orbit angle: ${orbitState.angle.toFixed(2)}, Camera pos: x=${x.toFixed(2)}, z=${z.toFixed(2)}`);
    // }
  };

  // 연속 궤도 회전 토글 함수
  const toggleCameraOrbit = () => {
    if (rotationStateRef.current.isAnimating) return; // 단계별 회전 중이면 무시
    
    const orbitState = orbitStateRef.current;
    const newOrbitState = !isOrbiting;
    setIsOrbiting(newOrbitState);
    orbitState.isActive = newOrbitState;
    
    if (newOrbitState) {
      // 궤도 회전 시작 - 현재 카메라 위치에서 각도 계산
      const roomWidth = roomSize.width * CM_TO_M;
      const roomDepth = roomSize.depth * CM_TO_M;
      
      if (cameraRef.current) {
        const currentPos = cameraRef.current.position;
        const currentAngle = Math.atan2(currentPos.z, currentPos.x);
        orbitState.angle = currentAngle;
        orbitState.radius = Math.max(roomWidth, roomDepth) * 1.2;
        
        console.log('Starting orbit rotation from angle:', currentAngle);
        console.log('Camera position:', currentPos.x, currentPos.y, currentPos.z);
      }
      
      // OrbitControls 비활성화
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    } else {
      // 궤도 회전 중지 - OrbitControls 재활성화
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      console.log('Stopping orbit rotation');
    }
  };

  // Handler functions
  const handleRecommendFurniture = async () => {
    setIsRecommending(true);
    try {
      // 1. Retrieve all necessary data from localStorage to build the payload
      //    similar to how it's done in ImportanceOrder.js
      const roomSizeData = JSON.parse(localStorage.getItem('roomSize') || '{}');
      const doorSizesData = JSON.parse(localStorage.getItem('doorSizes') || '[]');
      const windowSizesData = JSON.parse(localStorage.getItem('windowSizes') || '[]');
      const partitionZonesData = JSON.parse(localStorage.getItem('partitionZones') || '[]');
      
      const budgetPref = localStorage.getItem('budget') || '100만원'; 
      const essentialFurniturePref = JSON.parse(localStorage.getItem('essentialFurniture') || '[]');
      const stylePref = localStorage.getItem('style') || '모던'; 
      const colortonePref = localStorage.getItem('colortone') || '밝은색'; 
      // Use component's state for pointColor if it's more up-to-date, otherwise fallback to localStorage
      const pointcolorPref = pointColor || localStorage.getItem('pointcolor') || 'beige'; 
      const importanceOrderPref = JSON.parse(localStorage.getItem('importanceOrder') || '{}');

      // Validate essential data
      if (Object.keys(roomSizeData).length === 0 || !roomSizeData.width) {
        alert('방 크기 정보가 localStorage에 없습니다. 이전 단계를 완료해주세요.');
        setIsRecommending(false);
        return;
      }
      if (Object.keys(importanceOrderPref).length === 0) {
         alert('중요도 순서 정보가 localStorage에 없습니다. 이전 단계를 완료해주세요.');
         setIsRecommending(false);
         return;
      }
       if (!stylePref) {
         alert('스타일 정보가 localStorage에 없습니다. 이전 단계를 완료해주세요.');
         setIsRecommending(false);
         return;
      }


      const completePayload = {
          roomSize: roomSizeData,
          doorSizes: doorSizesData,
          windowSizes: windowSizesData,
          partitionZones: partitionZonesData,
          preferences: {
              budget: budgetPref,
              essentialFurniture: essentialFurniturePref,
              style: stylePref,
              colortone: colortonePref,
              pointcolor: pointcolorPref,
              importanceOrder: importanceOrderPref,
          }
      };

      console.log('Calling getRecommendedFurniture with (complete payload for RoomVisualizer):', JSON.stringify(completePayload, null, 2));

      const recommendationResult = await getRecommendedFurniture(completePayload);

      console.log('추천 결과 (서버 응답 RoomVisualizer):', recommendationResult);

      if (recommendationResult && recommendationResult.placements && recommendationResult.placements.length > 0) {
        console.log('[RoomVisualizer] Processing response.placements. Initial length:', recommendationResult.placements.length);

        const newRecommendedFurniture = recommendationResult.placements.map((p, index) => {
          console.log(`[RoomVisualizer] Mapping item ${index} - Raw:`, JSON.stringify(p));
          if (!p || !p.element) {
            console.error(`[RoomVisualizer] Item ${index} is invalid or missing 'element' property. Original item:`, p, 'Skipping.');
            return null;
          }
          const el = p.element;

          if (typeof el.x === 'undefined' || typeof el.y === 'undefined') {
            console.error(`[RoomVisualizer] Item ${index} (oid: ${el.oid}) is missing x or y. el:`, el, 'Skipping.');
            return null;
          }
          if (typeof el.glb_file !== 'string') {
            console.error(`[RoomVisualizer] Item ${index} (oid: ${el.oid}) has invalid glb_file. el:`, el, 'Skipping.');
            return null;
          }
          if (typeof el.oid === 'undefined') {
            console.error(`[RoomVisualizer] Item ${index} is missing oid. el:`, el, 'Skipping.');
            return null;
          }
          
          const x = parseFloat(el.x) || 0;
          const y = parseFloat(el.y) || 0;
          const isHorizon = el.isHorizon || el.isHorizontal;

          const glbPath = `/models/${el.glb_file}`;
          const reasonList = p.reasons?.[el.type] || [];
          const mappedItem = {
            id: el.oid,
            name: el.name || 'Unnamed Furniture',
            glbPath: glbPath,
            position: [x, 0, y],
            rotation: [0, isHorizon ? Math.PI / 2 : 0, 0],
            scale: [1, 1, 1],
            originalDimensions: el.dimensions,
            type: el.type,
            rawPlacement: el,
            reasons: reasonList
          };
          console.log(`[RoomVisualizer] Successfully mapped item ${index} (oid: ${el.oid}) to:`, JSON.stringify(mappedItem));
          return mappedItem;
        }).filter(item => item !== null);
          const decoSet = recommendationResult?.recommendedSet?.decorationSet || {};
          const decoItems = ['bedding', 'mattress_cover', 'curtain'].flatMap((type) => {
            const item = decoSet[type];
            if (!item) return [];

            return [{
              id: item.oid || item._id || `${type}-placeholder`,
              name: item.name || `추천 ${type}`,
              glbPath: `/models/${item.glb_file}`,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              originalDimensions: item.dimensions || {},
              type,
              rawPlacement: item,
              reasons: [`추천된 ${type}`]
            }];
          });
        console.log('[RoomVisualizer] After map and filter, newRecommendedFurniture (before setting state):', JSON.stringify(newRecommendedFurniture));
        const finalRecommendations = [...newRecommendedFurniture, ...decoItems];
        setRecommendedFurnitureForRender(finalRecommendations);
        console.log('추천된 가구 목록 (최종 렌더링용 RoomVisualizer):', finalRecommendations); 

        if (newRecommendedFurniture.length > 0) {
          handleClearScene();

          const roomWidthM = roomSize.width * CM_TO_M;
          const roomDepthM = roomSize.depth * CM_TO_M;

          for (const itemToRender of newRecommendedFurniture) {
            console.log('[RoomVisualizer] Attempting to load and place model for:', itemToRender.name, itemToRender);
            const model = await loadFurnitureModel(itemToRender.id, itemToRender.glbPath, itemToRender.originalDimensions, itemToRender.rawPlacement._id);

            if (model) {
              const backendX = itemToRender.position[0];
              const backendZ = itemToRender.position[2];
              
              let footprintWidthCm, footprintDepthCm;
              if (itemToRender.rawPlacement.isHorizon || itemToRender.rawPlacement.isHorizontal) {
                footprintWidthCm = itemToRender.originalDimensions.depth;
                footprintDepthCm = itemToRender.originalDimensions.width;
              } else {
                footprintWidthCm = itemToRender.originalDimensions.width;
                footprintDepthCm = itemToRender.originalDimensions.depth;
              }

              const furnitureFootprintWidthM = footprintWidthCm * CM_TO_M;
              const furnitureFootprintDepthM = footprintDepthCm * CM_TO_M;

              // Backend returns top-left corner coordinates, convert to Three.js center coordinates
              // Backend (0,0) = room top-left, Three.js (0,0) = room center
              const xPos = -(roomWidthM / 2) + (backendX * CM_TO_M) + (furnitureFootprintWidthM / 2);
              const yPos = 0;
              const zPos = (roomDepthM / 2) - (backendZ * CM_TO_M) - (furnitureFootprintDepthM / 2);
              
              model.position.set(xPos, yPos, zPos);
              model.rotation.fromArray(itemToRender.rotation);
              // model.scale.fromArray(itemToRender.scale); // Scale is default [1,1,1]

              // sceneRef.current.add(model);
              console.log(`[RoomVisualizer] Placed ${itemToRender.name} at scene coords: x=${xPos.toFixed(2)}, y=${yPos.toFixed(2)}, z=${zPos.toFixed(2)}`);
            } else {
              console.warn(`[RoomVisualizer] Failed to load model for ${itemToRender.name}`);
            }
          }
        }

      } else {
        console.log('렌더링할 추천 가구가 없습니다 (RoomVisualizer). Original response was:', recommendationResult); 
        setRecommendedFurnitureForRender([]);
      }

    } catch (error) {
      console.error('가구 추천 및 직접 배치 오류 (RoomVisualizer):', error);
      alert('가구 추천 및 배치 중 오류가 발생했습니다 (RoomVisualizer): ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsRecommending(false);
    }
  };

  // handleFurnitureRecommendation 함수는 이 흐름에서 더 이상 직접 사용되지 않음.
  // 필요하다면 다른 용도로 남겨두거나, 내부 로직을 재활용할 수 있도록 수정.
  const handleFurnitureRecommendation = async (furnitureListToPlace) => {
    try {
      console.log('(미사용 예상) 가구 배치 시작 (handleFurnitureRecommendation):', furnitureListToPlace);
      
      if (!furnitureListToPlace || furnitureListToPlace.length === 0) {
        console.warn("(미사용 예상) No furniture to place. Skipping placement call.");
        // setPlacedFurniture([]); // 이 함수가 호출된다면 상태를 어떻게 할지 결정 필요
        return;
      }
      
      // 이 함수가 호출된다면, /api/furniture/auto-placement를 호출하는 기존 로직을 실행할지 결정해야 함.
      // 현재 요구사항은 이 API를 호출하지 않는 것이므로, 아래 로직은 주석 처리하거나 삭제.
      /*
      const placementsResponse = await placeFurniture(furnitureListToPlace);
      console.log('(미사용 예상) 배치 API 응답:', placementsResponse);
      
      const placements = placementsResponse?.placedItems || [];
      
      if (!placements || placements.length === 0) {
        console.warn("(미사용 예상) 가구 배치 결과가 없거나 실패했습니다.");
        return;
      }
      
      setPlacedFurniture(placements); // 이 함수가 사용된다면 상태 업데이트
      
      // ... (이하 3D 렌더링 로직도 이 함수가 호출될 때 실행될지 결정) ...
      */
     console.warn("handleFurnitureRecommendation 함수가 호출되었으나, 현재 추천 흐름에서는 사용되지 않을 것으로 예상됩니다. 확인 필요.");
    } catch (error) {
      console.error('(미사용 예상) 가구 배치 중 오류 발생:', error);
      alert('(미사용 예상) 가구 배치 중 오류가 발생했습니다.');
    }
  };

  // placeFurniture 함수 (/api/furniture/auto-placement 호출)도 이 흐름에서 직접 사용되지 않음.
  // 다른 기능에서 필요하다면 유지.
  const placeFurniture = async (furnitureList) => {
    console.warn("placeFurniture 함수가 호출되었으나, 현재 추천 흐름에서는 /api/furniture/auto-placement를 호출하지 않도록 변경되었습니다. 확인 필요.");
    // 현재 로직에서는 이 함수를 통해 서버 API를 호출하지 않으므로,
    // 만약 호출된다면 에러를 발생시키거나, 빈 결과를 반환하도록 처리할 수 있음.
    // throw new Error("placeFurniture is not intended to be called in the current recommendation flow.");
    return { placedItems: furnitureList, summary: "Placement API not called, using client-side data." };
    /*
    try {
        // --- MODIFIED API CALL ---
        const response = await fetch('http://localhost:3001/api/furniture/auto-placement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                furniture: furnitureList, 
                roomDimensions: {         
                    width: roomSize.width,
                    depth: roomSize.depth,
                    height: roomSize.height || 240 
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text(); 
            console.error('Placement API error response:', errorData);
            throw new Error('가구 배치 요청 실패: ' + response.status + ' ' + response.statusText);
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('가구 배치 중 오류 발생:', error);
        throw error;
    }
    */
  };

  const handleClearScene = () => {
    // 모든 가구 모델을 씬에서 제거
    Object.values(furnitureModelsRef.current).forEach(modelData => {
      if (modelData && modelData.model && sceneRef.current) {
        sceneRef.current.remove(modelData.model);
      }
    });
    furnitureModelsRef.current = {};
    setSelectedItems([]);
  };

  const handleSelectFurniture = async (furnitureItem) => {
    try {
      console.log('Selected furniture:', furnitureItem);
      const modelPath = furnitureItem.modelPath || furnitureItem.glb_file || `${furnitureItem._id}.glb`;
      const model = await loadFurnitureModel(furnitureItem._id, modelPath, furnitureItem.dimensions, furnitureItem._id);
      
      if (model) {
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        
        if (!sceneRef.current.children.includes(model)) {
          sceneRef.current.add(model);
        }
      }
    } catch (error) {
      console.error('Failed to load selected furniture:', error);
    }
  };

  const handleSavePlacement = async () => {
    try {
      // Get placement name from user
      const name = prompt('배치 이름을 입력하세요:', '새 배치');
      if (!name) {
        console.log('배치 저장이 취소되었습니다.');
        return;
      }

      const placement = {
        name,
        furniture: Object.entries(furnitureModelsRef.current).map(([lookupKey, modelData]) => {
          if (!modelData || !modelData.dbId) {
            console.error(`Missing modelData or dbId for key ${lookupKey}, skipping item:`, modelData);
            return null; // dbId가 없으면 이 항목을 건너뜀
          }
          return {
            furnitureId: modelData.dbId, // 저장된 데이터베이스 ID 사용
            position: modelData.model.position.toArray(),
            rotation: modelData.model.quaternion.toArray(),
            scale: modelData.model.scale.toArray()
          };
        }).filter(item => item !== null)
      };

      if (placement.furniture.some(f => !f.furnitureId)) {
        console.error('Attempting to save placement with invalid furnitureId:', placement);
        alert('오류: 유효하지 않은 가구 ID로 저장을 시도했습니다. 콘솔을 확인하세요.');
        return;
      }

      console.log('Saving placement:', placement);
      await savePlacement(placement);
      await loadSavedPlacements(); // Refresh the list
    } catch (error) {
      console.error('Failed to save placement:', error);
      alert('배치 저장에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadSavedPlacements = async () => {
    setIsLoadingPlacements(true);
    try {
      const placements = await getPlacements();
      setSavedPlacements(placements);
    } catch (error) {
      console.error('Failed to load placements:', error);
    } finally {
      setIsLoadingPlacements(false);
    }
  };

  // Load furniture model
  const loadFurnitureModel = async (lookupId, modelPath, furnitureDimensions, dbId) => {
    try {
      console.log(`Loading furniture model ${lookupId} (DB ID: ${dbId}) from path:`, modelPath);
      
      if (!modelPath) {
        console.error(`No model path provided for furniture ${lookupId}`);
        return null;
      }
      if (!dbId) {
        console.error(`No dbId provided for furniture ${lookupId}`);
        const mainListItem = furniture.find(f => f.oid === lookupId);
        if (mainListItem && mainListItem._id) {
          dbId = mainListItem._id;
          console.warn(`Using dbId ${dbId} found from main list for lookupId ${lookupId}`);
        } else {
          console.error(`Cannot resolve dbId for ${lookupId}. Fallback might be incorrect.`);
          // return createFallbackModel(lookupId, lookupId, furnitureDimensions, 'unknown'); // Potentially problematic
        }
      }

      if (!furnitureDimensions || !furnitureDimensions.width || !furnitureDimensions.height || !furnitureDimensions.depth) {
        console.warn(`Valid dimensions (W,D,H) not provided for furniture ${lookupId} to loadFurnitureModel. Attempting fallback.`);
        const itemFromList = furniture.find(f => f.oid === lookupId || f._id === lookupId);
        if (itemFromList && itemFromList.dimensions) {
          console.warn(`Using dimensions from main list for ${lookupId} for loadFurnitureModel.`);
          furnitureDimensions = itemFromList.dimensions;
        } else {
          console.error(`Cannot find dimensions for ${lookupId} even in main list. Creating fallback box.`);
          return createFallbackModel(lookupId, dbId || lookupId, { width: 100, height: 100, depth: 100 },'unknown');
        }
      }

      // 모델 경로 처리
      let finalModelPath = modelPath;
      if (!finalModelPath.startsWith('/models/')) {
        finalModelPath = '/models/' + finalModelPath.replace(/^\/+/, '');
      }
      
      // 카테고리 경로 추가
      const furnitureItem = dbId ? furniture.find(item => item._id === dbId) : furniture.find(item => item.oid === lookupId);
      if (furnitureItem?.category && !finalModelPath.includes(`/${furnitureItem.category}/`)) {
        finalModelPath = finalModelPath.replace('/models/', `/models/${furnitureItem.category}/`);
      }
      
      // 로컬 서버 URL 추가
      if (!finalModelPath.startsWith('http')) {
        finalModelPath = `http://localhost:3001${finalModelPath}`;
      }

      console.log('Final model path:', finalModelPath);

      // 모델 파일 존재 여부 확인
      const response = await fetch(finalModelPath, { 
        method: 'HEAD',
        headers: { 'Accept': 'model/gltf-binary' }
      });
      
      if (!response.ok) {
        console.error(`Model file not found: ${finalModelPath} (${response.status})`);
        // throw new Error(`Model file not found: ${finalModelPath}`);
        const categoryForFallback = furnitureItem?.category || 'unknown';
        return createFallbackModel(lookupId, dbId || lookupId, furnitureDimensions, categoryForFallback);
      }

      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      return new Promise((resolve, reject) => {
        loader.load(
          finalModelPath,
          (gltf) => {
            const rawModel = gltf.scene;
            rawModel.traverse((node) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });

            // 1. rawModel을 furnitureDimensions(가구의 실제 W,D,H)에 맞게 스케일 조정
            const intrinsicModelBox = new THREE.Box3().setFromObject(rawModel);
            const intrinsicModelSize = intrinsicModelBox.getSize(new THREE.Vector3());

            const targetWidthM = furnitureDimensions.width * CM_TO_M;
            const targetHeightM = furnitureDimensions.height * CM_TO_M; // 이 값이 모델의 3D 높이
            const targetDepthM = furnitureDimensions.depth * CM_TO_M;

            const scaleX = intrinsicModelSize.x === 0 ? 1 : targetWidthM / intrinsicModelSize.x;
            const scaleY = intrinsicModelSize.y === 0 ? 1 : targetHeightM / intrinsicModelSize.y;
            const scaleZ = intrinsicModelSize.z === 0 ? 1 : targetDepthM / intrinsicModelSize.z;
            rawModel.scale.set(scaleX, scaleY, scaleZ);

            // 2. (스케일 조정된) rawModel을 새로운 Group의 중심에 재배치
            const scaledModelBox = new THREE.Box3().setFromObject(rawModel);
            const scaledModelCenter = scaledModelBox.getCenter(new THREE.Vector3());

            const wrapperGroup = new THREE.Group();
            wrapperGroup.add(rawModel);
            
            // rawModel의 XZ 중심이 그룹의 (0,0)에 오고, Y의 바닥이 그룹의 Y=0에 오도록 위치 조정
            rawModel.position.set(
              -scaledModelCenter.x,
              -scaledModelBox.min.y, // 모델의 최하단이 그룹의 y=0에 오도록 보정
              -scaledModelCenter.z
            );
            
            furnitureModelsRef.current[lookupId] = { model: wrapperGroup, dbId: dbId };
            if (sceneRef.current) {
              sceneRef.current.add(wrapperGroup);
            }

            console.log(`Successfully loaded and processed model for furniture ${lookupId}`);
            resolve(wrapperGroup); // 모델 로드 성공 시 wrapperGroup 반환
          },
          (xhr) => {
            if (xhr.lengthComputable) {
              const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
              console.log(`Loading progress: ${percentComplete}% - ${lookupId}`);
            }
          },
          (error) => {
            console.error(`Failed to load model for furniture ${lookupId}:`, error);
            const categoryForFallback = furnitureItem?.category || 'unknown';
            const fallback = createFallbackModel(lookupId, dbId || lookupId, furnitureDimensions, categoryForFallback);
            resolve(fallback);
          }
        );
      });
    } catch (error) {
      console.error(`Error loading furniture model ${lookupId}:`, error);
      const furnitureItemForFallback = dbId ? furniture.find(item => item._id === dbId) : furniture.find(item => item.oid === lookupId);
      const categoryForFallback = furnitureItemForFallback?.category || 'unknown';
      const fallback = createFallbackModel(lookupId, dbId || lookupId, furnitureDimensions, categoryForFallback);
      return fallback;
    }
  };

  const createFallbackModel = (lookupId, dbId, dimensions, category) => {
    if (!sceneRef.current) return null;

    console.log(`Creating fallback model for lookupId: ${lookupId}, dbId: ${dbId}`);
    
    const width = dimensions?.width * CM_TO_M || 1;
    const height = dimensions?.height * CM_TO_M || 1;
    const depth = dimensions?.depth * CM_TO_M || 1;
    
    // Category-based color
    let color = 0x888888; // Default color
    switch (category) {
      case 'bed': color = 0x90caf9; break;
      case 'desk': color = 0xa5d6a7; break;
      case 'wardrobe': case 'closet': color = 0xffcc80; break;
      case 'bookshelf': color = 0xce93d8; break;
      default: console.warn(`Unknown category for fallback color: ${category}`);
    }
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7,
    });
    
    const boxModel = new THREE.Mesh(geometry, material);
    const modelGroup = new THREE.Group();
    modelGroup.add(boxModel);
    
    modelGroup.userData = { 
      isFurniture: true,
      furnitureId: dbId, // 실제 데이터베이스 ID 저장
      furnitureName: `Fallback ${lookupId}`,
      furnitureCategory: category,
      isFallback: true
    };
    
    modelGroup.name = `furniture-fallback-${lookupId}`;
    // Position the group so the box's base is at y=0
    // BoxGeometry는 중앙에 있으므로, 박스의 절반 높이만큼 위로 이동
    modelGroup.position.set(0, height / 2, 0); 
    
    if (sceneRef.current) {
      sceneRef.current.add(modelGroup);
    }
    
    furnitureModelsRef.current[lookupId] = { model: modelGroup, dbId: dbId }; 
    
    return modelGroup;
  };

  // Load all furniture models
  const loadAllFurnitureModels = async (furnitureList) => {
    console.log('Loading furniture models for:', furnitureList);
    
    for (const item of furnitureList) {
      if (!furnitureModelsRef.current[item._id]) {
        const modelPath = item.modelPath || item.glb_file || `${item._id}.glb`;
        console.log(`Loading model for furniture ${item._id} with path:`, modelPath);
        await loadFurnitureModel(item._id, modelPath, item.dimensions, item._id);
      }
    }
  };

  const handleLoadPlacement = async (placementId) => {
    try {
      console.log('Loading placement:', placementId);
      
      // placementId가 이미 배치 객체라면 바로 사용
      const placement = typeof placementId === 'object' ? placementId : null;
      
      // placement 객체가 아니면, 배치 목록을 불러옴
      const placements = placement ? null : await getPlacements(placementId);
      console.log('Loaded placement data:', placements);
      
      // 최종 배치 객체를 얻음
      const finalPlacement = placement || (Array.isArray(placements) 
        ? placements.find(p => p._id === placementId)
        : placements);

      if (!finalPlacement) {
        console.error('Placement not found:', placementId);
        return;
      }

      console.log('Selected placement:', finalPlacement);

      if (!finalPlacement.furniture || !Array.isArray(finalPlacement.furniture)) {
        console.error('Invalid placement furniture data:', finalPlacement);
        return;
      }

      // 기존 가구를 먼저 모두 제거
      handleClearScene();

      // 모든 가구 모델을 먼저 로드
      const furnitureIds = finalPlacement.furniture.map(item => item.furnitureId);
      console.log('Furniture IDs to load:', furnitureIds);
      
      const furnitureToLoad = furniture.filter(item => furnitureIds.includes(item._id));
      console.log('Furniture to load:', furnitureToLoad);
      
      // 모든 모델을 로드하고 완료될 때까지 대기
      const loadedModels = await Promise.all(
        furnitureToLoad.map(async (item) => {
          const modelPath = item.modelPath || item.glb_file || `${item._id}.glb`;
          console.log(`Loading model for furniture ${item._id} with path:`, modelPath);
          const model = await loadFurnitureModel(item._id, modelPath, item.dimensions, item._id);
          return { id: item._id, model };
        })
      );

      // 쉽게 접근할 수 있도록 모델 맵 생성
      const modelMap = new Map(loadedModels.map(({ id, model }) => [id, model]));
      
      // 배치에서 각 가구 아이템을 로드
      for (const item of finalPlacement.furniture) {
        if (!item || !item.furnitureId) {
          console.warn('Invalid furniture item:', item);
          continue;
        }

        console.log('Processing furniture item from saved placement:', JSON.stringify(item)); // 상세 로그

        const model = modelMap.get(item.furnitureId);
        if (model) {
          // 위치 적용
          if (item.position) {
            console.log(`Applying position to ${item.furnitureId}:`, JSON.stringify(item.position)); // 상세 로그
            const pos = item.position;
            // position이 배열인지 객체인지 확인
            if (Array.isArray(pos)) {
              model.position.fromArray(pos);
            } else {
              model.position.set(
                pos.x,
                pos.y,
                pos.z
              );
            }
            console.log('Applied position:', model.position);
          }

          // 회전 적용
          if (item.rotation) {
            console.log(`Applying rotation to ${item.furnitureId}:`, JSON.stringify(item.rotation)); // 상세 로그
            const rot = item.rotation;
            // rotation이 배열인지 객체인지 확인
            if (Array.isArray(rot)) {
              model.quaternion.fromArray(rot);
            } else {
              model.quaternion.set(rot.x || 0, rot.y || 0, rot.z || 0, rot.w !== undefined ? rot.w : 1);
            }
            console.log('Applied rotation (quaternion):', model.quaternion);
          }

          // 스케일 적용
          if (item.scale) {
            console.log(`Applying scale to ${item.furnitureId}:`, JSON.stringify(item.scale)); // 상세 로그
            const scaleVal = item.scale; // model.scale과 충돌 방지 위해 이름 변경
            // scale이 배열인지 객체인지 확인
            if (Array.isArray(scaleVal)) {
              model.scale.fromArray(scaleVal);
            } else {
              model.scale.set(scaleVal.x, scaleVal.y, scaleVal.z);
            }
            console.log('Applied scale:', model.scale);
          }

          // 씬에 추가 (이미 추가되어 있지 않다면)
          if (!sceneRef.current.children.includes(model)) {
            sceneRef.current.add(model);
          }

          // 최종 변환 로그
          console.log('Final transform for', item.furnitureId, {
            position: model.position.toArray(),
            rotation: model.rotation.toArray(),
            scale: model.scale.toArray()
          });
        } else {
          console.warn(`Model not found for furniture ID: ${item.furnitureId}`);
        }
      }
    } catch (error) {
      console.error('Failed to load placement:', error);
    }
  };

  // direction(동/서/남/북) → x, y 변환 함수
  function convertWallToXY(direction, width, height, roomWidth, roomHeight, offset = 0) {
    if (direction === "west" || direction === "서") {
      return { x: 0, y: offset, width, height };
    }
    if (direction === "east" || direction === "동") {
      return { x: roomWidth - width, y: offset, width, height };
    }
    if (direction === "north" || direction === "북") {
      return { x: offset, y: 0, width, height };
    }
    if (direction === "south" || direction === "남") {
      return { x: offset, y: roomHeight - height, width, height };
    }
    return { x: 0, y: 0, width, height };
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '500px',
      maxHeight: 'calc(100vh - 180px)',
      display: 'flex',
      overflow: 'hidden',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      {/* 왼쪽 영역 - 가구 목록 */}
      <div style={{ width: '20%', minWidth: '100px', background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
        {loading ? (
          <div className="p-4">Loading furniture...</div>
        ) : (
          <FurnitureList
            furniture={furniture}
            filteredFurniture={filteredFurniture}
            selectedItems={selectedItems}
            isRecommending={isRecommending}
            onSearch={() => {}}
            onRecommendFurniture={handleRecommendFurniture}
            onClearScene={handleClearScene}
            onSelectFurniture={handleSelectFurniture}
          />
        )}
      </div>
      {/* 중앙 영역 - 3D 캔버스 */}
      <div ref={centerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
        <ResizableBox
          width={canvasWidth}
          height={canvasHeight}
          minConstraints={[300, 200]}
          maxConstraints={[700, 500]}
          onResize={(e, data) => {
            setCanvasWidth(data.size.width);
            setCanvasHeight(data.size.height);
          }}
          resizeHandles={['se']}
          handle={
            <div
              className="custom-handle"
              style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                right: '-10px',
                bottom: '-10px',
                cursor: 'se-resize',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '50%',
                zIndex: 10
              }}
            />
          }
        >
          <div
            ref={mountRef}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              boxShadow: '0 0 10px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* 도움말/드래그/로딩 표시 등 UI */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-2 rounded-md shadow text-sm">
              <p>가구를 <strong>더블 클릭</strong>한 후 드래그하여 이동할 수 있습니다.</p>
            </div>
            {isDragging && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md">
                드래그 중...
              </div>
            )}
            {isAutoplacing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white p-4 rounded-md shadow-lg">
                  <p className="text-lg font-bold">가구 배치 중...</p>
                  <p className="text-sm mt-2">최적의 위치를 계산하고 있습니다.</p>
                </div>
              </div>
            )}
            {/* 자동 배치 및 추천 버튼들 */}
            <div className="space-y-2 p-1">
              <h3 className="text-sm font-semibold border-b pb-1 mb-2">가구 추천/배치 옵션</h3>

              {/* Budget Input */}
              <div className="mb-2">
                <label htmlFor="budget" className="block text-xs font-medium text-gray-700 mb-1">총 예산 (원):</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="예: 800000"
                  className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Point Color Input */}
              <div className="mb-2">
                <label htmlFor="pointColor" className="block text-xs font-medium text-gray-700 mb-1">포인트 색상:</label>
                <input
                  type="text"
                  id="pointColor"
                  name="pointColor"
                  value={pointColor}
                  onChange={(e) => setPointColor(e.target.value)}
                  placeholder="예: beige, black, white"
                  className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                />
              </div>

              <button
                onClick={handleRecommendFurniture}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                가구 추천
              </button>
            </div>
          </div>
        </ResizableBox>
      </div>
      {/* 오른쪽 영역 - 저장/불러오기 */}
      <div style={{ width: '20%', minWidth: '100px', background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
        <div style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e5e5e5', 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>안녕하세요, {username || '사용자'}님</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        </div>
        <SaveLoadPanel
          isLoadingPlacements={isLoadingPlacements}
          savedPlacements={savedPlacements}
          onSavePlacement={handleSavePlacement}
          onLoadPlacements={loadSavedPlacements}
          onLoadPlacement={handleLoadPlacement}
          onResetCamera={resetCameraPosition}
          onTopDownView={setTopDownView}
          onEastView={setEastView}
          onWestView={setWestView}
          onSouthView={setSouthView}
          onNorthView={setNorthView}
          onRotateCamera={rotateToNextDirection}
          isRotating={isRotating}
          onToggleOrbit={toggleCameraOrbit}
          isOrbiting={isOrbiting}
        />
        {recommendedFurnitureForRender.length > 0 && (
  <div style={{
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.85rem'
  }}>
    <strong>현재 인테리어 스타일:</strong><br />
    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
      {styleNameMap[currentStyle] || '알 수 없음'}
    </span><br />
    <span style={{ fontSize: '0.8rem', color: '#555' }}>
      {styleDescriptions[currentStyle] || '스타일 설명을 불러올 수 없습니다.'}
    </span>

    <hr style={{ margin: '10px 0' }} />

    {/* 추천 가구 구역 */}
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>🪑 추천된 가구 배치</h4>
      {recommendedFurnitureForRender.filter(item => !['bedding', 'mattress_cover', 'curtain'].includes(item.type))
        .map((item, idx) => (
        <div key={idx} style={{
          marginBottom: '0.75rem',
          padding: '0.6rem 0.8rem',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '6px'
        }}>
          <strong>{item.name}</strong> <span style={{ fontSize: '0.75rem', color: '#888' }}>({item.type})</span><br />
          💰 <strong>{item.rawPlacement?.price?.toLocaleString() || 0}</strong> 원<br />

          {item.rawPlacement?.url && (
            <div style={{ marginTop: '0.5rem' }}>
              🔗 <a
                href={item.rawPlacement.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                제품 보러가기
              </a>
            </div>
          )}

          {/* 배치 원칙 */}
          {item.reasons?.length > 0 && (
            <>
              <div style={{ marginTop: '0.4rem' }}><strong>📌 배치 원칙:</strong></div>
              <ul style={{ paddingLeft: '1.2rem' }}>
                {item.reasons.map((r, i) => (
                  <li key={i} style={{ fontSize: '0.8rem' }}>✅ {r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>

    {/* 데코레이션 구역 */}
    <div style={{ marginTop: '2rem' }}>
      <h4 style={{ marginBottom: '0.5rem' }}>🛏️ 데코레이션 세트</h4>
      {recommendedFurnitureForRender.filter(item => ['bedding', 'mattress_cover', 'curtain'].includes(item.type))
        .map((item, idx) => (
        <div key={idx} style={{
          marginBottom: '0.75rem',
          padding: '0.6rem 0.8rem',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '6px'
        }}>
          <strong>{item.name}</strong> <span style={{ fontSize: '0.75rem', color: '#888' }}>({item.type})</span><br />
          💰 <strong>{item.rawPlacement?.price?.toLocaleString() || 0}</strong> 원<br />
          {item.rawPlacement?.url && (
            <div style={{ marginTop: '0.5rem' }}>
              🔗 <a
                href={item.rawPlacement.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                제품 보러가기
              </a>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* 총 가격 표시 */}
    <div style={{
      marginTop: '1rem',
      fontWeight: 'bold',
      textAlign: 'right',
      color: '#333'
    }}>
      총 가격: {
        recommendedFurnitureForRender.reduce((sum, item) => sum + (item.rawPlacement?.price || 0), 0).toLocaleString()
      } 원
    </div>
  </div>
)}


      </div>
    </div>
  );
};

export default RoomVisualizer;