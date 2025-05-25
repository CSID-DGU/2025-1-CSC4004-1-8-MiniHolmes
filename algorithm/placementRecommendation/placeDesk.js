function isEmptySpaceConnected(elements, room, cellSize = 20) {
  const rows = Math.ceil(room.y / cellSize);
  const cols = Math.ceil(room.x / cellSize);
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
        testBox.x + testBox.width > room.x ||
        testBox.y + testBox.height > room.y;

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

function hasFullySurroundedElement(elements, room) {
  function isBlocked(el) {
    const margin = 1;

    const directions = [
      { dx: -margin, dy: 0, width: margin, height: el.height }, // left
      { dx: el.width, dy: 0, width: margin, height: el.height }, // right
      { dx: 0, dy: -margin, width: el.width, height: margin }, // top
      { dx: 0, dy: el.height, width: el.width, height: margin } // bottom
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
        testBox.x + testBox.width > room.x ||
        testBox.y + testBox.height > room.y;

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
  const roomArea = room.x * room.y;
  const occupied = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);
  return roomArea - occupied;
}

function generateWallBeltPositions(furniture, room, step = 10, belt = 30) {
  const positions = [];
  for (const isHorizontal of [false, true]) {
    const width = isHorizontal ? furniture.height : furniture.width;
    const height = isHorizontal ? furniture.width : furniture.height;
    for (let x = 0; x <= room.x - width; x += step) {
      for (let y = 0; y <= room.y - height; y += step) {
        positions.push({ x, y, isHorizontal });
      }
    }
  }
  return positions;
}

function isBackSpaceClear(pos, elements, desk, chairGap) {
  const room = elements.find(el => el.type === "room");
  const width = pos.isHorizontal ? desk.height : desk.width;
  const height = pos.isHorizontal ? desk.width : desk.height;
  const trial = { x: pos.x, y: pos.y, width, height };

  function isInsideRoom(area) {
    return (
      area.x >= 0 &&
      area.y >= 0 &&
      area.x + area.width <= room.x &&
      area.y + area.height <= room.y
    );
  }

  function isAreaClear(area) {
    return isInsideRoom(area) &&
      !elements.some(el => el.type !== "room" && isOverlapping(area, el));
  }

  if (!pos.isHorizontal) {
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
  const width = pos.isHorizontal ? desk.height : desk.width;
  const height = pos.isHorizontal ? desk.width : desk.height;
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
      else if (el.y + el.height === room.y) wallSet.delete("bottom");
      else if (el.x === 0) wallSet.delete("left");
      else if (el.x + el.width === room.x) wallSet.delete("right");
    }
  }
  return [...wallSet];
}

function getPlacementScoreWithReason(pos, elements, room, design) {
  const { x, y, width, height } = pos;
  let score = 0;
  const reasons = [];

  const longSide = Math.max(width, height);
  const longSideTouchingWall =
    (width === longSide && (y === 0 || y + height === room.y)) ||
    (height === longSide && (x === 0 || x + width === room.x));

  if (longSideTouchingWall) {
    score += 100;
    reasons.push("긴 변이 벽에 붙어 있어 안정적인 배치");
  }

  const touchesWall =
    x === 0 || x + width === room.x ||
    y === 0 || y + height === room.y;

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
    if (x + width === room.x) wallTouches.push("right");
    if (y === 0) wallTouches.push("top");
    if (y + height === room.y) wallTouches.push("bottom");

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

function placeDesk(elements, design) {
  const reasons = { desk: [] };
  const room = elements.find(el => el.type === "room");
  const desk = { type: "desk", width: 120, height: 60 };
  const chairGap = 100;

  if (restPlace(elements) < desk.width * desk.height) {
    reasons.desk.push("공간이 부족합니다.");
    return { elements, reasons };
  }

  const step = 10;
  const positions = generateWallBeltPositions(desk, room, step, 30);
  const valid = [];

  for (const pos of positions) {
    const width = pos.isHorizontal ? desk.height : desk.width;
    const height = pos.isHorizontal ? desk.width : desk.height;

    const trial = {
      type: desk.type,
      x: pos.x,
      y: pos.y,
      width,
      height,
      isHorizontal: pos.isHorizontal
    };

    const overlap = elements.some(el => el.type !== "room" && isOverlapping(el, trial));
    if (overlap) continue;

    if (!isBackSpaceClear(pos, elements, desk, chairGap)) continue;
    if (!isEmptySpaceConnected([...elements, trial], room)) continue;
    if (hasFullySurroundedElement([...elements, trial], room)) continue;

    const { score, reasons: scoreReasons } = getPlacementScoreWithReason(trial, elements, room, design);
    valid.push({ ...trial, score, reasons: scoreReasons });
  }

  if (valid.length === 0) {
    reasons.desk.push("적절한 위치를 찾을 수 없습니다.");
    return { elements, reasons };
  }

  const maxScore = Math.max(...valid.map(p => p.score));
  const best = valid.filter(p => p.score === maxScore);
  const selected = best[Math.floor(Math.random() * best.length)];

  elements.push({
    type: selected.type,
    x: selected.x,
    y: selected.y,
    width: selected.width,
    height: selected.height,
    isHorizontal: selected.isHorizontal
  });

  reasons.desk = selected.reasons;

  return { elements, reasons };
}


module.exports = { placeDesk };
