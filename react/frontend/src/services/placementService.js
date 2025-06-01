// src/services/placementService.js - 가구 배치 서비스

import { getAllFurniture } from './api';

// 자동 배치 함수
export const getAutoPlacement = async (selectedFurniture, roomDimensions) => {
  // selectedFurniture: 가구의 _id 배열 (ex: ['661...', ...])
  const response = await fetch('http://localhost:3001/api/furniture/auto-placement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ furniture: selectedFurniture, roomDimensions })
  });
  // 반환값: { placements: [ { _id, position, rotation, glb_file }, ... ] }
  return await response.json();
};

// 테스트용 대체 데이터
export const getMockPlacement = (furnitureList, roomDimensions) => {
  // 방 중앙을 (0,0)으로 간주
  const centerX = 0;
  const centerZ = 0;
  
  // 단순한 배치 알고리즘 (4분면에 가구 배치)
  const placements = furnitureList.map((furniture, index) => {
    const quadrant = index % 4; // 0: 좌상단, 1: 우상단, 2: 좌하단, 3: 우하단
    
    const width = roomDimensions.width || 400;
    const depth = roomDimensions.depth || 400;
    
    // 4분면 위치 계산
    let posX, posZ, rotY;
    
    switch (quadrant) {
      case 0: // 좌상단
        posX = centerX - width / 4;
        posZ = centerZ - depth / 4;
        rotY = 0;
        break;
      case 1: // 우상단
        posX = centerX + width / 4;
        posZ = centerZ - depth / 4;
        rotY = Math.PI / 2;
        break;
      case 2: // 좌하단
        posX = centerX - width / 4;
        posZ = centerZ + depth / 4;
        rotY = Math.PI;
        break;
      case 3: // 우하단
        posX = centerX + width / 4;
        posZ = centerZ + depth / 4;
        rotY = Math.PI * 3 / 2;
        break;
    }
    
    return {
      _id: furniture._id,
      position: {
        x: posX,
        y: furniture.dimensions.height / 2,
        z: posZ
      },
      rotation: {
        x: 0,
        y: rotY,
        z: 0
      }
    };
  });
  
  return {
    placements,
    message: `${placements.length}개의 가구가 자동 배치되었습니다.`
  };
};