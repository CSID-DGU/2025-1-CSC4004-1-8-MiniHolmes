import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getAllFurniture, getRecommendedFurniture } from '../services/api';
import { getAutoPlacement, getMockPlacement } from '../services/placementService';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const CM_TO_M = 0.01;

const RoomVisualizer = () => {
  const mountRef = useRef(null);
  const [furniture, setFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplacing, setIsAutoplacing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);  // 선택된 가구 ID 목록
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);
  
  // Scene 관련 변수들을 useRef로 저장
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
  
  // 더블 클릭 감지를 위한 변수
  const lastClickTimeRef = useRef(0);
  const lastClickPositionRef = useRef({ x: 0, y: 0 });
  
  // 바운딩 박스 헬퍼 (개발용)
  const boxHelpersRef = useRef({});
  
  // 방 설정
  const roomDimensionsRef = useRef({
    width: 400,  // 방 가로 크기
    depth: 400,  // 방 세로 크기
    height: 250,  // 방 높이
    centerX: 200, // 방 중심 X
    centerZ: 200  // 방 중심 Z
  });
  
  // API에서 가구 데이터 불러오기
  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const data = await getAllFurniture();
        console.log('API에서 받은 가구 데이터:', data);
        setFurniture(data);
      } catch (error) {
        console.error('가구 데이터 로딩 실패:', error);
        // 에러 발생시 대체 데이터 삭제 (빈 배열 반환)
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
    
    // 방 크기에 맞게 카메라 위치 자동 조정
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
    
    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 바닥 평면 추가
    const roomWidth = roomDimensionsRef.current.width * CM_TO_M;
    const roomDepth = roomDimensionsRef.current.depth * CM_TO_M;
    const roomHeight = roomDimensionsRef.current.height * CM_TO_M;
    
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xeeeeee,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = "floor";
    scene.add(floor);
    
    // 그리드 헬퍼 추가
    const gridHelper = new THREE.GridHelper(roomWidth, roomWidth / 20);
    scene.add(gridHelper);
    
    // 벽 추가 (원룸 형태)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      side: THREE.DoubleSide
    });
    
    // 뒷벽
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2;
    backWall.name = "backWall";
    scene.add(backWall);
    
    // 왼쪽 벽
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.name = "leftWall";
    scene.add(leftWall);
    
    // OrbitControls 추가
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enabled = true; // 초기에는 활성화
    
    // 레퍼런스 저장
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    
    // 마우스 위치를 3D 공간의 바닥 평면에 투영하는 함수
    const projectMouseOnFloor = (clientX, clientY) => {
      // 정규화된 장치 좌표로 변환
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      
      // 레이캐스팅을 위한 벡터 생성
      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera);
      
      // 카메라에서 마우스 방향으로의 방향 벡터
      const dir = vector.sub(camera.position).normalize();
      
      // 카메라에서 바닥(y=0)까지의 거리 계산
      const distance = -camera.position.y / dir.y;
      
      // 바닥 평면과의 교차점 계산
      return camera.position.clone().add(dir.multiplyScalar(distance));
    };
    
    // 씬에서 가구 모델 찾기 함수
    const findFurnitureModels = () => {
      const models = [];
      scene.traverse((object) => {
        if (object.userData && object.userData.isFurniture) {
          models.push(object);
        }
      });
      return models;
    };
    
    // 바운딩 박스를 통한 가구 선택 함수
    const findFurnitureByBoundingBox = (point) => {
      const furnitureModels = findFurnitureModels();
      
      for (const model of furnitureModels) {
        // 모델의 월드 바운딩 박스 계산
        const bbox = new THREE.Box3().setFromObject(model);
        
        // 바운딩 박스를 XZ 평면에 투영
        const min = bbox.min;
        const max = bbox.max;
        
        // XZ 평면에서 포인트가 바운딩 박스 내에 있는지 확인
        if (
          point.x >= min.x && point.x <= max.x &&
          point.z >= min.z && point.z <= max.z
        ) {
          return model;
        }
      }
      
      return null;
    };
    
    // 더블 클릭 여부를 확인하는 함수
    const isDoubleClick = (event) => {
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastClickTimeRef.current;
      
      // 위치 차이 계산
      const positionDiff = Math.sqrt(
        Math.pow(event.clientX - lastClickPositionRef.current.x, 2) +
        Math.pow(event.clientY - lastClickPositionRef.current.y, 2)
      );
      
      // 300ms 이내 및 10px 이내 클릭을 더블 클릭으로 간주
      const isDouble = timeDiff < 300 && positionDiff < 10;
      
      // 현재 클릭 정보 저장
      lastClickTimeRef.current = currentTime;
      lastClickPositionRef.current = { x: event.clientX, y: event.clientY };
      
      return isDouble;
    };
    
    // 마우스 이벤트 핸들러 추가
    const handleClick = (event) => {
      if (!sceneRef.current || !cameraRef.current) return;
      
      // 더블 클릭 확인
      if (!isDoubleClick(event)) {
        return; // 더블 클릭이 아니면 무시
      }
      
      console.log('더블 클릭 감지됨');
      
      // 바닥 평면에 투영된 마우스 위치 계산
      const floorPoint = projectMouseOnFloor(event.clientX, event.clientY);
      
      // 바운딩 박스로 가구 모델 찾기
      const selectedModel = findFurnitureByBoundingBox(floorPoint);
      
      if (selectedModel) {
        console.log('가구 선택됨:', selectedModel.name);
        draggedObjectRef.current = selectedModel;
        isDraggingRef.current = true;
        setIsDragging(true);
        
        // 오브젝트 위치와 마우스 위치의 오프셋 계산 (드래그 중에 유지)
        dragOffsetRef.current.copy(selectedModel.position).sub(floorPoint);
        
        // OrbitControls 비활성화
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    };
    
    const handleMouseMove = (event) => {
      // 레퍼런스 값으로 드래그 상태 확인 (리액트 상태 대신)
      if (!isDraggingRef.current || !draggedObjectRef.current) return;
      
      // 바닥 평면에 투영된 마우스 위치 계산
      const floorPoint = projectMouseOnFloor(event.clientX, event.clientY);
      
      // 드래그 오프셋을 적용하여 오브젝트 위치 업데이트
      draggedObjectRef.current.position.x = floorPoint.x + dragOffsetRef.current.x;
      draggedObjectRef.current.position.z = floorPoint.z + dragOffsetRef.current.z;
      
      // 바운딩 박스 헬퍼 업데이트 (있는 경우)
      if (boxHelpersRef.current[draggedObjectRef.current.uuid]) {
        boxHelpersRef.current[draggedObjectRef.current.uuid].update();
      }
    };
    
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        draggedObjectRef.current = null;
        
        // OrbitControls 다시 활성화
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };
    
    // 이벤트 리스너를 렌더러 DOM 요소에 추가
    const rendererDom = renderer.domElement;
    rendererDom.addEventListener('click', handleClick);
    rendererDom.addEventListener('mousemove', handleMouseMove);
    rendererDom.addEventListener('mouseup', handleMouseUp);
    
    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
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
      if (rendererDom) {
        rendererDom.removeEventListener('click', handleClick);
        rendererDom.removeEventListener('mousemove', handleMouseMove);
        rendererDom.removeEventListener('mouseup', handleMouseUp);
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [loading]);
  
  // 가구 모델 로드 함수
  const loadFurnitureModel = async (furnitureItem, position = null, rotation = null, placement = null) => {
    if (!sceneRef.current) return;
    // 이미 로드된 모델이 있으면 그대로 사용
    if (furnitureModelsRef.current[furnitureItem._id]) {
      const model = furnitureModelsRef.current[furnitureItem._id].clone();
      if (placement) {
        const width = placement.width * CM_TO_M;
        const depth = placement.height * CM_TO_M;
        const posX = placement.position.x * CM_TO_M;
        const posZ = placement.position.y * CM_TO_M;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.scale.set(width / size.x, model.scale.y, depth / size.z);
        
        // 방의 중심을 기준으로 좌표 변환 (방의 크기를 고려)
        const roomWidth = roomDimensionsRef.current.width * CM_TO_M;
        const roomDepth = roomDimensionsRef.current.depth * CM_TO_M;
        
        // 방의 경계를 벗어나지 않도록 좌표 조정
        const margin = 0.05; // 5cm 마진
        const minX = -roomWidth/2 + width/2 + margin;
        const maxX = roomWidth/2 - width/2 - margin;
        const minZ = -roomDepth/2 + depth/2 + margin;
        const maxZ = roomDepth/2 - depth/2 - margin;
        
        // Python 좌표를 Three.js 좌표로 변환 (방의 중심을 기준으로)
        const x = Math.max(minX, Math.min(maxX, posX - roomWidth/2 + width/2));
        const z = Math.max(minZ, Math.min(maxZ, posZ - roomDepth/2 + depth/2));
        
        model.position.set(x, 0, z);
        
        // 디버깅 출력
        console.log('[Python 배치결과]', placement);
        console.log('[Three.js 적용]', {
          name: furnitureItem.name,
          x: model.position.x,
          z: model.position.z,
          width,
          depth,
          scale: model.scale,
          rotation: model.rotation,
          boundingBox: size,
          boundingBoxCenter: center
        });
      }
      sceneRef.current.add(model);
      return;
    }
    // 새 모델 로드
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/'); // public 폴더 기준
    loader.setDRACOLoader(dracoLoader);
    let modelPath = furnitureItem.glb_file || furnitureItem.modelPath;
    if (modelPath) {
      if (!modelPath.startsWith('/models/')) {
        modelPath = '/models/' + modelPath.replace(/^\/+/,'');
      }
      const category = furnitureItem.category;
      if (category && !modelPath.includes(`/${category}/`)) {
        modelPath = modelPath.replace('/models/', `/models/${category}/`);
      }
      if (!modelPath.startsWith('http')) {
        modelPath = `http://localhost:3001${modelPath}`;
      }
    }
    console.log('[모델 로드 시도]', furnitureItem.name, modelPath);
    try {
      const response = await fetch(modelPath, { method: 'HEAD', headers: { 'Accept': 'model/gltf-binary' } });
      if (!response.ok) {
        console.error('[모델 파일 없음]', modelPath, response.status);
        throw new Error(`Model file not found: ${modelPath} (${response.status})`);
      }
      return new Promise((resolve, reject) => {
        loader.load(
          modelPath,
          (gltf) => {
            const model = gltf.scene;
            model.traverse((node) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
            // 모델 위치/스케일/회전 적용
            if (placement) {
              const width = placement.width * CM_TO_M;
              const depth = placement.height * CM_TO_M;
              const posX = placement.position.x * CM_TO_M;
              const posZ = placement.position.y * CM_TO_M;
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              model.scale.set(width / size.x, model.scale.y, depth / size.z);
              
              // 방의 중심을 기준으로 좌표 변환 (방의 크기를 고려)
              const roomWidth = roomDimensionsRef.current.width * CM_TO_M;
              const roomDepth = roomDimensionsRef.current.depth * CM_TO_M;
              
              // 방의 경계를 벗어나지 않도록 좌표 조정
              const margin = 0.05; // 5cm 마진
              const minX = -roomWidth/2 + width/2 + margin;
              const maxX = roomWidth/2 - width/2 - margin;
              const minZ = -roomDepth/2 + depth/2 + margin;
              const maxZ = roomDepth/2 - depth/2 - margin;
              
              // Python 좌표를 Three.js 좌표로 변환 (방의 중심을 기준으로)
              const x = Math.max(minX, Math.min(maxX, posX - roomWidth/2 + width/2));
              const z = Math.max(minZ, Math.min(maxZ, posZ - roomDepth/2 + depth/2));
              
              model.position.set(x, 0, z);
              
              if (placement.rotation) {
                model.rotation.set(placement.rotation.x, placement.rotation.y, placement.rotation.z);
              }
              // 디버깅 출력
              console.log('[GLB 로드 성공]', furnitureItem.name, modelPath);
              console.log('[Python 배치결과]', placement);
              console.log('[Three.js 적용]', {
                name: furnitureItem.name,
                x: model.position.x,
                z: model.position.z,
                width,
                depth,
                scale: model.scale,
                rotation: model.rotation,
                boundingBox: size,
                boundingBoxCenter: center
              });
            }
            sceneRef.current.add(model);
            furnitureModelsRef.current[furnitureItem._id] = model;
            resolve(model);
          },
          (xhr) => {
            if (xhr.lengthComputable) {
              const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
              console.log(`모델 로딩 진행률: ${percentComplete}% - ${furnitureItem.name}`);
            }
          },
          (error) => {
            console.error('[GLTFLoader 에러]', furnitureItem.name, modelPath, error);
            const fallbackModel = createFallbackModel(furnitureItem, position, rotation);
            console.warn('[대체 모델 생성]', furnitureItem.name, '→ 빨간 박스만 보이면 파일/경로/포맷 문제입니다.');
            resolve(fallbackModel);
          }
        );
      });
    } catch (e) {
      console.error('[GLB fetch 오류]', e);
      const fallbackModel = createFallbackModel(furnitureItem, position, rotation);
      console.warn('[대체 모델 생성]', furnitureItem.name, '→ 빨간 박스만 보이면 파일/경로/포맷 문제입니다.');
      return fallbackModel;
    }
  };
  
  // 모델 로드 실패 시 대체 모델 생성
  const createFallbackModel = (furnitureItem, position = null, rotation = null) => {
    if (!sceneRef.current) return;
    
    console.log('대체 모델 생성:', furnitureItem.name);
    
    // === cm 단위 → meter 변환 ===
    const width = furnitureItem.dimensions.width * CM_TO_M;
    const height = furnitureItem.dimensions.height * CM_TO_M;
    const depth = furnitureItem.dimensions.depth * CM_TO_M;
    
    // 가구 카테고리에 따른 색상 지정
    let color = 0x888888;
    switch (furnitureItem.category) {
      case 'bed':
        color = 0x90caf9; // 파란색
        break;
      case 'desk':
        color = 0xa5d6a7; // 초록색
        break;
      case 'wardrobe':
        color = 0xffcc80; // 주황색
        break;
      case 'bookshelf':
        color = 0xce93d8; // 보라색
        break;
    }
    
    // 간단한 박스 모델 생성
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7,
    });
    
    const boxModel = new THREE.Mesh(geometry, material);
    
    // 가구 그룹 생성
    const modelGroup = new THREE.Group();
    modelGroup.add(boxModel);
    
    // 메타데이터 추가
    modelGroup.userData = { 
      isFurniture: true,
      furnitureId: furnitureItem._id,
      furnitureName: furnitureItem.name,
      furnitureCategory: furnitureItem.category,
      furniture: furnitureItem,
      isFallback: true
    };
    modelGroup.name = `furniture-${furnitureItem.name}-fallback`;
    
    // 위치 설정
    if (position) {
      const isHorizontal = rotation && Math.abs(rotation.y - Math.PI/2) < 0.01;
      const w = isHorizontal ? furnitureItem.dimensions.depth : furnitureItem.dimensions.width;
      const d = isHorizontal ? furnitureItem.dimensions.width : furnitureItem.dimensions.depth;
      modelGroup.position.set(
        (position.x + w / 2) * CM_TO_M,
        position.y * CM_TO_M,
        (position.z + d / 2) * CM_TO_M
      );
    } else {
      modelGroup.position.set(0, height / 2, 0);
    }
    
    // 회전 설정
    if (rotation) {
      modelGroup.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    
    // 씬에 추가
    sceneRef.current.add(modelGroup);

    // === 방 경계 clamp ===
    const halfRoomW = roomDimensionsRef.current.width * CM_TO_M / 2;
    const halfRoomD = roomDimensionsRef.current.depth * CM_TO_M / 2;
    const meshWidth = furnitureItem.dimensions.width * CM_TO_M;
    const meshDepth = furnitureItem.dimensions.depth * CM_TO_M;
    modelGroup.position.x = Math.max(-halfRoomW + meshWidth/2, Math.min(halfRoomW - meshWidth/2, modelGroup.position.x));
    modelGroup.position.z = Math.max(-halfRoomD + meshDepth/2, Math.min(halfRoomD - meshDepth/2, modelGroup.position.z));

    // (디버깅) 바운딩 박스 표시
    const boxHelper = new THREE.BoxHelper(modelGroup, 0xff0000);
    sceneRef.current.add(boxHelper);

    // 대체 모델 저장
    furnitureModelsRef.current[furnitureItem._id] = modelGroup.clone();
    
    return modelGroup;
  };
  
  // 가구 선택 핸들러
  const handleSelectFurniture = (item) => {
    // 이미 선택된 항목인지 확인
    const isAlreadySelected = selectedItems.some(id => id === item._id);
    
    // 선택된 항목 목록 업데이트
    if (isAlreadySelected) {
      setSelectedItems(selectedItems.filter(id => id !== item._id));
    } else {
      setSelectedItems([...selectedItems, item._id]);
    }
    
    setSelectedFurniture(item);
    
    // 현재 항목이 이미 씬에 있는지 확인
    let existingModel = null;
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object.userData && object.userData.furnitureId === item._id) {
          existingModel = object;
        }
      });
    }
    
    // 씬에 없으면 새로 추가
    if (!existingModel) {
      loadFurnitureModel(item);
    }
  };
  
  // 가구 자동 배치 함수
  const handleAutoPlacement = async () => {
    if (selectedItems.length === 0) {
      alert('배치할 가구를 하나 이상 선택해주세요.');
      return;
    }
    
    setIsAutoplacing(true);
    
    try {
      console.log('선택된 가구 ID:', selectedItems);
      
      // 방 크기 정보
      const roomDimensions = {
        width: roomDimensionsRef.current.width,
        depth: roomDimensionsRef.current.depth,
        height: roomDimensionsRef.current.height
      };
      
      // 가구 배치 API 호출
      let placementResult;
      try {
        placementResult = await getAutoPlacement(selectedItems, roomDimensions);
        console.log('배치 결과:', placementResult);
      } catch (error) {
        console.error('배치 API 오류:', error);
        // API 오류 시 대체 배치 사용
        const selectedFurnitureItems = furniture.filter(item => selectedItems.includes(item._id));
        placementResult = getMockPlacement(selectedFurnitureItems, roomDimensions);
        console.log('대체 배치 사용:', placementResult);
      }
      
      // 기존 가구 모델 제거
      if (sceneRef.current) {
        // 가구 요소만 제거
        const furnitureToRemove = [];
        sceneRef.current.traverse((object) => {
          if (object.userData && object.userData.isFurniture) {
            furnitureToRemove.push(object);
          }
        });
        
        furnitureToRemove.forEach(obj => {
          sceneRef.current.remove(obj);
        });
      }
      
      // 배치 결과에 따라 가구 모델 로드 및 배치
      if (placementResult && placementResult.placements) {
        placementResult.placements.forEach(placement => {
          // 해당 가구 찾기
          const furnitureItem = furniture.find(item => item._id === placement._id);
          if (furnitureItem) {
            // 가구 모델 로드 및 배치
            loadFurnitureModel(
              furnitureItem, 
              placement.position,
              placement.rotation,
              placement
            );
          }
        });
      }
    } catch (error) {
      console.error('자동 배치 오류:', error);
      alert(`자동 배치 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsAutoplacing(false);
    }
  };
  
  // 가구 추천 배치 함수
  const handleRecommendPlacement = async () => {
    setIsAutoplacing(true);
    try {
      const roomDimensions = {
        width: roomDimensionsRef.current.width,
        depth: roomDimensionsRef.current.depth,
        height: roomDimensionsRef.current.height
      };
      const result = await getAutoPlacement([], roomDimensions);
      console.log('추천 배치 결과:', result);

      // 기존 가구 모델 제거
      if (sceneRef.current) {
        const furnitureToRemove = [];
        sceneRef.current.traverse((object) => {
          if (object.userData && object.userData.isFurniture) {
            furnitureToRemove.push(object);
          }
        });
        furnitureToRemove.forEach(obj => {
          sceneRef.current.remove(obj);
        });
      }

      // 배치 결과에 따라 가구 모델 로드 및 배치
      if (result && result.placements) {
        const allFurniture = await getAllFurniture();
        result.placements.forEach(placement => {
          const furnitureItem = allFurniture.find(item => item._id === placement._id);
          if (furnitureItem) {
            loadFurnitureModel(
              furnitureItem, 
              placement.position,
              placement.rotation,
              placement
            );
          }
        });
      }
    } catch (error) {
      console.error('추천 배치 오류:', error);
      alert(`추천 배치 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsAutoplacing(false);
    }
  };
  
  // 씬 초기화 함수
  const handleClearScene = () => {
    if (sceneRef.current) {
      // 가구 요소만 제거
      const furnitureToRemove = [];
      sceneRef.current.traverse((object) => {
        if (object.userData && object.userData.isFurniture) {
          furnitureToRemove.push(object);
        }
      });
      
      furnitureToRemove.forEach(obj => {
        sceneRef.current.remove(obj);
      });
      
      // 선택된 가구 목록 초기화
      setSelectedItems([]);
      setSelectedFurniture(null);
    }
  };
  
  // 가구 추천 함수
  const handleRecommendFurniture = async () => {
    setIsRecommending(true);
    try {
        // 사용자 선호도 설정 (예시 값)
        const userWeights = {
            style: 0.3,
            colortone: 0.2,
            size: 0.3,
            price: 0.2,
            target_style: "modern",
            target_colortone: "warm"
        };

        // 예산 설정 (예시: 500만원)
        const maxBudget = 5000000;

        // 방 둘레 계산 (예시)
        const perimeter = (roomDimensionsRef.current.width + roomDimensionsRef.current.depth) * 2;

        // 추천 API 호출
        const recommendedIds = await getRecommendedFurniture(userWeights, maxBudget, perimeter);
        setRecommendedIds(recommendedIds);
        setShowRecommendedOnly(true);

        // 추천된 가구 목록 가져오기
        const recommendedFurniture = furniture.filter(item => recommendedIds.includes(item._id));
        console.log('추천된 가구 목록:', recommendedFurniture);

        // 가구 배치 실행
        await handleFurnitureRecommendation(recommendedFurniture);
    } catch (error) {
        console.error('가구 추천 오류:', error);
        alert('가구 추천 중 오류가 발생했습니다.');
    } finally {
        setIsRecommending(false);
    }
  };

  // 필터링된 가구 목록
  const filteredFurniture = showRecommendedOnly
    ? furniture.filter(item => recommendedIds.includes(item._id))
    : furniture;

  const placeFurniture = async (furnitureList) => {
    try {
        const response = await fetch('http://localhost:3001/api/furniture/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                furniture_list: furnitureList,
                room_width: roomDimensionsRef.current.width,
                room_height: roomDimensionsRef.current.depth
            })
        });

        if (!response.ok) {
            throw new Error('가구 배치 요청 실패');
        }

        const data = await response.json();
        return data.placements;
    } catch (error) {
        console.error('가구 배치 중 오류 발생:', error);
        throw error;
    }
  };

  // 가구 추천 후 배치 실행
  const handleFurnitureRecommendation = async (recommendedFurniture) => {
    try {
        console.log('가구 배치 시작:', recommendedFurniture);
        
        // 가구 배치 실행
        const placements = await placeFurniture(recommendedFurniture);
        console.log('배치 결과:', placements);
        
        // 배치된 가구들을 3D 공간에 배치
        placements.forEach(placement => {
            const furniture = recommendedFurniture.find(f => f._id === placement._id);
            if (furniture) {
                console.log('가구 모델 로드:', furniture.name, placement);
                // 가구 모델 로드 및 배치
                loadFurnitureModel(furniture, placement.position, placement.rotation, placement);
            } else {
                console.warn('가구를 찾을 수 없음:', placement._id);
            }
        });
    } catch (error) {
        console.error('가구 배치 중 오류 발생:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 왼쪽 패널 - 가구 목록 */}
      <div className="w-1/4 p-4 bg-gray-100 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">가구 목록</h2>
        <div className="mb-4 flex space-x-2">
          <button 
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleRecommendFurniture}
            disabled={isRecommending}
          >
            {isRecommending ? '추천 중...' : '가구 추천'}
          </button>
          <button 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setShowRecommendedOnly(false)}
          >
            전체 보기
          </button>
          <button 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleClearScene}
          >
            초기화
          </button>
        </div>
        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFurniture.map(item => (
              <div 
                key={item._id}
                className={`p-2 border rounded cursor-pointer ${
                  selectedItems.includes(item._id) ? 'bg-blue-100 border-blue-500' : 'bg-white'
                }`}
                onClick={() => handleSelectFurniture(item)}
              >
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-gray-600">{item.category}</div>
                <div className="text-xs">
                  {item.dimensions.width}cm x {item.dimensions.depth}cm x {item.dimensions.height}cm
                </div>
                {item.style && (
                  <div className="text-xs text-gray-500">스타일: {item.style}</div>
                )}
                {item.price && (
                  <div className="text-xs text-gray-500">가격: {item.price.toLocaleString()}원</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 오른쪽 패널 - 3D 렌더링 뷰 */}
      <div className="w-3/4 relative" ref={mountRef}>
        {/* 도움말 */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-2 rounded-md shadow text-sm">
          <p>가구를 <strong>더블 클릭</strong>한 후 드래그하여 이동할 수 있습니다.</p>
          <p className="text-xs mt-1">좌측 패널에서 가구를 선택하고 <strong>자동 배치</strong> 또는 <strong>추천 배치</strong> 버튼을 누르면 알고리즘이 최적의 위치를 찾아줍니다.</p>
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
    </div>
  );
};

export default RoomVisualizer;