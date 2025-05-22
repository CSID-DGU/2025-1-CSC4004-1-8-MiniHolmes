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
const ROOM_WIDTH = 400; // cm
const ROOM_DEPTH = 400; // cm
const ROOM_HEIGHT = 250; // cm

const RoomVisualizer = () => {
  const mountRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const centerRef = useRef(null);
  const [username, setUsername] = useState('');

  // 가구/상태 관련
  const [furniture, setFurniture] = useState([]);
  const [filteredFurniture, setFilteredFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplacing, setIsAutoplacing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [savedPlacements, setSavedPlacements] = useState([]);
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(false);

  // Three.js 관련 레퍼런스
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const furnitureModelsRef = useRef({});
  const animationFrameRef = useRef(null);

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

  // Load furniture on component mount
  useEffect(() => {
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

  // Three.js 초기화 및 방/가구 렌더링
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
      
      // Dispose of all geometries and materials
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      // Dispose of renderer
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }

      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;

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
  const maxWidth = containerSize.width ? containerSize.width - 40 : 1000;

  // Handler functions
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
        const perimeter = (ROOM_WIDTH + ROOM_DEPTH) * 2;

        // 추천 API 호출
        const recommendationResult = await getRecommendedFurniture(userWeights, maxBudget, perimeter);
        console.log('추천 결과:', recommendationResult);

        // 추천된 가구 ID 목록 추출
        const recommendedIds = Object.values(recommendationResult).flat();
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

  // 가구 추천 후 배치 실행
  const handleFurnitureRecommendation = async (recommendedFurniture) => {
    try {
        console.log('가구 배치 시작:', recommendedFurniture);
        
        // 가구 배치 실행
        const placements = await placeFurniture(recommendedFurniture);
        console.log('배치 결과:', placements);
        
        // 방 크기 (미터 단위)
        const roomWidth = ROOM_WIDTH * CM_TO_M;
        const roomDepth = ROOM_DEPTH * CM_TO_M;
        
        // 벽과의 최소 간격 (미터 단위)
        const WALL_MARGIN = 0.05; // 5cm
        
        // 배치된 가구들을 3D 공간에 배치
        for (const placement of placements) {
            const furniture = recommendedFurniture.find(f => f._id === placement._id);
            if (furniture) {
                console.log('가구 모델 로드:', furniture.name, placement);
                // 가구 모델 로드 및 배치
                const model = await loadFurnitureModel(furniture._id, furniture.modelPath || furniture.glb_file);
                if (model) {
                    // 가구 크기 (미터 단위)
                    const furnitureWidth = placement.width * CM_TO_M;
                    const furnitureDepth = placement.height * CM_TO_M;
                    
                    // 모델의 실제 크기 계산
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    
                    // 모델 크기 조정
                    const scaleX = furnitureWidth / size.x;
                    const scaleY = 1; // 높이는 원본 유지
                    const scaleZ = furnitureDepth / size.z;
                    model.scale.set(scaleX, scaleY, scaleZ);
                    
                    // 회전 (라디안)
                    const rotationY = placement.rotation.y * (Math.PI / 180);
                    
                    // 백엔드 좌표계(좌상단 0,0)를 Three.js 좌표계(중앙 0,0)로 변환
                    const x = (placement.position.x * CM_TO_M) - (roomWidth / 2) + (furnitureWidth / 2);
                    const z = (roomDepth / 2) - (placement.position.y * CM_TO_M) - (furnitureDepth / 2);
                    
                    // 초기 위치 설정
                    model.position.set(x, 0, z);
                    model.rotation.set(0, rotationY, 0);
                    
                    // 바운딩 박스 업데이트
                    const updatedBox = new THREE.Box3().setFromObject(model);
                    
                    // 방 경계 체크
                    const isOutOfBounds = 
                        updatedBox.min.x < -roomWidth/2 + WALL_MARGIN ||
                        updatedBox.max.x > roomWidth/2 - WALL_MARGIN ||
                        updatedBox.min.z < -roomDepth/2 + WALL_MARGIN ||
                        updatedBox.max.z > roomDepth/2 - WALL_MARGIN;
                    
                    if (isOutOfBounds) {
                        console.warn('가구가 방의 경계를 벗어남 - 위치 조정 중:', furniture.name);
                        
                        // 방 내부로 위치 조정
                        const modelSize = updatedBox.getSize(new THREE.Vector3());
                        const newX = Math.max(
                            -roomWidth/2 + modelSize.x/2 + WALL_MARGIN,
                            Math.min(
                                roomWidth/2 - modelSize.x/2 - WALL_MARGIN,
                                model.position.x
                            )
                        );
                        
                        const newZ = Math.max(
                            -roomDepth/2 + modelSize.z/2 + WALL_MARGIN,
                            Math.min(
                                roomDepth/2 - modelSize.z/2 - WALL_MARGIN,
                                model.position.z
                            )
                        );
                        
                        model.position.set(newX, 0, newZ);
                        
                        // 조정된 위치의 바운딩 박스 다시 계산
                        const adjustedBox = new THREE.Box3().setFromObject(model);
                        
                        console.log('가구 위치 조정 완료:', {
                            name: furniture.name,
                            originalPosition: { x, z },
                            adjustedPosition: { x: newX, z: newZ },
                            dimensions: {
                                width: furnitureWidth,
                                depth: furnitureDepth
                            },
                            boundingBox: {
                                min: adjustedBox.min,
                                max: adjustedBox.max
                            },
                            roomBounds: {
                                width: roomWidth,
                                depth: roomDepth
                            },
                            margin: WALL_MARGIN
                        });
                    } else {
                        console.log('가구 배치 완료:', {
                            name: furniture.name,
                            position: model.position,
                            rotation: model.rotation,
                            dimensions: {
                                width: furnitureWidth,
                                depth: furnitureDepth
                            },
                            boundingBox: {
                                min: updatedBox.min,
                                max: updatedBox.max
                            },
                            roomBounds: {
                                width: roomWidth,
                                depth: roomDepth
                            },
                            margin: WALL_MARGIN
                        });
                    }
                }
            } else {
                console.warn('가구를 찾을 수 없음:', placement._id);
            }
        }
    } catch (error) {
        console.error('가구 배치 중 오류 발생:', error);
    }
  };

  const placeFurniture = async (furnitureList) => {
    try {
        const response = await fetch('http://localhost:3001/api/furniture/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                furniture_list: furnitureList,
                room_width: ROOM_WIDTH,
                room_height: ROOM_DEPTH
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

  const handleClearScene = () => {
    // Remove all furniture models from the scene
    Object.values(furnitureModelsRef.current).forEach(model => {
      if (model && sceneRef.current) {
        sceneRef.current.remove(model);
      }
    });
    furnitureModelsRef.current = {};
    setSelectedItems([]);
  };

  const handleSelectFurniture = async (furniture) => {
    try {
      console.log('Selected furniture:', furniture);
      const modelPath = furniture.modelPath || furniture.glb_file || `${furniture._id}.glb`;
      const model = await loadFurnitureModel(furniture._id, modelPath);
      
      if (model) {
        // Set initial position in the center of the room
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        
        // Add to scene if not already added
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
        furniture: Object.entries(furnitureModelsRef.current).map(([id, model]) => ({
          furnitureId: id,
          position: model.position.toArray(),
          rotation: model.rotation.toArray(),
          scale: model.scale.toArray()
        }))
      };
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
  const loadFurnitureModel = async (furnitureId, modelPath) => {
    try {
      console.log(`Loading furniture model ${furnitureId} from path:`, modelPath);
      
      if (!modelPath) {
        console.error(`No model path provided for furniture ${furnitureId}`);
        return null;
      }

      // 모델 경로 처리
      let finalModelPath = modelPath;
      if (!finalModelPath.startsWith('/models/')) {
        finalModelPath = '/models/' + finalModelPath.replace(/^\/+/, '');
      }
      
      // 카테고리 경로 추가
      const furnitureItem = furniture.find(item => item._id === furnitureId);
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
        throw new Error(`Model file not found: ${finalModelPath}`);
      }

      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      return new Promise((resolve, reject) => {
        loader.load(
          finalModelPath,
          (gltf) => {
            const model = gltf.scene;
            model.traverse((node) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
            
            // Store the model in the ref
            furnitureModelsRef.current[furnitureId] = model;
            
            // Add to scene
            if (sceneRef.current) {
              sceneRef.current.add(model);
            }

            console.log(`Successfully loaded model for furniture ${furnitureId}`);
            resolve(model);
          },
          (xhr) => {
            if (xhr.lengthComputable) {
              const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
              console.log(`Loading progress: ${percentComplete}% - ${furnitureId}`);
            }
          },
          (error) => {
            console.error(`Failed to load model for furniture ${furnitureId}:`, error);
            // Create fallback model
            const fallbackModel = createFallbackModel(furnitureItem);
            console.warn(`Created fallback model for ${furnitureId}`);
            resolve(fallbackModel);
          }
        );
      });
    } catch (error) {
      console.error(`Error loading furniture model ${furnitureId}:`, error);
      // Create fallback model
      const furnitureItem = furniture.find(item => item._id === furnitureId);
      const fallbackModel = createFallbackModel(furnitureItem);
      console.warn(`Created fallback model for ${furnitureId}`);
      return fallbackModel;
    }
  };

  // Create fallback model when loading fails
  const createFallbackModel = (furnitureItem) => {
    if (!sceneRef.current || !furnitureItem) return null;

    console.log('Creating fallback model for:', furnitureItem.name);
    
    const width = furnitureItem.dimensions?.width * CM_TO_M || 1;
    const height = furnitureItem.dimensions?.height * CM_TO_M || 1;
    const depth = furnitureItem.dimensions?.depth * CM_TO_M || 1;
    
    // Category-based color
    let color = 0x888888;
    switch (furnitureItem.category) {
      case 'bed': color = 0x90caf9; break;
      case 'desk': color = 0xa5d6a7; break;
      case 'wardrobe': color = 0xffcc80; break;
      case 'bookshelf': color = 0xce93d8; break;
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
      furnitureId: furnitureItem._id,
      furnitureName: furnitureItem.name,
      furnitureCategory: furnitureItem.category,
      furniture: furnitureItem,
      isFallback: true
    };
    
    modelGroup.name = `furniture-${furnitureItem.name}-fallback`;
    modelGroup.position.set(0, height / 2, 0);
    
    sceneRef.current.add(modelGroup);
    furnitureModelsRef.current[furnitureItem._id] = modelGroup;
    
    return modelGroup;
  };

  // Load all furniture models
  const loadAllFurnitureModels = async (furnitureList) => {
    console.log('Loading furniture models for:', furnitureList);
    
    for (const item of furnitureList) {
      if (!furnitureModelsRef.current[item._id]) {
        const modelPath = item.modelPath || item.glb_file || `${item._id}.glb`;
        console.log(`Loading model for furniture ${item._id} with path:`, modelPath);
        await loadFurnitureModel(item._id, modelPath);
      }
    }
  };

  const handleLoadPlacement = async (placementId) => {
    try {
      console.log('Loading placement:', placementId);
      
      // If placementId is already a placement object, use it directly
      const placement = typeof placementId === 'object' ? placementId : null;
      
      // If not a placement object, fetch placements
      const placements = placement ? null : await getPlacements(placementId);
      console.log('Loaded placement data:', placements);
      
      // Get the final placement object
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

      // Clear existing furniture first
      handleClearScene();

      // Load all furniture models first
      const furnitureIds = finalPlacement.furniture.map(item => item.furnitureId);
      console.log('Furniture IDs to load:', furnitureIds);
      
      const furnitureToLoad = furniture.filter(item => furnitureIds.includes(item._id));
      console.log('Furniture to load:', furnitureToLoad);
      
      // Load all models and wait for them to complete
      const loadedModels = await Promise.all(
        furnitureToLoad.map(async (item) => {
          const modelPath = item.modelPath || item.glb_file || `${item._id}.glb`;
          console.log(`Loading model for furniture ${item._id} with path:`, modelPath);
          const model = await loadFurnitureModel(item._id, modelPath);
          return { id: item._id, model };
        })
      );

      // Create a map of loaded models for easy access
      const modelMap = new Map(loadedModels.map(({ id, model }) => [id, model]));
      
      // Load each furniture item from the placement
      for (const item of finalPlacement.furniture) {
        if (!item || !item.furnitureId) {
          console.warn('Invalid furniture item:', item);
          continue;
        }

        console.log('Loading furniture item:', item);

        const model = modelMap.get(item.furnitureId);
        if (model) {
          // Apply position
          if (item.position) {
            const pos = item.position;
            // Check if position is an array or object
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

          // Apply rotation
          if (item.rotation) {
            const rot = item.rotation;
            // Check if rotation is an array or object
            if (Array.isArray(rot)) {
              model.rotation.fromArray(rot);
            } else {
              model.rotation.set(rot.x, rot.y, rot.z);
            }
            console.log('Applied rotation:', model.rotation);
          }

          // Apply scale
          if (item.scale) {
            const scale = item.scale;
            // Check if scale is an array or object
            if (Array.isArray(scale)) {
              model.scale.fromArray(scale);
            } else {
              model.scale.set(scale.x, scale.y, scale.z);
            }
            console.log('Applied scale:', model.scale);
          }

          // Add to scene if not already added
          if (!sceneRef.current.children.includes(model)) {
            sceneRef.current.add(model);
          }

          // Log the final transform
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

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
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
          maxConstraints={[maxWidth, 800]}
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
        />
      </div>
    </div>
  );
};

export default RoomVisualizer;