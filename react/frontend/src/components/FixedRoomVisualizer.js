import React, { useRef, useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const CM_TO_M = 0.01;
const ROOM_WIDTH = 400; // cm
const ROOM_DEPTH = 400; // cm
const ROOM_HEIGHT = 250; // cm

const FixedRoomVisualizer = () => {
  const mountRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isAutoResizing, setIsAutoResizing] = useState(true);
  const initialAspectRatio = useRef(800 / 600);
  const lastManualSize = useRef({ width: 800, height: 600 });
  
  // Three.js 관련 레퍼런스들
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const furnitureModelsRef = useRef({});
  const animationFrameRef = useRef(null);
  const containerRef = useRef(null);

  // 컨테이너 크기 측정
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        setContainerWidth(newWidth);
        
        if (isAutoResizing) {
          // 컨테이너보다 캔버스가 크면 자동 조절
          if (canvasWidth > newWidth - 40) {
            setCanvasWidth(Math.max(300, newWidth - 40));
            setCanvasHeight(Math.max(200, (newWidth - 40) / initialAspectRatio.current));
          } else if (canvasWidth < lastManualSize.current.width && newWidth - 40 > canvasWidth) {
            // 이전 수동 크기까지 자동으로 늘리기
            const newCanvasWidth = Math.min(lastManualSize.current.width, newWidth - 40);
            setCanvasWidth(newCanvasWidth);
            setCanvasHeight(newCanvasWidth / initialAspectRatio.current);
          }
        }
      }
    };

    updateContainerWidth();

    window.addEventListener('resize', updateContainerWidth);
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [canvasWidth, isAutoResizing]);

  // Three.js 초기화
  useEffect(() => {
    if (!mountRef.current) return;

    // 방 크기(m 단위)
    const roomWidth = ROOM_WIDTH * CM_TO_M;
    const roomDepth = ROOM_DEPTH * CM_TO_M;
    const roomHeight = ROOM_HEIGHT * CM_TO_M;
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
    camera.position.set(0, maxRoomSize * 0.8, maxRoomSize * 1.2);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, roomHeight / 2, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 마운트 지점에 추가 - 이 부분이 중요!
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

    // 뒷벽
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, side: THREE.DoubleSide });
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2;
    backWall.name = 'backWall';
    scene.add(backWall);

    // 왼쪽 벽
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.name = 'leftWall';
    scene.add(leftWall);

    // 그리드 헬퍼
    const gridHelper = new THREE.GridHelper(roomWidth, roomWidth / 0.2);
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

    // 테스트용 가구 추가 (간단한 박스)
    const addTestFurniture = () => {
      const geometry = new THREE.BoxGeometry(1, 0.5, 0.8);
      const material = new THREE.MeshStandardMaterial({ color: 0x2196F3 });
      const furniture = new THREE.Mesh(geometry, material);
      furniture.position.set(0, 0.25, 0);
      furniture.castShadow = true;
      furniture.receiveShadow = true;
      furniture.userData = { isFurniture: true };
      scene.add(furniture);
      
      // 가구의 바운딩 박스 시각화
      const boxHelper = new THREE.BoxHelper(furniture, 0xff0000);
      scene.add(boxHelper);
    };
    
    // 테스트 가구 추가
    addTestFurniture();

    // 애니메이션 루프
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 정리
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  // 캔버스 리사이즈 시 카메라/렌더러 갱신
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(canvasWidth, canvasHeight);
      cameraRef.current.aspect = canvasWidth / canvasHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [canvasWidth, canvasHeight]);

  // ResizableBox의 최대 크기 제한 계산
  const maxWidth = containerWidth ? containerWidth - 40 : 1000;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* 왼쪽 영역 */}
      <div style={{ width: '20%', minWidth: '100px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>왼쪽 영역</span>
      </div>
      
      {/* 중앙 영역 - Three.js 캔버스 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: '1',
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div style={{ 
          position: 'relative',
          maxWidth: '100%'
        }}>
          <ResizableBox
            width={canvasWidth}
            height={canvasHeight}
            minConstraints={[300, 200]}
            maxConstraints={[maxWidth, 800]}
            onResize={(e, data) => {
              setIsAutoResizing(false);
              setCanvasWidth(data.size.width);
              setCanvasHeight(data.size.height);
              lastManualSize.current = {
                width: data.size.width,
                height: data.size.height
              };
            }}
            onResizeStop={() => {
              setIsAutoResizing(true);
            }}
            resizeHandles={['se']}
            handle={(h, ref) => (
              <span
                className={`react-resizable-handle react-resizable-handle-${h}`}
                ref={ref}
                style={{
                  width: '20px',
                  height: '20px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '50%',
                  right: '-10px',
                  bottom: '-10px',
                  cursor: 'se-resize',
                  zIndex: 10
                }}
              />
            )}
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
            />
          </ResizableBox>
        </div>
        
        {/* 크기 정보 표시 */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          캔버스 크기: {Math.round(canvasWidth)} x {Math.round(canvasHeight)} px
        </div>
      </div>
      
      {/* 오른쪽 영역 */}
      <div style={{ width: '20%', minWidth: '100px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>오른쪽 영역</span>
      </div>
    </div>
  );
};

export default FixedRoomVisualizer;