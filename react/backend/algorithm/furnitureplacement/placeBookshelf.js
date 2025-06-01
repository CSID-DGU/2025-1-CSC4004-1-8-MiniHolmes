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

const getBlockedWallsFromWindows = (elements, room) => {
  const blockedWalls = new Set();

  for (const el of elements) {
    if (el.type !== "window") continue;

    if (el.width >= el.height) {
      if (el.y === 0) blockedWalls.add("top");
      else if (el.y + el.height === room.depth) blockedWalls.add("bottom");
    }

    if (el.height > el.width) {
      if (el.x === 0) blockedWalls.add("left");
      else if (el.x + el.width === room.width) blockedWalls.add("right");
    }
  }

  return blockedWalls;
};

const hasFullySurroundedElement = (elements, room) => {
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
};


const isOverlapping = (a, b) => {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
};

const restPlace = (elements) => {
  const room = elements.find(el => el.type === "room");
  if (!room) return 0;
  const roomArea = room.width * room.depth;
  const occupied = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);
  return roomArea - occupied;
};

const generateWallBeltPositions = (furniture, room, step = 10, belt = 30) => {
  const positions = [];
  const isHorizon = false; // 책장은 일반적으로 벽에 수직으로 배치됨

  // furniture 객체의 실제 치수 사용
  const footprintWidth = furniture.width;
  const footprintDepth = furniture.depth || furniture.height; // depth를 사용할 수 없는 경우 height로 대체

  // placementWidth와 placementHeight는 2D 평면도의 치수
  const placementWidth = isHorizon ? footprintDepth : footprintWidth;
  const placementHeight = isHorizon ? footprintWidth : footprintDepth;

  const walls = ["top", "bottom", "left", "right"];

  for (const wall of walls) {
    let dx = 0;
    let dy = 0;

    switch (wall) {
      case "top":
        dx = 0;
        dy = belt;
        break;
      case "bottom":
        dx = 0;
        dy = room.depth - belt - placementHeight;
        break;
      case "left":
        dx = belt;
        dy = 0;
        break;
      case "right":
        dx = room.width - belt - placementWidth;
        dy = 0;
        break;
    }

    const x = dx;
    const y = dy;
    for (let x = 0; x <= room.width - placementWidth; x += step) {
      positions.push({ x, y, isHorizontal: isHorizon });
    }
  }

  return positions;
};

const isNearType = (trial, elements, type, maxDist) => {
  return elements.some(el => {
    if (el.type !== type) return false;
    const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < maxDist;
  });
};

const isTooCloseToDoor = (trial, elements, limit = 60) => {
  return elements.some(el => {
    if (el.type !== "door") return false;
    const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < limit;
  });
};

const isBehindDesk = (trial, elements, chairGap = 70) => {
  return elements.some(el => {
    if (el.type !== "desk") return false;

    const desk = el;
    let backArea;

    if (desk.width > desk.height) {
      backArea = {
        x: desk.x,
        y: desk.y + desk.height,
        width: desk.width,
        height: chairGap
      };
    } else {
      backArea = {
        x: desk.x + desk.width,
        y: desk.y,
        width: chairGap,
        height: desk.height
      };
    }

    return isOverlapping(trial, backArea);
  });
};

