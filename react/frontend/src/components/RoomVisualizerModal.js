import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import './RoomVisualizerModal.css';

const CM_TO_M = 0.01;

const RoomVisualizerModal = ({ post, isOpen, onClose }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    initializeScene();
    
    return () => {
      cleanup();
    };
  }, [isOpen, post]);

  const cleanup = () => {
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (mountRef.current && rendererRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
  };

  const initializeScene = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);

      // Get room configuration from post
      const roomConfig = post.roomConfiguration || {};
      const roomSize = roomConfig.roomSize || post.roomDimensions || { width: 400, depth: 400, height: 240 };
      const doors = roomConfig.doors || [];
      const windows = roomConfig.windows || [];

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
      camera.position.set(3, 3, 3);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(800, 600);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      mountRef.current.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controlsRef.current = controls;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Create room
      createRoom(scene, roomSize, doors, windows);
      setLoadingProgress(30);

      // Load furniture
      if (post.placementData && post.placementData.furniture) {
        await loadFurniture(scene, post.placementData.furniture);
      }

      setLoadingProgress(100);
      setLoading(false);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        if (rendererRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, camera);
        }
      };
      animate();

    } catch (err) {
      console.error('Scene initialization error:', err);
      setError('3D 렌더링 초기화에 실패했습니다.');
      setLoading(false);
    }
  };

  const createRoom = (scene, roomSize, doors, windows) => {
    const width = (roomSize.width || 400) * CM_TO_M;
    const depth = (roomSize.depth || 400) * CM_TO_M;
    const height = (roomSize.height || 240) * CM_TO_M;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf8f8f8 });
    
    // Front wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial);
    frontWall.position.set(0, height/2, -depth/2);
    scene.add(frontWall);

    // Back wall  
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial);
    backWall.position.set(0, height/2, depth/2);
    backWall.rotation.y = Math.PI;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMaterial);
    leftWall.position.set(-width/2, height/2, 0);
    leftWall.rotation.y = Math.PI/2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMaterial);
    rightWall.position.set(width/2, height/2, 0);
    rightWall.rotation.y = -Math.PI/2;
    scene.add(rightWall);

    // Add doors and windows (simplified for modal)
    doors.forEach(door => {
      if (door.width && door.height) {
        const doorGeometry = new THREE.PlaneGeometry(door.width * CM_TO_M, door.height * CM_TO_M);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
        
        // Position door based on wall
        if (door.wall === 'front') {
          doorMesh.position.set((door.offset || 0) * CM_TO_M, door.height * CM_TO_M / 2, -depth/2 + 0.01);
        }
        // Add other wall positions as needed
        
        scene.add(doorMesh);
      }
    });

    windows.forEach(window => {
      if (window.width && window.height) {
        const windowGeometry = new THREE.PlaneGeometry(window.width * CM_TO_M, window.height * CM_TO_M);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x87CEEB, 
          transparent: true, 
          opacity: 0.6 
        });
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        
        // Position window based on wall and altitude
        if (window.wall === 'front') {
          windowMesh.position.set(
            (window.offset || 0) * CM_TO_M, 
            (window.altitude || 100) * CM_TO_M, 
            -depth/2 + 0.01
          );
        }
        // Add other wall positions as needed
        
        scene.add(windowMesh);
      }
    });
  };

  const loadFurniture = async (scene, furnitureData) => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    let loadedCount = 0;
    const totalFurniture = furnitureData.length;

    for (const furniture of furnitureData) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(
            `/models/${furniture.glb_file}`,
            resolve,
            (progress) => {
              const baseProgress = 30 + (loadedCount / totalFurniture) * 60;
              const itemProgress = (progress.loaded / progress.total) * (60 / totalFurniture);
              setLoadingProgress(Math.min(95, baseProgress + itemProgress));
            },
            reject
          );
        });

        const model = gltf.scene;
        
        // Position furniture
        if (furniture.position && Array.isArray(furniture.position)) {
          model.position.set(...furniture.position);
        }
        
        // Rotate furniture
        if (furniture.rotation && Array.isArray(furniture.rotation)) {
          model.quaternion.set(...furniture.rotation);
        }
        
        // Scale furniture
        if (furniture.scale && Array.isArray(furniture.scale)) {
          model.scale.set(...furniture.scale);
        }

        model.castShadow = true;
        model.receiveShadow = true;
        
        scene.add(model);
        loadedCount++;
        
      } catch (error) {
        console.warn('Failed to load furniture:', furniture, error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="room-visualizer-modal-overlay" onClick={onClose}>
      <div className="room-visualizer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{post.title} - 3D 미리보기</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p>3D 모델 로딩중... {Math.round(loadingProgress)}%</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="error-overlay">
              <p>{error}</p>
              <button onClick={onClose}>닫기</button>
            </div>
          )}
          
          <div 
            ref={mountRef} 
            className="threejs-container"
            style={{ width: '800px', height: '600px' }}
          />
        </div>
        
        <div className="modal-footer">
          <p className="help-text">마우스로 드래그하여 회전, 휠로 확대/축소</p>
        </div>
      </div>
    </div>
  );
};

export default RoomVisualizerModal;