/*
// 원본이랑 달라진 점
// 1. room 객체 크기 필드명이 x, y → width, depth로 바뀜
//    room.x, room.y 대신 room.width, room.depth 사용
// 2. 나머지 로직, cellSize 기본값, 코드 스타일은 그대로임
*/
function isEmptySpaceConnected(elements, room, cellSize = 20) {
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
          grid[y][x] = 1; // 1 = 가구
        }
      }
    }
  }

  const key = (x, y) => `${x},${y}`;
  const visited = new Set();
  let totalEmpty = 0;
  let start = null;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0) {
        totalEmpty++;
        if (!start) start = [x, y];
      }
    }
  }

  if (!start) return true;

  const queue = [start];
  visited.add(key(...start));
  let reachable = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 && nx < cols &&
        ny >= 0 && ny < rows &&
        grid[ny][nx] === 0 &&
        !visited.has(key(nx, ny))
      ) {
        visited.add(key(nx, ny));
        queue.push([nx, ny]);
        reachable++;
      }
    }
  }

  return reachable === totalEmpty;
}

function hasFullySurroundedElement(elements, room) {
  function isBlocked(el) {
    const margin = 1;
    const directions = [
      { dx: -margin, dy: 0, width: margin, height: el.height },
      { dx: el.width, dy: 0, width: margin, height: el.height },
      { dx: 0, dy: -margin, width: el.width, height: margin },
      { dx: 0, dy: el.height, width: el.width, height: margin }
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
  const occupied = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);
  return roomArea - occupied;
}

function generateWallBeltPositions(furniture, room, step = 10, belt = 30) {
  const positions = [];
  for (const isHorizon of [false, true]) {
    const width = isHorizon ? furniture.height : furniture.width;
    const height = isHorizon ? furniture.width : furniture.height;
    for (let x = 0; x <= room.width - width; x += step) {
      for (let y = 0; y <= room.depth - height; y += step) {
        positions.push({ x, y, isHorizon });
      }
    }
  }
  return positions;
}

function isBackSpaceClear(pos, elements, desk, chairGap) {
  const room = elements.find(el => el.type === "room");
  const width = pos.isHorizon ? desk.height : desk.width;
  const height = pos.isHorizon ? desk.width : desk.height;
  const trial = { x: pos.x, y: pos.y, width, height };

  function isInsideRoom(area) {
    return (
      area.x >= 0 &&
      area.y >= 0 &&
      area.x + area.width <= room.width &&
      area.y + area.height <= room.depth
    );
  }

  function isAreaClear(area) {
    return isInsideRoom(area) &&
      !elements.some(el => el.type !== "room" && isOverlapping(area, el));
  }

  if (!pos.isHorizon) {
    const topArea = {
      x: trial.x,
      y: trial.y - chairGap,
      width: trial.width,
      height: chairGap
    };
    const bottomArea = {
      x: trial.x,
      y: trial.y + trial.height,
      width: trial.width,
      height: chairGap
    };
    return isAreaClear(topArea) || isAreaClear(bottomArea);
  } else {
    const leftArea = {
      x: trial.x - chairGap,
      y: trial.y,
      width: chairGap,
      height: trial.height
    };
    const rightArea = {
      x: trial.x + trial.width,
      y: trial.y,
      width: chairGap,
      height: trial.height
    };
    return isAreaClear(leftArea) || isAreaClear(rightArea);
  }
}

function isTooCloseToDoor(pos, elements, desk, threshold = 60) {
  const width = pos.isHorizon ? desk.height : desk.width;
  const height = pos.isHorizon ? desk.width : desk.height;
  const trial = { x: pos.x, y: pos.y, width, height };

  return elements.some(el => {
    if (el.type !== "door") return false;
    const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < threshold;
  });
}

function findAvailableWalls(elements, room) {
  const wallSet = new Set(["left", "right", "top", "bottom"]);
  for (const el of elements) {
    if (el.type === "window") {
      if (el.y === 0) wallSet.delete("top");
      else if (el.y + el.height === room.depth) wallSet.delete("bottom");
      else if (el.x === 0) wallSet.delete("left");
      else if (el.x + el.width === room.width) wallSet.delete("right");
    }
  }
  return [...wallSet];
}

function getPlacementScoreWithReason(pos, elements, room, design,furniture) {
  if(design=="cozy"){design="natural"}
  const x = pos.x;
const y = pos.y;
const width = pos.isHorizon ? furniture.height : furniture.width;
const height = pos.isHorizon ? furniture.width : furniture.height;
  let score = 0;
  const reasons = [];

  const longSide = Math.max(width, height);
  const longSideTouchingWall =
    (width === longSide && (y === 0 || y + height === room.depth)) ||
    (height === longSide && (x === 0 || x + width === room.width));

  if (longSideTouchingWall) {
    score += 100;
    reasons.push("긴 변이 벽에 붙어 있어 안정적인 배치");
  }

  const touchesWall =
    x === 0 || x + width === room.width ||
    y === 0 || y + height === room.depth;

  if (touchesWall) {
    score += 6;
    reasons.push("벽에 인접하여 공간 활용이 좋음");
  }

  const touchingFurniture = elements.some(el => {
    if (el.type === "room") return false;
    if (el.type === "window") return false;
    const box = {
      x: x - 1,
      y: y - 1,
      width: width + 2,
      height: height + 2
    };
    return isOverlapping(el, box);
  });
  if (touchingFurniture) {
    score += 2;
    reasons.push("다른 가구와 붙어 있어 구조적으로 안정");
  }

  const nearFurniture = elements.some(el => {
    if (el.type === "room") return false;
    if (el.type === "window") return false;
    const dx = Math.max(el.x - (x + width), x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (y + height), y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > 0 && dist <= 20;
  });
  if (nearFurniture) {
    score += 1;
    reasons.push("주변 가구와 가까워 동선이 효율적");
  }

  const farFromWardrobe = elements.every(el => {
    if (el.type !== "wardrobe") return true;
    const dx = Math.max(el.x - (x + width), x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (y + height), y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= 50;
  });
  if (farFromWardrobe) {
    score += 5;
    reasons.push("옷장과 충분한 거리를 확보");
  }

  if (design === "modern") {
    const nonWindowWalls = findAvailableWalls(elements, room);
    const wallTouches = [];

    if (x === 0) wallTouches.push("left");
    if (x + width === room.width) wallTouches.push("right");
    if (y === 0) wallTouches.push("top");
    if (y + height === room.depth) wallTouches.push("bottom");

    for (const wall of wallTouches) {
      if (nonWindowWalls.includes(wall)) {
        score += 5;
        reasons.push(`창문 없는 ${wall} 벽에 인접(모던 스타일 선호)`);
      }
    }

    const farFromBed = elements
      .filter(el => el.type === "bed")
      .every(el => {
        const bedCenterX = el.x + el.width / 2;
        const bedCenterY = el.y + el.height / 2;
        const deskCenterX = x + width / 2;
        const deskCenterY = y + height / 2;
        const dx = bedCenterX - deskCenterX;
        const dy = bedCenterY - deskCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 100;
      });

    if (farFromBed) {
      score += 5;
      reasons.push("침대와 충분한 거리 확보 (모던 스타일 선호)");
    }

    const nearDoor = elements
      .filter(el => el.type == "door")
      .some(door => {
        const doorCenterX = door.x + door.width / 2;
        const doorCenterY = door.y + door.height / 2;
        const deskCenterX = x + width / 2;
        const deskCenterY = y + height / 2;
        const dx = deskCenterX - doorCenterX;
        const dy = deskCenterY - doorCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= 100;
      });

    if (nearDoor && Math.random() < 0.3) {
      score += 5;
      reasons.push("문 근처에 배치되어 출입 동선에 유리 (모던 스타일 선호)");
    }
  }

  if (design === "natural") {
    const nearWindow = elements.some(el => {
      if (el.type !== "window") return false;
      const windowCenterX = el.x + el.width / 2;
      const windowCenterY = el.y + el.height / 2;
      const deskCenterX = x + width / 2;
      const deskCenterY = y + height / 2;
      const dx = deskCenterX - windowCenterX;
      const dy = deskCenterY - windowCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= 100;
    });

    if (nearWindow && Math.random() < 0.4) {
      score += 5;
      reasons.push("창문 근처로 자연광 활용 가능 (내추럴 스타일 선호, 확률 적용)");
    }

    const nearBed = elements
      .filter(el => el.type === "bed")
      .some(el => {
        const dx = Math.max(el.x - (x + width), x - (el.x + el.width), 0);
        const dy = Math.max(el.y - (y + height), y - (el.y + el.height), 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= 20;
      });

    if (nearBed && Math.random() < 0.4) {
      score += 5;
      reasons.push("침대 옆에 배치되어 아늑한 분위기 조성 (내추럴 스타일 선호, 확률 적용)");
    }
  }

  return { score, reasons };
}

function placeDesk(elements, design, deskData) {
  console.log("[placeDesk] Inputs:", { elements, design, deskData });
  const reasons = { desk: [] };
  const room = elements.find(el => el.type === "room");

  if (!deskData || !deskData.dimensions || typeof deskData.dimensions.width === 'undefined' || typeof deskData.dimensions.height === 'undefined') {
    console.error("[placeDesk] Error: deskData is missing or has invalid dimensions.", deskData);
    reasons.desk.push("책상 데이터 또는 치수 정보 누락");
    return { elements, reasons };
  }

  const desk = {
    type: "desk",
    width: deskData.dimensions.width,
    height: deskData.dimensions.height,
    depth: deskData.dimensions.depth,
    oid: deskData.oid,
    name: deskData.name,
    glb_file: deskData.glb_file
  };

  const step = 10;
  const belt = 30;
  const chairGap = design?.desk?.chairGap || 70;

  if (restPlace(elements) < desk.width * desk.height) {
    reasons.desk.push("공간 부족");
    return { elements, reasons };
  }

  let positions = generateWallBeltPositions(desk, room, step, belt);
  let validPositions = [];

  for (const pos of positions) {
    const trialWidth = pos.isHorizon ? desk.height : desk.width;
    const trialHeight = pos.isHorizon ? desk.width : desk.height;

    const trial = {
      type: desk.type,
      x: pos.x,
      y: pos.y,
      width: trialWidth,
      height: trialHeight,
      isHorizon: pos.isHorizon,
      oid: desk.oid,
      name: desk.name,
      glb_file: desk.glb_file
    };

    if (elements.some(el => el.type !== "room" && isOverlapping(el, trial))) continue;
    if (!isBackSpaceClear(pos, elements, desk, chairGap)) continue;
    if (isTooCloseToDoor(pos, elements, desk)) continue;
    
    const trialElements = [...elements, trial];
    if (!isEmptySpaceConnected(trialElements, room)) continue;
    if (hasFullySurroundedElement(trialElements, room)) continue;

    validPositions.push(pos);
  }

  if (validPositions.length === 0) {
    reasons.desk.push("조건에 맞는 위치 없음");
    return { elements, reasons };
  }

  

  const scoredPositions = validPositions.map(pos => {
    const { score, reasons: placementReasons } = getPlacementScoreWithReason(pos, elements, room, design,desk);
    return { ...pos, score, placementReasons };
  });
const bestH = scoredPositions.find(p => p.isHorizon);
const bestV = scoredPositions.find(p => !p.isHorizon);
console.log("수평 최고 점수:", bestH?.score, bestH);
console.log("수직 최고 점수:", bestV?.score, bestV);
  scoredPositions.slice(0, 10).forEach((pos, idx) => {
  console.log(`#${idx + 1}:`, pos);
});
console.log("=== 정렬 전 ===");
scoredPositions.slice(0, 5).forEach(p => console.log(p.score, p.isHorizon));

scoredPositions.sort((a, b) => b.score - a.score);

console.log("=== 정렬 후 ===");
scoredPositions.slice(0, 5).forEach(p => console.log(p.score, p.isHorizon));
  const bestPosition = scoredPositions[0];
  console.log("여기가 책상");
  console.log(bestPosition);
  if (!bestPosition) {
    reasons.desk.push("최적 위치 선정 실패");
    return { elements, reasons };
  }

  if (bestPosition.placementReasons) {
    reasons.desk.push(...bestPosition.placementReasons);
  }

  const placedDeskWidth = bestPosition.isHorizon ? desk.height : desk.width;
  const placedDeskHeight = bestPosition.isHorizon ? desk.width : desk.height;

  const placedDesk = {
    type: desk.type,
    oid: desk.oid,
    name: desk.name,
    glb_file: desk.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: placedDeskWidth,
    height: placedDeskHeight,
    isHorizon: bestPosition.isHorizon
  };
  elements.push(placedDesk);

  const deskDetails = {
    name: desk.name,
    type: "desk",
    oid: desk.oid,
    glb_file: desk.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: placedDeskWidth,
    height: placedDeskHeight,
    isHorizon: bestPosition.isHorizon
  };

  console.log("[placeDesk] Returning:", { element: deskDetails, reason: reasons });
  return {
    element: deskDetails,
    reason: reasons
  };
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

module.exports = { placeDesk };
