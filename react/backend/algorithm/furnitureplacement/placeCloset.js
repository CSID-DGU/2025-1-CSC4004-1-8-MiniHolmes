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
          grid[y][x] = 1;
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

function isOverlapping(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
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

      if (outOfRoom || blockedByOther) blocked++;
    }

    return blocked === 4;
  }

  return elements.some(el => el.type !== "room" && isBlocked(el));
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

  for (const pos of positions) {
    const width = pos.isHorizon ? furniture.height : furniture.width;
    const height = pos.isHorizon ? furniture.width : furniture.height;

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
      return isOverlapping(trial, el);
    });

    const nearSensitive = elements.some(el => {
      if (el.type !== "door" && el.type !== "window") return false;
      const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
      const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 100;
    });

    const trialElements = [...elements, trial];
    const room = elements.find(el => el.type === "room");

    const keepsEmptyConnected = isEmptySpaceConnected(trialElements, room);

    if (!overlaps && !nearSensitive && keepsEmptyConnected && !hasFullySurroundedElement(trialElements, room)) {
      valid.push(trial);
    }
  }

  return valid;
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

function getPlacementScore(pos, elements, room) {
  let score = 0;
  const reasons = [];

  const width = pos.isHorizontal ? pos.height : pos.width;
  const height = pos.isHorizontal ? pos.width : pos.height;
  const trial = { x: pos.x, y: pos.y, width, height };

  const sides = [
    { dx: -1, dy: 0, width: 1, height: trial.height },
    { dx: trial.width, dy: 0, width: 1, height: trial.height },
    { dx: 0, dy: -1, width: trial.width, height: 1 },
    { dx: 0, dy: trial.height, width: trial.width, height: 1 }
  ];

  var wallTouchflag = 0;
  var nearSomethingflag = 0;

  for (const s of sides) {
    const sideBox = {
      x: trial.x + s.dx,
      y: trial.y + s.dy,
      width: s.width,
      height: s.height
    };

    const wallTouch = (
      sideBox.x === 0 || sideBox.y === 0 ||
      sideBox.x + sideBox.width === room.width ||
      sideBox.y + sideBox.height === room.depth
    );
    if (wallTouch) {
      wallTouchflag = 1;
      score += 4;
      continue;
    }

    const nearSomething = elements.some(el => {
      if (el.type === "room") return false;
      const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
      const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > 0 && dist <= 20;
    });
    if (nearSomething) {
      nearSomethingflag = 1;
      score += 1;
    }
  }

  if (wallTouchflag == 1) reasons.push("벽에 인접하여 안정적인 배치(+4)");
  if (nearSomethingflag) reasons.push("물체에 근접하여 안정적인 배치 (+1)");

  const isTouchingFurniture = elements.some(el => {
    if (el.type === "room") return false;

    const horizontallyTouching =
      (trial.x === el.x + el.width || trial.x + trial.width === el.x) &&
      !(trial.y + trial.height <= el.y || trial.y >= el.y + el.height);

    const verticallyTouching =
      (trial.y === el.y + el.height || trial.y + trial.height === el.y) &&
      !(trial.x + trial.width <= el.x || trial.x >= el.x + el.width);

    return horizontallyTouching || verticallyTouching;
  });

  if (isTouchingFurniture) {
    reasons.push("가구에 인접하여 안정적인 배치 (+4)");
    score += 4;
  }

  return { score, reasons };
}

function selectRandomFromBestScored(validPositions, elements, room) {
  if (validPositions.length === 0) return null;

  const scored = validPositions.map(p => {
    const { score, reasons } = getPlacementScore(p, elements, room);
    return { ...p, score, reasons };
  });

  const maxScore = Math.max(...scored.map(p => p.score));
  const top = scored.filter(p => p.score === maxScore);
  const index = Math.floor(Math.random() * top.length);
  return top[index];
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

function placeCloset(elements, closetData) {
  console.log("[placeCloset] Inputs:", { elements, closetData });
  const reasons = { closet: [] };
  const room = elements.find(el => el.type === "room");

  const closet = {
    type: "closet",
    width: closetData.dimensions.width,
    height: closetData.dimensions.height,
    depth: closetData.dimensions.depth,
    oid: closetData.oid,
    name: closetData.name,
    glb_file: closetData.glb_file
  };

  const step = 10;
  const belt = 0;

  if (restPlace(elements) < closet.width * closet.height) {
    reasons.closet.push("공간 부족");
    return { elements, reasons };
  }

  let positions = generateWallBeltPositions(closet, room, step, belt);
  let validPositions = filterValidPositions(positions, elements, closet);

  if (validPositions.length === 0) {
    reasons.closet.push("조건에 맞는 위치 없음 (초기)");
    positions = generateWallBeltPositions(closet, room, step, 30);
    validPositions = filterValidPositions(positions, elements, closet);
    if (validPositions.length === 0) {
      reasons.closet.push("조건에 맞는 위치 없음 (확장 벨트)");
      return { elements, reasons };
    }
  }

  const scoredPositions = validPositions.map(pos => {
    const { score, reasons } = getPlacementScore(pos, elements, room);
    return { ...pos, score, reasons };
  });

  const bestPosition = selectRandomFromBestScored(scoredPositions, elements, room);

  if (!bestPosition) {
    reasons.closet.push("최적 위치 선정 실패");
    return { elements, reasons };
  }

  const placedCloset = {
    type: closet.type,
    oid: closet.oid,
    name: closet.name,
    glb_file: closet.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: bestPosition.width,
    height: bestPosition.height,
    isHorizon: bestPosition.isHorizon
  };
  elements.push(placedCloset);

  reasons.closet.push("벽 및 가구에 밀착된 최적 위치에 배치됨");

  const closetDetails = {
    name: closet.name,
    type: "closet",
    oid: closet.oid,
    glb_file: closet.glb_file,
    x: bestPosition.x,
    y: bestPosition.y,
    width: bestPosition.width,
    height: bestPosition.height,
    isHorizon: bestPosition.isHorizon
  };

  console.log("[placeCloset] Returning:", { element: closetDetails, reason: reasons });
  return {
    element: closetDetails,
    reason: reasons
  };
}

module.exports = { placeCloset };
