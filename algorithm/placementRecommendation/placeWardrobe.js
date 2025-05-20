
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

  return elements.some(el => el.type !== "room" && isBlocked(el));
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

function getPlacementScore(pos, elements, room) {
  let score = 0;

  const width = pos.isHorizontal ? pos.height : pos.width;
  const height = pos.isHorizontal ? pos.width : pos.height;
  const trial = { x: pos.x, y: pos.y, width, height };

  const sides = [
    { dx: -1, dy: 0, width: 1, height: trial.height },
    { dx: trial.width, dy: 0, width: 1, height: trial.height },
    { dx: 0, dy: -1, width: trial.width, height: 1 },
    { dx: 0, dy: trial.height, width: trial.width, height: 1 }
  ];

  for (const s of sides) {
    const sideBox = {
      x: trial.x + s.dx,
      y: trial.y + s.dy,
      width: s.width,
      height: s.height
    };

    const wallTouch = (
      sideBox.x === 0 || sideBox.y === 0 ||
      sideBox.x + sideBox.width === room.x ||
      sideBox.y + sideBox.height === room.y
    );
    if (wallTouch) {
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
      score += 1;
    }
  }

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
    score += 4;
  }

  return score;
}

function selectRandomFromBestScored(validPositions, elements, room) {
  if (validPositions.length === 0) return null;
  const scored = validPositions.map(p => ({ ...p, score: getPlacementScore(p, elements, room) }));
  const maxScore = Math.max(...scored.map(p => p.score));
  const top = scored.filter(p => p.score === maxScore);
  const index = Math.floor(Math.random() * top.length);
  const { score, ...chosen } = top[index];
  return chosen;
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

function placeWardrobe(elements) {
  const reasons = [];
  const room = elements.find(el => el.type === "room");
  const wardrobe = { type: "wardrobe", width: 80, height: 50 };
  const step = 10;

  if (restPlace(elements) < wardrobe.width * wardrobe.height) {
    reasons.push({ type: "wardrobe", reason: "배치공간 부족" });
    return { elements, reasons };
  }

  const positions = generateWallBeltPositions(wardrobe, room, step, 30);
  const valid = filterValidPositions(positions, elements, wardrobe);
  const chosen = selectRandomFromBestScored(valid, elements, room);

  if (chosen) {
    addToElements(elements, chosen);
    reasons.push({ type: "wardrobe", reason: "벽 및 가구에 밀착된 최적 위치에 배치됨" });
  } else {
    reasons.push({ type: "wardrobe", reason: "조건에 맞는 위치 없음" });
  }

  return { elements, reasons };
}

module.exports = { placeWardrobe };
