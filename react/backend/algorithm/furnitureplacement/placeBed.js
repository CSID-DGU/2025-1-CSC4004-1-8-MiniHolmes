function hasFullySurroundedElement(elements, room) {
  function isBlocked(el) {
    const margin = 1;

    const directions = [
      { dx: -margin, dy: 0, width: margin, height: el.height }, // 좌측
      { dx: el.width, dy: 0, width: margin, height: el.height }, // 우측
      { dx: 0, dy: -margin, width: el.width, height: margin }, // 상단
      { dx: 0, dy: el.height, width: el.width, height: margin } // 하단
    ];

    let blocked = 0;

    for (const dir of directions) {
      const testBox = {
        x: el.x + dir.dx,
        y: el.y + dir.dy,
        width: dir.width,
        height: dir.height
      };

      const outOfRoom =
        testBox.x < 0 || testBox.y < 0 ||
        testBox.x + testBox.width > room.width ||
        testBox.y + testBox.height > room.depth;

      const blockedByOther = elements.some(other =>
        other !== el &&
        other.type !== "room" &&
        isOverlapping(other, testBox)
      );

      if (outOfRoom || blockedByOther) {
        blocked++;
      }
    }

    return blocked === 4;
  }

  return elements.some(el => el.type !== "room" && isBlocked(el));
}

function isEmptySpaceConnected(elements, room, cellSize = 10) {
  const rows = Math.ceil(room.depth / cellSize);
  const cols = Math.ceil(room.width / cellSize);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (const el of elements) {
    if (el.type === "room") continue;
    const x0 = Math.floor(el.x / cellSize);
    const y0 = Math.floor(el.y / cellSize);
    const x1 = Math.floor((el.x + el.width) / cellSize);
    const y1 = Math.floor((el.y + el.height) / cellSize);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
          grid[y][x] = 1; // 1은 장애물(가구)을 의미
        }
      }
    }
  }

  const key = (x, y) => `${x},${y}`;
  const visited = new Set();
  let totalEmpty = 0;
  let start = null;

  // 그리드에서 0 (빈 공간)인 시작 위치 탐색
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0) {
        totalEmpty++;
        if (!start) start = [x, y];
      }
    }
  }

  if (!start) return true; // 빈 공간이 없으면 연결된 것으로 간주 (더 이상 탐색할 빈 공간 없음)

  // BFS (너비 우선 탐색) 시작
  const queue = [start];
  visited.add(key(...start));
  let reachable = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
        grid[ny][nx] === 0 && !visited.has(key(nx, ny))
      ) {
        visited.add(key(nx, ny));
        queue.push([nx, ny]);
        reachable++;
      }
    }
  }

  return reachable === totalEmpty;
}

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

  const roomArea = room.width * room.depth;
  const obstacleArea = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);

  return roomArea - obstacleArea;
}

function filterValidPositions(positions, elements, furniture) {
  const valid = [];
  console.log("[filterValidPositions] Starting with", positions.length, "positions");
  console.log("[filterValidPositions] Elements:", elements);
  console.log("[filterValidPositions] Furniture (expecting footprintWidth/Depth):", furniture); // furniture 객체에서 footprintWidth와 footprintDepth를 사용할 것으로 예상

  for (const pos of positions) {
    // furniture 객체의 footprintWidth와 footprintDepth를 사용하여 현재 방향에 맞는 너비와 높이 계산
    const width = pos.isHorizon ? furniture.footprintDepth : furniture.footprintWidth;
    const height = pos.isHorizon ? furniture.footprintWidth : furniture.footprintDepth;

    const trial = {
      type: furniture.type,
      x: pos.x,
      y: pos.y,
      width,
      height,
      isHorizon: pos.isHorizon
    };

    const overlaps = elements.some(el => {
      if (el.type === "room") return false;
      if (el.type === "partition_wall" || trial.type === "bed") {
        // console.log(`[filterValidPositions] 침대 시도 위치: (x:${trial.x}, y:${trial.y}, w:${trial.width}, h:${trial.height}) 와 요소: (type:${el.type}, x:${el.x}, y:${el.y}, w:${el.width}, h:${el.height}) 간의 겹침 확인`);
      }
      const overlapping = isOverlapping(trial, el);
      if (overlapping && el.type === "partition_wall") {
        console.log(`[filterValidPositions - furnitureplacement] Bed trial ${JSON.stringify(trial)} overlaps with partition_wall ${JSON.stringify(el)}`);
      }
      return overlapping;
    });

    if (!overlaps) {
      const trialElements = [...elements, trial];
      const room = elements.find(el => el.type === "room");

      const connected = isEmptySpaceConnected(trialElements, room);
      const notTrapped = !hasFullySurroundedElement(trialElements, room);

      if (connected && notTrapped) {
        valid.push(trial);
      } else {
        console.log("[filterValidPositions] Position rejected:", {
          position: trial,
          connected,
          notTrapped
        });
      }
    }
  }

  console.log("[filterValidPositions] Found", valid.length, "valid positions");
  return valid;
}

