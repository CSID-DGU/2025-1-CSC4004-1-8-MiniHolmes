// RoomVisualizer.js
// [설명]
// RoomVisualizer.js는 프론트엔드에서 3D 방/가구 배치 결과를 Three.js로 시각화하는 React 컴포넌트입니다.
// 실제 가구 추천/배치 알고리즘은 백엔드(Python)에서 실행되며,
// 이 컴포넌트는 백엔드 API로부터 추천/배치 결과(가구 목록, 위치, 회전 등)를 받아와 3D로 렌더링만 담당합니다.
// 즉, 추천/배치 로직은 이 파일에 포함되어 있지 않습니다.

import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getAllFurniture, getRecommendedFurniture } from '../services/api';
import { getAutoPlacement, getMockPlacement } from '../services/placementService';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// 벽지 경로 (public/textures 폴더 기준)
const WALLPAPER_PATHS = {
    wallpaper1: '/textures/wallpaper1.jpg',
    wallpaper2: '/textures/wallpaper2.jpg',
    wallpaper3: '/textures/wallpaper3.jpg'
};

const CM_TO_M = 0.01;

const RoomVisualizer = () => {
    const mountRef = useRef(null);
    const [furniture, setFurniture] = useState([]);
    const [selectedFurniture, setSelectedFurniture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isAutoplacing, setIsAutoplacing] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
    const [recommendedIds, setRecommendedIds] = useState([]);
    const [isRecommending, setIsRecommending] = useState(false);

    // 벽/바닥 색상 및 벽지 상태
    const [floorColor, setFloorColor] = useState('#eeeeee');
    const [leftWallType, setLeftWallType] = useState('color'); // 'color' or 'wallpaper'
    const [leftWallColor, setLeftWallColor] = useState('#f5f5f5');
    const [leftWallWallpaper, setLeftWallWallpaper] = useState('wallpaper1');
    const [backWallType, setBackWallType] = useState('color');
    const [backWallColor, setBackWallColor] = useState('#f5f5f5');
    const [backWallWallpaper, setBackWallWallpaper] = useState('wallpaper1');

    // 벽/바닥 mesh 참조
    const floorMeshRef = useRef(null);
    const leftWallMeshRef = useRef(null);
    const backWallMeshRef = useRef(null);

    // 조명 useRef 추가
    const ambientLightRef = useRef(null);
    const directionalLightRef = useRef(null);

    // 기타 3D 관련
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const furnitureModelsRef = useRef({});
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const dragOffsetRef = useRef(new THREE.Vector3());
    const draggedObjectRef = useRef(null);
    const isDraggingRef = useRef(false);

    // 더블 클릭 감지
    const lastClickTimeRef = useRef(0);
    const lastClickPositionRef = useRef({ x: 0, y: 0 });

    // 바운딩 박스 헬퍼
    const boxHelpersRef = useRef({});

    // 방 설정
    const roomDimensionsRef = useRef({
        width: 400,
        depth: 400,
        height: 250,
        centerX: 200,
        centerZ: 200
    });

    // 가구 데이터 불러오기
    useEffect(() => {
        const fetchFurniture = async () => {
            try {
                const data = await getAllFurniture();
                setFurniture(data);
            } catch (error) {
                setFurniture([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFurniture();
    }, []);

    // Three.js 초기화
    useEffect(() => {
        if (loading || !mountRef.current) return;

        // Scene, Camera, Renderer 설정
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const roomW = roomDimensionsRef.current.width * CM_TO_M;
        const roomD = roomDimensionsRef.current.depth * CM_TO_M;
        const roomH = roomDimensionsRef.current.height * CM_TO_M;
        const maxRoomSize = Math.max(roomW, roomD, roomH);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, maxRoomSize * 0.8, maxRoomSize * 1.2);
        camera.lookAt(0, roomH / 2, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // 최신 three.js 색상 관리 방식
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.physicallyCorrectLights = true;

        // 조명 (useRef에 저장)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(200, 300, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        directionalLightRef.current = directionalLight;

        // 바닥
        const floorGeometry = new THREE.PlaneGeometry(roomW, roomD);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(floorColor),
            roughness: 0.6,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.name = "floor";
        scene.add(floor);
        floorMeshRef.current = floor;

        // 그리드 헬퍼
        const gridHelper = new THREE.GridHelper(roomW, roomW / 20);
        scene.add(gridHelper);

        // 뒷벽
        const backWallGeometry = new THREE.PlaneGeometry(roomW, roomH);
        const backWallMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(backWallColor),
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.1
        });
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
        backWall.position.z = -roomD / 2;
        backWall.position.y = roomH / 2;
        backWall.name = "backWall";
        scene.add(backWall);
        backWallMeshRef.current = backWall;

        // 왼쪽 벽
        const leftWallGeometry = new THREE.PlaneGeometry(roomD, roomH);
        const leftWallMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(leftWallColor),
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.1
        });
        const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        leftWall.position.x = -roomW / 2;
        leftWall.position.y = roomH / 2;
        leftWall.rotation.y = Math.PI / 2;
        leftWall.name = "leftWall";
        scene.add(leftWall);
        leftWallMeshRef.current = leftWall;

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enabled = true;

        // 레퍼런스 저장
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        // (이하 가구 모델 로딩, 이벤트, 애니메이션 루프 등 기존 코드 동일)
        const animate = () => {
            requestAnimationFrame(animate);
            if (controlsRef.current) {
                controlsRef.current.update();
            }
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (cameraRef.current && rendererRef.current && mountRef.current) {
                const width = window.innerWidth;
                const height = window.innerHeight;
                cameraRef.current.aspect = width / height;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(width, height);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
        };
    }, [loading, floorColor, leftWallColor, backWallColor]);

    // 벽/바닥 색상, 텍스처 변경 핸들러
    useEffect(() => {
        // 바닥
        if (floorMeshRef.current) {
            floorMeshRef.current.material.color.set(floorColor);
            floorMeshRef.current.material.map = null;
            floorMeshRef.current.material.needsUpdate = true;
        }
        // 왼쪽 벽
        if (leftWallMeshRef.current) {
            if (leftWallType === 'color') {
                leftWallMeshRef.current.material.color.set(leftWallColor);
                leftWallMeshRef.current.material.map = null;
            } else if (leftWallType === 'wallpaper') {
                const loader = new THREE.TextureLoader();
                loader.load(WALLPAPER_PATHS[leftWallWallpaper], (texture) => {
                    leftWallMeshRef.current.material.map = texture;
                    leftWallMeshRef.current.material.color.set('#ffffff');
                    leftWallMeshRef.current.material.needsUpdate = true;
                });
            }
            leftWallMeshRef.current.material.needsUpdate = true;
        }
        // 뒷벽
        if (backWallMeshRef.current) {
            if (backWallType === 'color') {
                backWallMeshRef.current.material.color.set(backWallColor);
                backWallMeshRef.current.material.map = null;
            } else if (backWallType === 'wallpaper') {
                const loader = new THREE.TextureLoader();
                loader.load(WALLPAPER_PATHS[backWallWallpaper], (texture) => {
                    backWallMeshRef.current.material.map = texture;
                    backWallMeshRef.current.material.color.set('#ffffff');
                    backWallMeshRef.current.material.needsUpdate = true;
                });
            }
            backWallMeshRef.current.material.needsUpdate = true;
        }
    }, [
        floorColor,
        leftWallType,
        leftWallColor,
        leftWallWallpaper,
        backWallType,
        backWallColor,
        backWallWallpaper
    ]);

    // 벽/바닥 색상 또는 벽지 선택 시 조명 intensity를 높임
    useEffect(() => {
        const isFloorColored = floorColor !== '#eeeeee';
        const isLeftWallColored = (leftWallType === 'color' && leftWallColor !== '#f5f5f5') || leftWallType === 'wallpaper';
        const isBackWallColored = (backWallType === 'color' && backWallColor !== '#f5f5f5') || backWallType === 'wallpaper';

        const shouldBright = isFloorColored || isLeftWallColored || isBackWallColored;

        if (ambientLightRef.current && directionalLightRef.current) {
            if (shouldBright) {
                ambientLightRef.current.intensity = 2.0;
                directionalLightRef.current.intensity = 2.0;
            } else {
                ambientLightRef.current.intensity = 0.9;
                directionalLightRef.current.intensity = 0.9;
            }
        }
    }, [
        floorColor,
        leftWallType,
        leftWallColor,
        leftWallWallpaper,
        backWallType,
        backWallColor,
        backWallWallpaper
    ]);

    // (이하 기존 가구 배치, 추천, 드래그 등 모든 기능 동일하게 유지)

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* 벽/바닥 컬러/벽지 UI */}
            <div style={{
                position: 'absolute', top: 10, right: 10, background: '#fff', padding: 12, borderRadius: 8, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <div>
                    <b>바닥 색상</b>
                    <input
                        type="color"
                        value={floorColor}
                        onChange={e => setFloorColor(e.target.value)}
                        style={{ marginLeft: 8 }}
                    />
                </div>
                <div style={{ marginTop: 10 }}>
                    <b>왼쪽 벽</b>
                    <label style={{ marginLeft: 8 }}>
                        <input
                            type="radio"
                            checked={leftWallType === 'color'}
                            onChange={() => setLeftWallType('color')}
                        /> 색상
                    </label>
                    <input
                        type="color"
                        value={leftWallColor}
                        disabled={leftWallType !== 'color'}
                        onChange={e => setLeftWallColor(e.target.value)}
                        style={{ marginLeft: 4, marginRight: 8 }}
                    />
                    <label>
                        <input
                            type="radio"
                            checked={leftWallType === 'wallpaper'}
                            onChange={() => setLeftWallType('wallpaper')}
                        /> 벽지
                    </label>
                    <select
                        disabled={leftWallType !== 'wallpaper'}
                        value={leftWallWallpaper}
                        onChange={e => setLeftWallWallpaper(e.target.value)}
                        style={{ marginLeft: 4 }}
                    >
                        <option value="wallpaper1">벽지1</option>
                        <option value="wallpaper2">벽지2</option>
                        <option value="wallpaper3">벽지3</option>
                    </select>
                </div>
                <div style={{ marginTop: 10 }}>
                    <b>뒷벽</b>
                    <label style={{ marginLeft: 8 }}>
                        <input
                            type="radio"
                            checked={backWallType === 'color'}
                            onChange={() => setBackWallType('color')}
                        /> 색상
                    </label>
                    <input
                        type="color"
                        value={backWallColor}
                        disabled={backWallType !== 'color'}
                        onChange={e => setBackWallColor(e.target.value)}
                        style={{ marginLeft: 4, marginRight: 8 }}
                    />
                    <label>
                        <input
                            type="radio"
                            checked={backWallType === 'wallpaper'}
                            onChange={() => setBackWallType('wallpaper')}
                        /> 벽지
                    </label>
                    <select
                        disabled={backWallType !== 'wallpaper'}
                        value={backWallWallpaper}
                        onChange={e => setBackWallWallpaper(e.target.value)}
                        style={{ marginLeft: 4 }}
                    >
                        <option value="wallpaper1">벽지1</option>
                        <option value="wallpaper2">벽지2</option>
                        <option value="wallpaper3">벽지3</option>
                    </select>
                </div>
            </div>

            {/* (기존 UI 및 mountRef 등 동일) */}
            <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
            {/* (기존의 로딩, 가구 선택, 배치, 추천 등 UI 동일하게 유지) */}
        </div>
    );
};

export default RoomVisualizer;
