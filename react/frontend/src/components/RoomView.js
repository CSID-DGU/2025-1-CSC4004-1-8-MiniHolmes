import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CM_TO_M = 0.01;
const ROOM_WIDTH = 400; // cm
const ROOM_DEPTH = 400; // cm
const ROOM_HEIGHT = 250; // cm

const RoomView = ({
  mountRef,
  isDragging,
  isAutoplacing,
  canvasWidth = 800,
  canvasHeight = 600,
  controlsTarget // 사용하지 않음, 내부에서 방 중심으로 고정
}) => {
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    if (!mountRef.current) return;

    // === 방 크기(m 단위) ===
    const roomWidth = ROOM_WIDTH * CM_TO_M;
    const roomDepth = ROOM_DEPTH * CM_TO_M;
    const roomHeight = ROOM_HEIGHT * CM_TO_M;
    const maxRoomSize = Math.max(roomWidth, roomDepth, roomHeight);

    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

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
    rendererRef.current = renderer;

    // mountRef에 추가
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

    // 그리드 헬퍼 (선택)
    const gridHelper = new THREE.GridHelper(roomWidth, roomWidth / 0.2);
    scene.add(gridHelper);

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 1); // m 단위
    scene.add(dirLight);

    // OrbitControls (방 중심 기준)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, roomHeight / 2, 0);
    controls.update();
    controlsRef.current = controls;

    // 애니메이션 루프
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // cleanup
    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [mountRef, canvasWidth, canvasHeight]);

  // 캔버스 리사이즈 시 카메라/렌더러 갱신
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(canvasWidth, canvasHeight);
      cameraRef.current.aspect = canvasWidth / canvasHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="flex-1 relative" ref={mountRef}>
      {/* 도움말 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-2 rounded-md shadow text-sm">
        <p>가구를 <strong>더블 클릭</strong>한 후 드래그하여 이동할 수 있습니다.</p>
      </div>
      {/* 드래그 중 표시기 */}
      {isDragging && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md">
          드래그 중...
        </div>
      )}
      {/* 자동 배치 중 로딩 표시 */}
      {isAutoplacing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <p className="text-lg font-bold">가구 배치 중...</p>
            <p className="text-sm mt-2">최적의 위치를 계산하고 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomView; 