const getBookshelfScore = (pos, elements, room) => {
  const EPS = 1;
  const shelfWidth = 80;
  const shelfHeight = 30;

  const width = pos.isHorizontal ? shelfHeight : shelfWidth;
  const height = pos.isHorizontal ? shelfWidth : shelfHeight;
  const trial = { x: pos.x, y: pos.y, width, height };

  let score = 0;
  const longSide = Math.max(width, height);
  const isHorizontal = width === longSide;

  const touchesLongSideWall =
    (isHorizontal &&
      (Math.abs(trial.y - 0) <= EPS || Math.abs(trial.y + height - room.depth) <= EPS)) ||
    (!isHorizontal &&
      (Math.abs(trial.x - 0) <= EPS || Math.abs(trial.x + width - room.width) <= EPS));

  if (touchesLongSideWall) score += 6;

  const touchesWall =
    Math.abs(trial.x - 0) <= EPS || Math.abs(trial.y - 0) <= EPS ||
    Math.abs(trial.x + width - room.width) <= EPS || Math.abs(trial.y + height - room.depth) <= EPS;

  if (touchesWall) score += 4;

  const touchingFurniture = elements.some(el => {
    if (el.type === "room") return false;
    const box = {
      x: trial.x - 1,
      y: trial.y - 1,
      width: width + 2,
      height: height + 2
    };
    return isOverlapping(el, box);
  });
  if (touchingFurniture) score += 2;

  const nearFurniture = elements.some(el => {
    if (el.type === "room") return false;
    const dx = Math.max(el.x - (trial.x + width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > 0 && dist <= 20;
  });
  if (nearFurniture) score += 1;


  const blockedWalls = getBlockedWallsFromWindows(elements, room);

    // 책장이 어느 벽에 붙었는지 판단
    const wallTouches = [];
    if (Math.abs(trial.x - 0) <= EPS) wallTouches.push("left");
    if (Math.abs(trial.x + width - room.width) <= EPS) wallTouches.push("right");
    if (Math.abs(trial.y - 0) <= EPS) wallTouches.push("top");
    if (Math.abs(trial.y + height - room.depth) <= EPS) wallTouches.push("bottom");

    // 가중치 적용
    for (const wall of wallTouches) {
      if (blockedWalls.has(wall)) {
        score -= 5;
      } else {
        score += 5;
      }
    }

  return score;
};

const placeBookshelf = (elements, bookshelfData) => {
  console.log("[placeBookshelf] Inputs:", { elements, bookshelfData });
  const reasons = { bookshelf: [] };
  const room = elements.find(el => el.type === "room");
  
  // bookshelfData에서 책장 정보 추출 및 기본값 설정
  const shelf = { 
    type: "bookshelf", 
    width: bookshelfData.dimensions.width, // 책장의 너비
    height: bookshelfData.dimensions.height, // 책장의 높이 (3D 모델의 높이)
    depth: bookshelfData.dimensions.depth, // 책장의 깊이 (두께)
    oid: bookshelfData.oid,
    name: bookshelfData.name,
    glb_file: bookshelfData.glb_file,
    isHorizon: false // 책장은 일반적으로 회전하지 않고 세로로 배치됨
  };
  
  const step = 10; // 위치 탐색 시 이동 간격

  // 방의 남은 공간이 책장 면적(너비*깊이)보다 작으면 배치 불가
  if (restPlace(elements) < shelf.width * shelf.depth) { 
    reasons.bookshelf.push("공간 부족");
    return { elements, reasons }; // 현재 요소 목록과 이유 반환
  }

  // 책장을 배치할 후보 위치 생성 (벽 주변)
  const positions = generateWallBeltPositions(shelf, room, step, 30); 
  const valid = [];

  for (const pos of positions) {
    const trial = {
      ...shelf, // 기존 책장 정보 복사
      x: pos.x, // 후보 위치 x 좌표
      y: pos.y, // 후보 위치 y 좌표
      // 충돌/겹침 확인을 위한 너비(shelf.width)와 높이(여기서는 shelf.depth를 사용해야 함, 2D 평면 기준)는 shelf 객체의 것을 사용.
      // isHorizon은 shelf에 정의된 대로 false.
    };

    let overlap = false; // 다른 가구와 겹치는지 여부
    for (const el of elements) {
      if (el.type === "room") continue;
      if (isOverlapping(trial, el)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      valid.push(pos);
    }
  }

  if (valid.length === 0) {
    reasons.bookshelf.push("배치 가능한 유효한 위치 없음");
    // 유효 위치가 없으면 현재 요소 목록과 이유 반환
    return { elements, reasons };
  }

  let bestScore = -Infinity; // 최고 점수 초기화
  let bestPosition = null; // 최적 위치 초기화

  for (const pos of valid) {
    const score = getBookshelfScore(pos, elements, room); // 현재 위치의 점수 계산
    if (score > bestScore) { // 최고 점수보다 높으면 갱신
      bestScore = score;
      bestPosition = pos;
    }
  }

  if (!bestPosition) {
    reasons.bookshelf.push("최적 위치를 찾지 못했습니다.");
    return { elements, reasons }; // 최적 위치 없으면 현재 요소 목록과 이유 반환
  }

  // 최적 위치에 책장 정보 결합
  const bestPositionWithElement = {
    ...shelf, // 기존 책장 정보 복사
    x: bestPosition.x,
    y: bestPosition.y,
    // 최종 배치된 책장의 너비(width)와 높이(실제로는 2D 평면에서의 깊이/두께, 즉 shelf.depth)를 요소에 포함.
    // isHorizon, oid, name, glb_file 등은 shelf에서 가져옴.
    width: shelf.width, // 2D 평면에서 보이는 너비
    height: shelf.depth // 2D 평면에서 보이는 높이 (실제 책장의 깊이/두께)
  };
  
  // 배치 이유 추가 (예: 벽이나 다른 가구에 인접)
  reasons.bookshelf.push("벽 또는 침대에 인접한 최적 위치에 배치됨");

  console.log("[placeBookshelf] Returning:", { element: bestPositionWithElement, reasons });
  return { element: bestPositionWithElement, reasons }; // 최종 배치된 책장과 이유 반환
};

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

module.exports = { placeBookshelf };
