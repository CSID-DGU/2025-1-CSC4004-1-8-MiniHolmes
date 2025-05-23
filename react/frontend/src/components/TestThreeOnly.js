import React, { useRef, useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import * as THREE from 'three';

const TestThreeOnly = () => {
  const containerRef = useRef(null);
  const mountRef = useRef(null);
  // 초기 캔버스 크기와 원래 비율 저장
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isAutoResizing, setIsAutoResizing] = useState(true); // 자동 크기 조절 모드
  const initialAspectRatio = useRef(600 / 400); // 초기 종횡비 저장
  const lastManualSize = useRef({ width: 600, height: 400 }); // 마지막 수동 크기 저장
  
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 컨테이너 크기 측정 및 자동 조절
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerWidth = () => {
      if (containerRef.current) {
        const newContainerWidth = containerRef.current.clientWidth;
        setContainerWidth(newContainerWidth);
        
        // 자동 크기 조절 모드인 경우
        if (isAutoResizing) {
          const availableWidth = Math.max(300, newContainerWidth - 40); // 최소 300px, 패딩 고려
          
          // 컨테이너가 줄어들 때: 캔버스가 컨테이너보다 크면 줄이기
          if (canvasWidth > availableWidth) {
            const newWidth = availableWidth;
            const newHeight = newWidth / initialAspectRatio.current;
            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
          } 
          // 컨테이너가 늘어날 때: 이전 수동 크기까지 자동으로 늘리기
          else if (canvasWidth < lastManualSize.current.width && availableWidth > canvasWidth) {
            // 이전 수동 크기와 가용 공간 중 작은 값으로 설정
            const newWidth = Math.min(lastManualSize.current.width, availableWidth);
            const newHeight = newWidth / initialAspectRatio.current;
            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
          }
        }
      }
    };

    // 초기 측정
    updateContainerWidth();

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      updateContainerWidth();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasWidth, canvasHeight, isAutoResizing]);

  // Three.js 초기화
  useEffect(() => {
    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 카메라 설정
    const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
    camera.position.set(0, 200, 400);
    cameraRef.current = camera;
    
    // 렌더러 설정 - 초기 크기로 설정
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight, false);
    rendererRef.current = renderer;
    
    // 마운트 지점에 추가
    if (mountRef.current) {
      // 기존 자식 노드 제거
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);
    }
    
    // 바닥
    const floorGeometry = new THREE.PlaneGeometry(400, 400);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    
    // 뒷벽
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, side: THREE.DoubleSide });
    const backWallGeometry = new THREE.PlaneGeometry(400, 200);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -200;
    backWall.position.y = 100;
    scene.add(backWall);
    
    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 300, 100);
    scene.add(dirLight);
    
    // 애니메이션 루프
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    
    // 정리
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
    };
  }, []); // 의존성 배열을 비워 컴포넌트 마운트 시 한 번만 실행

  // 크기 변경 시 렌더러와 카메라 업데이트 (별도 useEffect로 분리)
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    
    // 렌더러 크기 설정 (내부 캔버스 크기)
    rendererRef.current.setSize(canvasWidth, canvasHeight, false);
    
    // 카메라 비율 업데이트
    cameraRef.current.aspect = canvasWidth / canvasHeight;
    cameraRef.current.updateProjectionMatrix();
  }, [canvasWidth, canvasHeight]);

  // ResizableBox의 최대 크기 제한 계산
  const maxWidth = containerWidth ? containerWidth - 40 : 1000; // 패딩 고려

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
              // 사용자가 수동으로 크기 조절 시 자동 모드 끄기
              setIsAutoResizing(false);
              
              // 크기 변경 시 상태 업데이트
              setCanvasWidth(data.size.width);
              setCanvasHeight(data.size.height);
              
              // 수동 조절 크기 저장
              lastManualSize.current = {
                width: data.size.width,
                height: data.size.height
              };
            }}
            onResizeStop={(e, data) => {
              // 리사이즈 완료 시 자동 모드 다시 켜기
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
                overflow: 'hidden'
              }} 
            />
          </ResizableBox>
        </div>
        
        {/* 크기 정보 표시 (디버깅용, 필요 시 제거) */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          캔버스 크기: {Math.round(canvasWidth)} x {Math.round(canvasHeight)} px
          {isAutoResizing ? ' (자동 조절 모드)' : ' (수동 조절 중)'}
        </div>
      </div>
      
      {/* 오른쪽 영역 */}
      <div style={{ width: '20%', minWidth: '100px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>오른쪽 영역</span>
      </div>
    </div>
  );
};

export default TestThreeOnly;