function findAvailableWalls(elements, room) {
  const allWalls = ["top", "bottom", "left", "right"];
  const windowWallNames = new Set();
  console.log("[findAvailableWalls] Initializing. Processing elements:", JSON.stringify(elements.map(e => ({type: e.type, wall: e.wall})))); // 요소 유형 및 연결된 벽 로깅

  const wallNameToInternal = {
    north: "top",
    south: "bottom",
    west: "left",
    east: "right",
  };

  for (const el of elements) {
    // console.log("[findAvailableWalls] Checking element:", JSON.stringify(el)); // 로그가 너무 많아질 수 있으므로 주석 처리
    if (el.type === "window" && el.wall) {
      console.log(`[findAvailableWalls] Found window element with wall: ${el.wall}`);
      const wallKey = el.wall.toLowerCase();
      const internalWallName = wallNameToInternal[wallKey];
      console.log(`[findAvailableWalls] Window el.wall: '${el.wall}', lowercase key: '${wallKey}', mapped internalName: '${internalWallName}'`);
      if (internalWallName) {
        windowWallNames.add(internalWallName);
        console.log("[findAvailableWalls] Added '${internalWallName}' to windowWallNames. Current set:", Array.from(windowWallNames)); // 작은따옴표 수정
      } else {
        console.log("[findAvailableWalls] No internal mapping for wall key: '${wallKey}'"); // 작은따옴표 수정
      }
    } else if (el.type === "window") {
      console.log("[findAvailableWalls] Found window element but it's missing a .wall property:", JSON.stringify(el)); // 창문 요소에 .wall 속성이 없는 경우 로깅
    }
  }

  const nonWindowWalls = allWalls.filter(wall => !windowWallNames.has(wall)); // 창문이 없는 벽 필터링
  const windowWallsList = Array.from(windowWallNames); // 창문이 있는 벽 목록
  
  console.log("[findAvailableWalls] Final result - nonWindowWalls:", nonWindowWalls, "windowWalls:", windowWallsList);
  return { nonWindowWalls, windowWalls: windowWallsList };
}

