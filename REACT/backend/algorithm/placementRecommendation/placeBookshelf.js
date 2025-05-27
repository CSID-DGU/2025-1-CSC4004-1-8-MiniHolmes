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

const getBlockedWallsFromWindows = (elements, room) => {
  const blockedWalls = new Set();

  for (const el of elements) {
    if (el.type !== "window") continue;

    if (el.width >= el.height) {
      if (el.y === 0) blockedWalls.add("top");
      else if (el.y + el.height === room.y) blockedWalls.add("bottom");
    }

    if (el.height > el.width) {
      if (el.x === 0) blockedWalls.add("left");
      else if (el.x + el.width === room.x) blockedWalls.add("right");
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
  const roomArea = room.x * room.y;
  const occupied = elements
    .filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);
  return roomArea - occupied;
};

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
      (Math.abs(trial.y - 0) <= EPS || Math.abs(trial.y + height - room.y) <= EPS)) ||
    (!isHorizontal &&
      (Math.abs(trial.x - 0) <= EPS || Math.abs(trial.x + width - room.x) <= EPS));

  if (touchesLongSideWall) score += 6;

  const touchesWall =
    Math.abs(trial.x - 0) <= EPS || Math.abs(trial.y - 0) <= EPS ||
    Math.abs(trial.x + width - room.x) <= EPS || Math.abs(trial.y + height - room.y) <= EPS;

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
    if (Math.abs(trial.x + width - room.x) <= EPS) wallTouches.push("right");
    if (Math.abs(trial.y - 0) <= EPS) wallTouches.push("top");
    if (Math.abs(trial.y + height - room.y) <= EPS) wallTouches.push("bottom");

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

const placeBookshelf = (elements) => {
  const reasons = { bookshelf: [] };
  const room = elements.find(el => el.type === "room");
  const shelf = { type: "bookshelf", width: 80, height: 30 };
  const step = 10;

  if (restPlace(elements) < shelf.width * shelf.height) {
    reasons.bookshelf.push("공간 부족");
    return { elements, reasons };
  }

  const positions = generateWallBeltPositions(shelf, room, step, 30);
  const valid = [];

  for (const pos of positions) {
    const width = pos.isHorizontal ? shelf.height : shelf.width;
    const height = pos.isHorizontal ? shelf.width : shelf.height;

    const trial = {
      type: shelf.type,
      x: pos.x,
      y: pos.y,
      width,
      height
    };

    if (elements.some(el => el.type !== "room" && isOverlapping(el, trial))) continue;
    if (isTooCloseToDoor(trial, elements)) continue;
    if (isBehindDesk(trial, elements)) continue;
    const trialElements = [...elements, trial];
    if (!isEmptySpaceConnected(trialElements, room)) continue;
    if (hasFullySurroundedElement(trialElements, room)) continue;
    const score = getBookshelfScore(pos, elements, room);
    valid.push({ ...trial, score });
  }

  if (valid.length === 0) {
    reasons.bookshelf.push("조건에 맞는 위치 없음");
    return { elements, reasons };
  }

  const maxScore = Math.max(...valid.map(v => v.score));
  const best = valid.filter(v => v.score === maxScore);
  const chosen = best[Math.floor(Math.random() * best.length)];

  elements.push({
    type: chosen.type,
    x: chosen.x,
    y: chosen.y,
    width: chosen.width,
    height: chosen.height
  });

  reasons.bookshelf.push("벽 또는 침대에 인접한 최적 위치에 배치됨");

  return { elements, reasons };
};


module.exports = { placeBookshelf };
