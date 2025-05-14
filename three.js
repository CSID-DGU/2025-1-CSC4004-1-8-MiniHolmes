// [설명]
// 이 파일은 독립적인 React + Three.js 기반 3D 가구/방 시각화 데모(또는 컴포넌트)입니다.
// 추천/배치 알고리즘 로직은 포함되어 있지 않으며, UI/3D 렌더링 데모 또는 프로토타입 용도로 사용됩니다.

import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const RoomVisualizer = () => {
  const mountRef = useRef(null);
  const [furniture, setFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Scene 관련 변수들을 useRef로 저장
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const furnitureModelsRef = useRef({});
  
  // 가구 데이터 불러오기 (실제로는 API 호출)
  useEffect(() => {
    // 임시 데이터 - 실제로는 API에서 가져옴
    const mockFurnitureData = [
      { 
        id: '1', 
        name: '침대', 
        category: '침실', 
        modelPath: '/models/bed.glb', 
        dimensions: { width: 200, height: 50, depth: 180 },
        thumbnail: '/thumbnails/bed.jpg'
      },
      { 
        id: '2', 
        name: '소파', 
        category: '거실', 
        modelPath: '/models/sofa.glb', 
        dimensions: { width: 220, height: 80, depth: 90 },
        thumbnail: '/thumbnails/sofa.jpg'
      },
      { 
        id: '3', 
        name: '책상', 
        category: '사무', 
        modelPath: '/models/desk.glb', 
        dimensions: { width: 120, height: 75, depth: 60 },
        thumbnail: '/thumbnails/desk.jpg'
      },
    ];
    
    setFurniture(mockFurnitureData);
    setLoading(false);
  }, []);
  
  // Three.js 초기화
  useEffect(() => {
    if (loading || !mountRef.current) return;
    
    // Scene, Camera, Renderer 설정
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 200, 400);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    
    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 바닥 평면 추가
    const floorGeometry = new THREE.PlaneGeometry(400, 400);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xeeeeee,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // 벽 추가 (원룸 형태)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      side: THREE.DoubleSide
    });
    
    // 뒷벽
    const backWallGeometry = new THREE.PlaneGeometry(400, 200);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -200;
    backWall.position.y = 100;
    scene.add(backWall);
    
    // 왼쪽 벽
    const leftWallGeometry = new THREE.PlaneGeometry(400, 200);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -200;
    leftWall.position.y = 100;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    
    // OrbitControls 추가
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 레퍼런스 저장
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    
    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // 창 크기 변경 핸들러
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
    
    // 정리 함수
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [loading]);
  
  // 가구 모델 로드 함수
  const loadFurnitureModel = (furnitureItem) => {
    if (!sceneRef.current) return;
    
    // 이미 로드된 모델이 있으면 그대로 사용
    if (furnitureModelsRef.current[furnitureItem.id]) {
      const model = furnitureModelsRef.current[furnitureItem.id].clone();
      sceneRef.current.add(model);
      return;
    }
    
    // 새 모델 로드
    const loader = new GLTFLoader();
    
    // 실제로는 API에서 받은 경로로 로드
    loader.load(
      furnitureItem.modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        // 모델 위치 조정 (바닥 위에 놓기)
        model.position.y = 0;
        
        // 모델 스케일 조정 (필요시)
        model.scale.set(1, 1, 1);
        
        // 모델 저장 및 씬에 추가
        furnitureModelsRef.current[furnitureItem.id] = model.clone();
        sceneRef.current.add(model);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('모델 로드 중 오류 발생:', error);
      }
    );
  };
  
  // 가구 선택 핸들러
  const handleSelectFurniture = (item) => {
    setSelectedFurniture(item);
    
    // 기존 모델 제거 (현재는 하나의 모델만 표시)
    if (sceneRef.current) {
      sceneRef.current.children.forEach(child => {
        if (child instanceof THREE.Group) {
          sceneRef.current.remove(child);
        }
      });
    }
    
    // 선택된 모델 로드
    loadFurnitureModel(item);
  };
  
  return (
    <div className="flex h-screen">
      {/* 왼쪽 패널 - 가구 목록 */}
      <div className="w-1/4 p-4 bg-gray-100 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">가구 목록</h2>
        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {furniture.map(item => (
              <div 
                key={item.id}
                className={`p-2 border rounded cursor-pointer ${
                  selectedFurniture?.id === item.id ? 'bg-blue-100 border-blue-500' : 'bg-white'
                }`}
                onClick={() => handleSelectFurniture(item)}
              >
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-gray-600">{item.category}</div>
                <div className="text-xs">
                  {item.dimensions.width}cm x {item.dimensions.depth}cm x {item.dimensions.height}cm
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 오른쪽 패널 - 3D 렌더링 뷰 */}
      <div className="w-3/4 relative" ref={mountRef}>
        {/* 여기에 Three.js 캔버스가 렌더링됨 */}
      </div>
    </div>
  );
};

export default RoomVisualizer;