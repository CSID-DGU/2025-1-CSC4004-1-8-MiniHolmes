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
  const animationFrameRef = useRef(null);
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
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            if (object.material.normalMap) object.material.normalMap.dispose();
            if (object.material.roughnessMap) object.material.roughnessMap.dispose();
            if (object.material.metalnessMap) object.material.metalnessMap.dispose();
            object.material.dispose();
          }
        }
      });
      sceneRef.current.clear();
      sceneRef.current = null;
    }
    
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    if (rendererRef.current) {
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
  };

  const initializeScene = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);

      // Get room configuration from post
      const roomConfig = post.roomConfiguration || {};
      const roomSize = {
        width: roomConfig.roomSize?.width || post.roomDimensions?.width || 400,
        depth: roomConfig.roomSize?.depth || post.roomDimensions?.depth || 400,
        height: roomConfig.roomSize?.height || post.roomDimensions?.height || 240
      };
      const doors = roomConfig.doors || [];
      const windows = roomConfig.windows || [];
      
      console.log('Room data for preview:', { roomSize, doors, windows, furniture: post.placementData?.furniture });

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

      // Lighting - Match main RoomVisualizer lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(2, 3, 1); // m units - same as main visualizer
      dirLight.castShadow = true;
      scene.add(dirLight);

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
        animationFrameRef.current = requestAnimationFrame(animate);
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

    // Add doors
    doors.forEach(door => {
      if (door.width && door.height) {
        const doorGeometry = new THREE.PlaneGeometry(door.width * CM_TO_M, door.height * CM_TO_M);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
        
        const doorWidth = door.width * CM_TO_M;
        const doorHeight = door.height * CM_TO_M;
        const offset = (door.offset || 0) * CM_TO_M;
        
        // Position door based on wall
        switch (door.wall) {
          case 'north':
            doorMesh.position.set(width/2 - offset - doorWidth/2, doorHeight/2, depth/2 - 0.01);
            doorMesh.rotation.y = Math.PI;
            break;
          case 'south':
            doorMesh.position.set(-width/2 + offset + doorWidth/2, doorHeight/2, -depth/2 + 0.01);
            break;
          case 'east':
            doorMesh.position.set(width/2 - 0.01, doorHeight/2, -depth/2 + offset + doorWidth/2);
            doorMesh.rotation.y = -Math.PI/2;
            break;
          case 'west':
            doorMesh.position.set(-width/2 + 0.01, doorHeight/2, depth/2 - offset - doorWidth/2);
            doorMesh.rotation.y = Math.PI/2;
            break;
        }
        
        scene.add(doorMesh);
      }
    });

    // Add windows
    windows.forEach(window => {
      if (window.width && window.height) {
        const windowGeometry = new THREE.PlaneGeometry(window.width * CM_TO_M, window.height * CM_TO_M);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x87CEEB, 
          transparent: true, 
          opacity: 0.6 
        });
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        
        const windowWidth = window.width * CM_TO_M;
        const windowHeight = window.height * CM_TO_M;
        const offset = (window.offset || 0) * CM_TO_M;
        const altitude = (window.altitude || 100) * CM_TO_M;
        
        // Position window based on wall
        switch (window.wall) {
          case 'north':
            windowMesh.position.set(width/2 - offset - windowWidth/2, altitude + windowHeight/2, depth/2 - 0.01);
            windowMesh.rotation.y = Math.PI;
            break;
          case 'south':
            windowMesh.position.set(-width/2 + offset + windowWidth/2, altitude + windowHeight/2, -depth/2 + 0.01);
            break;
          case 'east':
            windowMesh.position.set(width/2 - 0.01, altitude + windowHeight/2, -depth/2 + offset + windowWidth/2);
            windowMesh.rotation.y = -Math.PI/2;
            break;
          case 'west':
            windowMesh.position.set(-width/2 + 0.01, altitude + windowHeight/2, depth/2 - offset - windowWidth/2);
            windowMesh.rotation.y = Math.PI/2;
            break;
        }
        
        scene.add(windowMesh);
      }
    });
  };

  const loadFurniture = async (scene, furnitureData) => {
    console.log('Loading furniture data:', furnitureData);
    
    if (!furnitureData || !Array.isArray(furnitureData) || furnitureData.length === 0) {
      console.log('No furniture data to load');
      return;
    }

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    let loadedCount = 0;
    const totalFurniture = furnitureData.length;

    for (const furniture of furnitureData) {
      try {
        console.log('Loading furniture item:', furniture);
        
        // Handle different possible furniture data structures
        const modelPath = furniture.glb_file || furniture.model || furniture.glbFile;
        if (!modelPath) {
          console.warn('No model path found for furniture:', furniture);
          continue;
        }

        const gltf = await new Promise((resolve, reject) => {
          loader.load(
            `/models/${modelPath}`,
            resolve,
            (progress) => {
              if (progress.total > 0) {
                const baseProgress = 30 + (loadedCount / totalFurniture) * 60;
                const itemProgress = (progress.loaded / progress.total) * (60 / totalFurniture);
                setLoadingProgress(Math.min(95, baseProgress + itemProgress));
              }
            },
            reject
          );
        });

        const model = gltf.scene;
        
        // Position furniture - handle different data structures
        if (furniture.position && Array.isArray(furniture.position) && furniture.position.length >= 3) {
          model.position.set(...furniture.position);
        } else if (furniture.x !== undefined && furniture.y !== undefined && furniture.z !== undefined) {
          model.position.set(furniture.x, furniture.y, furniture.z);
        } else {
          // Default position if no positioning data
          model.position.set(0, 0, 0);
        }
        
        // Rotate furniture
        if (furniture.rotation && Array.isArray(furniture.rotation) && furniture.rotation.length >= 4) {
          model.quaternion.set(...furniture.rotation);
        } else if (furniture.rotationY !== undefined) {
          model.rotation.y = furniture.rotationY;
        }
        
        // Scale furniture
        if (furniture.scale && Array.isArray(furniture.scale) && furniture.scale.length >= 3) {
          model.scale.set(...furniture.scale);
        } else if (furniture.scaleX && furniture.scaleY && furniture.scaleZ) {
          model.scale.set(furniture.scaleX, furniture.scaleY, furniture.scaleZ);
        } else {
          model.scale.set(1, 1, 1);
        }

        model.castShadow = true;
        model.receiveShadow = true;
        
        scene.add(model);
        loadedCount++;
        console.log(`Loaded furniture ${loadedCount}/${totalFurniture}:`, furniture.name || modelPath);
        
      } catch (error) {
        console.warn('Failed to load furniture:', furniture, error);
        loadedCount++; // Still increment to prevent hanging
      }
    }
    
    console.log(`Finished loading furniture: ${loadedCount}/${totalFurniture} items`);
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
