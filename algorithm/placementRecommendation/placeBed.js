function isOverlapping(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function restPlace(elements) {
  const room = elements.find(el => el.type === "room");
  if (!room) return 0;

  const roomArea = room.x * room.y;
  const obstacleArea = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);

  return roomArea - obstacleArea;
}

function filterValidPositions(positions, elements, furniture) {
  const valid = [];

  for (const pos of positions) {
    const width = pos.isHorizon ? furniture.height : furniture.width;
    const height = pos.isHorizon ? furniture.width : furniture.height;

    const trial = {
      type: furniture.type,
      x: pos.x,
      y: pos.y,
      width,
      height,
      isHorizontal: pos.isHorizon
    };

    const overlaps = elements.some(el => {
      if (el.type === "room") return false;
      return isOverlapping(trial, el);
    });

    if (!overlaps) valid.push(trial);
  }

  return valid;
}

function findAvailableWalls(elements, room) {
  const windowWalls = [];
  for (const el of elements) {
    if (el.type === "window") {
      if (el.y === 0) windowWalls.push("top");
      else if (el.x === 0) windowWalls.push("left");
      else if (el.x + el.width === room.x) windowWalls.push("right");
      else if (el.y + el.height === room.y) windowWalls.push("bottom");
    }
  }
  return ["top", "bottom", "left", "right"].filter(w => !windowWalls.includes(w));
}

function generateWallBeltPositions(furniture, room, step = 10, belt = 30) {
  const positions = [];
  const walls = ["top", "bottom", "left", "right"];

  for (const wall of walls) {
    for (const isHorizon of [false, true]) {
      const width = isHorizon ? furniture.height : furniture.width;
      const height = isHorizon ? furniture.width : furniture.height;

      if (wall === "bottom") {
        for (let dy = 0; dy <= belt; dy += step) {
          const y = room.y - height - dy;
          for (let x = 0; x <= room.x - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "top") {
        for (let dy = 0; dy <= belt; dy += step) {
          const y = dy;
          for (let x = 0; x <= room.x - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "left") {
        for (let dx = 0; dx <= belt; dx += step) {
          const x = dx;
          for (let y = 0; y <= room.y - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "right") {
        for (let dx = 0; dx <= belt; dx += step) {
          const x = room.x - width - dx;
          for (let y = 0; y <= room.y - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      }
    }
  }
  return positions;
}

function selectRandomPosition(validPositions) {
  if (validPositions.length === 0) return null;
  const index = Math.floor(Math.random() * validPositions.length);
  return validPositions[index];
}

function addToElements(elements, furniture) {
  elements.push({
    type: furniture.type,
    x: furniture.x,
    y: furniture.y,
    width: furniture.width,
    height: furniture.height
  });
}


function placeBed(elements,design)
{
    // func restPlace여분공간 계산 함수
    let rest = 0; // 침대를 배치하기 위해 필요한 공간 최소예측치
    let reasons = [];
    const room = elements.find(el => el.type === "room");
    const bed = {
    type: "bed",
    width: 150,
    height: 200,
    };

    const step = 10; // 예: 후보 위치 계산 시 간격

    let positions = []; // 추천 position 후보들 저장하는 배열

    if (restPlace(elements) < bed.width * bed.height) 
      {
         reasons.push({ type: "bed", reason: "배치공간 부족" }); 
         return { elements, reasons }

      };
  
        // 추천 시작
        if(design === "modern") // 모던 배치 추천
      {
            // 충돌하지 않는 추천 모던 배치 선정 - 모던 스타일은 창문이 없는 벽면에 침대 우선 배치
           
            // 1. 창문이 없는 벽면 찾기
            const availableWalls = findAvailableWalls(elements, room);

    // 2. 후보위치 계산
    for (const wall of availableWalls) 
        {
        // 두 방향 모두 시도 (회전 여부)
        for (const isHorizon of [false, true]) 
            {
          // 현재 방향에서 가구의 크기
          const width = isHorizon ? bed.height : bed.width;
          const height = isHorizon ? bed.width : bed.height;
      
          if (wall === "bottom") 
            {
            const y = room.y - height;
            for (let x = 0; x <= room.x - width; x += step) 
                {
              positions.push({ x, y, isHorizon });
            }
      
          } 
          else if (wall === "top") 
            {
            const y = 0;
            for (let x = 0; x <= room.x - width; x += step) 
                {
              positions.push({ x, y, isHorizon });
            }
      
          } 
          else if (wall === "left") 
            {
            const x = 0;
            for (let y = 0; y <= room.y - height; y += step) 
                {
              positions.push({ x, y, isHorizon });
            }
      
          } 
          else if (wall === "right") 
            {
            const x = room.x - width;
            for (let y = 0; y <= room.y - height; y += step) 
                {
              positions.push({ x, y, isHorizon });
            }
          }
        }
      }

    // 3. 후보위치들 중 충돌 안하는 위치 선정 -- 2까지 완료
    let valid = filterValidPositions(positions, elements, bed);
    let chosen = selectRandomPosition(valid);        
    if (!chosen) {
      const fallbackPositions = generateWallBeltPositions(bed, room, step, 30);
      valid = filterValidPositions(fallbackPositions, elements, bed);
      chosen = selectRandomPosition(valid);

      if (chosen) {
        reasons.push({ type: "bed", reason: "벽 띠 영역에서 fallback 배치됨" });
      }
    } 
    else 
    {
      reasons.push({ type: "bed", reason: "모던 스타일: 창문 없는 벽에 배치됨" });
    }
    if (chosen) 
      {
      addToElements(elements, chosen);
    } 
    else 
    {
      // 여기 추가 랜덤 알고리즘 배치해야할듯
      console.log("침대 배치 실패: 모든 벽 탐색에서도 불가능");
    }
        }
        else if (design === "natural") // 내츄럴 배치 추천
        {
            
        }
    
    else
    {
        // 추천 X
    }

    return { elements, reasons };
}


module.exports = { placeBed };
