import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const RoomVisualizer = () => {
  const mountRef = useRef(null);
  const [furniture, setFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  
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
  
  // Three.js 초기화 (최초 1회만)
  useEffect(() => {
    if (loading || !mountRef.current) return;
    
    // Scene, Camera, Renderer 설정
    const width = canvasWidth;
    const height = canvasHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 200, 400);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
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
    
    // 정리 함수
    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
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
  
  // 크기 변경 시 renderer/camera만 업데이트
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(canvasWidth, canvasHeight);
      cameraRef.current.aspect = canvasWidth / canvasHeight;
      cameraRef.current.updateProjectionMatrix();
      // renderer.domElement의 style도 직접 px로 지정
      rendererRef.current.domElement.style.width = `${canvasWidth}px`;
      rendererRef.current.domElement.style.height = `${canvasHeight}px`;
    }
  }, [canvasWidth, canvasHeight]);
  
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
      <div className="w-3/4 flex items-center justify-center">
        <div style={{ position: 'relative' }}>
          <ResizableBox
            width={canvasWidth}
            height={canvasHeight}
            minConstraints={[300, 200]}
            maxConstraints={[1200, 800]}
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
                position: 'relative',
                overflow: 'hidden'
              }} 
            />
          </ResizableBox>
        </div>
      </div>
    </div>
  );
};

export default RoomVisualizer;