function generateWallBeltPositions(furniture, room, step = 10, belt = 30) {
  const positions = [];
  const walls = ["top", "bottom", "left", "right"];
  console.log("[generateWallBeltPositions] Furniture (expecting footprintWidth/Depth):", furniture); // furniture 객체에서 footprintWidth와 footprintDepth를 사용할 것으로 예상

  for (const wall of walls) {
    for (const isHorizon of [false, true]) {
      // furniture 객체의 footprintWidth와 footprintDepth를 사용하여 현재 방향에 맞는 너비와 높이 계산
      const width = isHorizon ? furniture.footprintDepth : furniture.footprintWidth;
      const height = isHorizon ? furniture.footprintWidth : furniture.footprintDepth;

      if (!width || !height) {
        console.warn("[generateWallBeltPositions] Undefined width/height for furniture:", furniture, "isHorizon:", isHorizon);
        continue; // 너비 또는 높이가 정의되지 않았으면 이 방향은 건너뜀
      }

      if (wall === "bottom") {
        for (let dy = 0; dy <= belt; dy += step) {
          const y = room.depth - height - dy;
          for (let x = 0; x <= room.width - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "top") {
        for (let dy = 0; dy <= belt; dy += step) {
          const y = dy;
          for (let x = 0; x <= room.width - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "left") {
        for (let dx = 0; dx <= belt; dx += step) {
          const x = dx;
          for (let y = 0; y <= room.depth - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      } else if (wall === "right") {
        for (let dx = 0; dx <= belt; dx += step) {
          const x = room.width - width - dx;
          for (let y = 0; y <= room.depth - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      }
    }
  }
  return positions;
}

function getWallAndFurnitureTightnessScore(p, elements, room) {
  let score = 0;
  const reasons = [];
  // p (위치) 객체는 이미 주어진 방향에 대한 정확한 footprint 너비/높이를 포함하고 있음
  // placeBed 함수의 footprintForScoring에서 생성되었거나, 다른 곳에서 직접 전달된 경우임.

  if (p.x === 0 || p.x + p.width === room.width) score = score + 2; // 좌우 벽에 붙으면 +2점
  if (p.y === 0 || p.y + p.height === room.depth) score = score + 2; // 상하 벽에 붙으면 +2점

  let scoreflag = 0; // 다른 가구와 접촉했는지 여부 플래그

  let wallTouchCount = 0; // 벽에 몇 면이 닿았는지 카운트
    if (p.x === 0) wallTouchCount++;
    if (p.x + p.width === room.width) wallTouchCount++;
    if (p.y === 0) wallTouchCount++;
    if (p.y + p.height === room.depth) wallTouchCount++;

    
    if (wallTouchCount > 0) {
      const wallScore = wallTouchCount * 10;
      score += wallScore;
      reasons.push(`벽 ${wallTouchCount}면에 인접하여 안정적인 배치 (+${wallScore})`);
    }

  for (const el of elements) {
    if (el.type === "room") continue;

    if (el.type === "door") {
      const dx = Math.max(el.x - (p.x + p.width), p.x - (el.x + el.width), 0);
      const dy = Math.max(el.y - (p.y + p.height), p.y - (el.y + el.height), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        score -= 100;
        reasons.push("문 주변에 배치됨(-100)");
      }
      else {
        score += 2;
        reasons.push("문 주변에 배치 피함(+2)");
      };
      continue;
    }

    const touching =
      ((p.x === el.x + el.width || p.x + p.width === el.x) &&
        !(p.y + p.height <= el.y || p.y >= el.y + el.height)) ||
      ((p.y === el.y + el.height || p.y + p.height === el.y) &&
        !(p.x + p.width <= el.x || p.x >= el.x + el.width));

    if (touching) {score += 2; scoreflag = 1};

  }

  if(scoreflag==1) {reasons.push("가구 주변에 배치됨(+2)");};

  return {score,reasons};
}

function selectRandomFromBestScored(positions, elements, room) {
  if (positions.length === 0) return null;

  const scored = positions.map(p => {
    const { score, reasons } = getWallAndFurnitureTightnessScore(p, elements, room);
    return {
      ...p,
      score,
      reasons
    };
  });

  const maxScore = Math.max(...scored.map(p => p.score));
  const topCandidates = scored.filter(p => p.score === maxScore);
  const index = Math.floor(Math.random() * topCandidates.length);

  const { score, ...chosen } = topCandidates[index];
  return chosen; 
}

function addToElements(elements, furniture) {
  elements.push({
    type: furniture.type,
    oid: furniture.oid,
    name: furniture.name,
    glb_file: furniture.glb_file,
    x: furniture.x,
    y: furniture.y,
    width: furniture.width,
    height: furniture.height,
    isHorizon: furniture.isHorizon
  });
}

function placeBed(elements, design, bedData) {
  console.log("[placeBed] Inputs:", { elements, design, bedData });
  const reasons = { bed: [] };
  const room = elements.find(el => el.type === "room");
  console.log("[placeBed] Room dimensions:", room);
  
  if (!bedData || !bedData.dimensions || typeof bedData.dimensions.width === 'undefined' || typeof bedData.dimensions.depth === 'undefined' || typeof bedData.dimensions.height === 'undefined') {
    console.error("[placeBed] Error: bedData is missing or has invalid dimensions (width, depth, height required).", bedData);
    reasons.bed.push("침대 데이터 또는 치수 정보(폭, 깊이, 높이) 누락");
    return { elements, reasons };
  }

  // 2D 바닥 면적 로직과 실제 3D 모델 높이에 대해 명확한 변수명 사용
  const bedLogic = {
    type: "bed",
    footprintWidth: bedData.dimensions.width,    // 침대가 바닥에서 차지하는 너비
    footprintDepth: bedData.dimensions.depth,    // 침대가 바닥에서 차지하는 깊이
    // actual3DHeight: bedData.dimensions.height, // 모델의 실제 높이, 2D 바닥 배치 로직에는 사용 안 함
    oid: bedData.oid,
    name: bedData.name,
    glb_file: bedData.glb_file
  };
  console.log("[placeBed] Bed Logic Object:", bedLogic);
  
  const step = 10;
  const belt = 30;

  // footprint 치수를 사용하여 공간 확인
  if (restPlace(elements) < bedLogic.footprintWidth * bedLogic.footprintDepth) {
    reasons.bed.push("공간 부족");
    return { elements, reasons };
  }

  const availableWalls = findAvailableWalls(elements, room);
  console.log("[placeBed] Available walls:", { nonWindowWalls: availableWalls.nonWindowWalls, windowWalls: availableWalls.windowWalls });

  // bedLogic을 generatePositions 함수에 전달. footprintWidth와 footprintDepth를 사용함.
  let positions = generateWallBeltPositions(bedLogic, room, step, belt);
  positions = positions.filter(pos => {
    // 이 위치가 주로 어떤 벽에 붙어 있는지 결정
    const effectiveWidth = pos.isHorizon ? bedLogic.footprintDepth : bedLogic.footprintWidth;
    const effectiveDepth = pos.isHorizon ? bedLogic.footprintWidth : bedLogic.footprintDepth;
    
    const wall = pos.x === 0 ? "left" : // 좌측 벽
                 pos.x + effectiveWidth === room.width ? "right" : // 우측 벽
                 pos.y === 0 ? "top" : // 상단 벽
                 pos.y + effectiveDepth === room.depth ? "bottom" : null; // 하단 벽, 해당 없으면 null
    return wall && availableWalls.nonWindowWalls.includes(wall); // 해당 벽이 창문 없는 벽 목록에 있는지 확인
  });

  // bedLogic을 filterValidPositions 함수에 전달. footprintWidth와 footprintDepth를 사용함.
  let validPositions = filterValidPositions(positions, elements, bedLogic);

  if (validPositions.length === 0) {
    reasons.bed.push("창문 없는 벽에 배치 가능한 위치 없음, 벽 띠 fallback 위치 사용");
    positions = generateWallBeltPositions(bedLogic, room, step, belt); // 모든 벽에 대한 위치 다시 생성
    validPositions = filterValidPositions(positions, elements, bedLogic); // 유효 위치 다시 필터링
    if (validPositions.length === 0) {
      reasons.bed.push("모든 벽 띠에서도 배치 가능한 위치 없음");
      return { elements, reasons };
    }
  }

  const scoredPositions = validPositions.map(pos => {
    // getWallAndFurnitureTightnessScore 함수는 footprint에 대한 .width와 .height를 기대함
    const footprintForScoring = {
        ...pos, // x, y, isHorizon 정보 복사
        width: pos.isHorizon ? bedLogic.footprintDepth : bedLogic.footprintWidth, // 현재 방향에 맞는 너비
        height: pos.isHorizon ? bedLogic.footprintWidth : bedLogic.footprintDepth // 현재 방향에 맞는 높이 (깊이)
    };
    const { score, reasons: scoreReasons } = getWallAndFurnitureTightnessScore(footprintForScoring, elements, room);
    return { ...pos, score, reasons: scoreReasons }; 
  });

  const bestPosition = selectRandomFromBestScored(scoredPositions, elements, room);

  if (!bestPosition) {
    reasons.bed.push("최적 위치 선정 실패");
    return { elements, reasons };
  }

  if (bestPosition.reasons) {
    reasons.bed.push(...bestPosition.reasons);
  } else {
    reasons.bed.push("벽 띠 fallback 위치에 배치됨");
  }

  // *반환되는 요소*의 너비와 높이는 바닥의 2D footprint를 나타내야 함.
  // 프론트엔드는 실제 3D 모델 높이에 `placedItem.dimensions.height`를 사용함.
  const placedFootprintWidth = bestPosition.isHorizon ? bedLogic.footprintDepth : bedLogic.footprintWidth;
  const placedFootprintDepth = bestPosition.isHorizon ? bedLogic.footprintWidth : bedLogic.footprintDepth;

  const placedBedForElementsArray = {
    type: bedLogic.type,
    oid: bedLogic.oid,
    name: bedLogic.name,
    glb_file: bedLogic.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: placedFootprintWidth,  
    height: placedFootprintDepth, // 이것은 footprint 깊이임
    isHorizon: bestPosition.isHorizon
  };
  elements.push(placedBedForElementsArray);

  const bedDetailsToReturn = {
    name: bedLogic.name,
    type: "bed",
    oid: bedLogic.oid,
    glb_file: bedLogic.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: placedFootprintWidth,  // API 응답을 위한 footprint 너비
    height: placedFootprintDepth, // API 응답을 위한 footprint 깊이 (클라이언트에서 2D 맵의 높이로 사용됨)
    isHorizon: bestPosition.isHorizon,
    // 프론트엔드가 필요에 따라 3D 스케일링에 사용할 수 있도록 원본 치수 유지
    // 하지만 프론트엔드는 주로 주 가구 목록의 치수를 3D 모델 높이에 사용해야 함.
    // 일관성을 위해 bedData의 주 `dimensions` 객체도 전달되거나 접근 가능하도록 보장.
    // server.js는 이미 originalFurnitureData.dimensions를 클라이언트로 전송되는 요소에 병합함.
  };

  console.log("[placeBed] Returning:", { element: bedDetailsToReturn, reasons: reasons });
  return {
    element: bedDetailsToReturn,
    reasons: reasons 
  };
}

module.exports = { placeBed };
