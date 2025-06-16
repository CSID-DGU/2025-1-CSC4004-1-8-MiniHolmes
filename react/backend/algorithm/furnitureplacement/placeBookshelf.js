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
  const walls = ["top", "bottom", "left", "right"];

  for (const wall of walls) {
    for (const isHorizon of [false, true]) {
      const width = isHorizon ? furniture.depth : furniture.width;
      const height = isHorizon ? furniture.width : furniture.depth;

      let xStart = 0, yStart = 0;
      if (wall === "top") {
        yStart = 0;
        for (let x = 0; x <= room.width - width; x += step) {
          positions.push({ x, y: yStart, isHorizon });
        }
      } else if (wall === "bottom") {
        yStart = room.depth - height;
        for (let x = 0; x <= room.width - width; x += step) {
          positions.push({ x, y: yStart, isHorizon });
        }
      } else if (wall === "left") {
        xStart = 0;
        for (let y = 0; y <= room.depth - height; y += step) {
          positions.push({ x: xStart, y, isHorizon });
        }
      } else if (wall === "right") {
        xStart = room.width - width;
        for (let y = 0; y <= room.depth - height; y += step) {
          positions.push({ x: xStart, y, isHorizon });
        }
      }
    }
  }

  return positions;
};

const getBookshelfScore = (pos, elements, room, shelf) => {
  const width = pos.isHorizon ? shelf.depth : shelf.width;
  const height = pos.isHorizon ? shelf.width : shelf.depth;
  const trial = { x: pos.x, y: pos.y, width, height, isHorizon: pos.isHorizon };
  const reasons = [];
  let score = 0;
  const EPS = 1;
  

  const touchesWall =
  trial.x === 0 || trial.x + width === room.width ||
  trial.y === 0 || trial.y + height === room.depth;

  if (touchesWall) {
    score += 5;
    reasons.push("벽에 인접하여 공간 활용이 좋음");
  }

  const longSide = Math.max(width, height);
  const isHorizontal = width === longSide;

  // 긴 변이 벽에 붙어 있는 경우 큰 점수 부여
  const touchesLongSideWall =
    (isHorizontal && (Math.abs(trial.y - 0) <= EPS || Math.abs(trial.y + height - room.depth) <= EPS)) ||
    (!isHorizontal && (Math.abs(trial.x - 0) <= EPS || Math.abs(trial.x + width - room.width) <= EPS));
  if (touchesLongSideWall) {
    score += 6;
    reasons.push("긴 쪽이 벽에 인접하여 공간 활용이 좋음");
  }

  let furnitureTouchCount = 0;
  const margin = 1;
  const directions = [
    { dx: -margin, dy: 0, width: margin, height: height },
    { dx: width, dy: 0, width: margin, height: height },
    { dx: 0, dy: -margin, width: width, height: margin },
    { dx: 0, dy: height, width: width, height: margin }
  ];

  for (const dir of directions) {
    const box = {
      x: trial.x + dir.dx,
      y: trial.y + dir.dy,
      width: dir.width,
      height: dir.height
    };
    const touching = elements.some(el =>
      el.type !== "room" && el.type !== "door" && el.type !== "window" && isOverlapping(el, box)
    );
    if (touching) furnitureTouchCount++;
  }

  if (furnitureTouchCount >= 2) {
  score += 4;
  reasons.push("두 개 이상의 가구에 인접하여 밀착 배치");
} else if (furnitureTouchCount >= 1) {
  score += 2;
  reasons.push("다른 가구에 인접하여 안정감 있는 배치");
}

  const nearFurniture = elements.some(el => {
    if (el.type === "room") return false;
    const dx = Math.max(el.x - (trial.x + width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > 0 && dist <= 20;
  });
  if (nearFurniture) {
    score += 1;
    reasons.push("주변 가구와의 동선이 자연스러움");
  }

   // 긴쪽이 닿은 옷장 감점
  for (const el of elements) {
    if (el.type === "closet") {
      const elLongSide = Math.max(el.width, el.height);
      const elShortSide = Math.min(el.width, el.height);
      const dx = Math.max(el.x - (trial.x + width), trial.x - (el.x + el.width), 0);
      const dy = Math.max(el.y - (trial.y + height), trial.y - (el.y + el.height), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        const sharedVertical =
          (Math.abs(trial.x + width - el.x) <= 1 || Math.abs(el.x + el.width - trial.x) <= 1) &&
          (trial.y < el.y + el.height && trial.y + height > el.y);
        const sharedHorizontal =
          (Math.abs(trial.y + height - el.y) <= 1 || Math.abs(el.y + el.height - trial.y) <= 1) &&
          (trial.x < el.x + el.width && trial.x + width > el.x);

        const closetIsLongHorizontally = el.width >= el.height;

        if ((closetIsLongHorizontally && sharedHorizontal) ||
            (!closetIsLongHorizontally && sharedVertical)) {
          score -= 10;
          reasons.push("옷장의 긴 면과 직접 맞닿아 있어 공간이 답답해 보일수도 있음!");
        }
      }
    }
  }
  return { score, reasons };
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
      if (outOfRoom || blockedByOther) blocked++;
    }
    return blocked === 4;
  }
  return elements.some(el => el.type !== "room" && isBlocked(el));
};

const isEmptySpaceConnected = (elements, room, cellSize = 10) => {
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
        if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = 1;
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
};

const placeBookshelf = (elements, bookshelfData) => {
  const reasons = { bookshelf: [] };
  const room = elements.find(el => el.type === "room");
  const shelf = {
    type: "bookshelf",
    width: bookshelfData.dimensions.width,
    height: bookshelfData.dimensions.height,
    depth: bookshelfData.dimensions.depth,
    oid: bookshelfData.oid,
    name: bookshelfData.name,
    glb_file: bookshelfData.glb_file
  };
  if (restPlace(elements) < shelf.width * shelf.depth) {
    reasons.bookshelf.push("공간 부족");
    return { elements, reasons };
  }
  const positions = generateWallBeltPositions(shelf, room, 10, 30);
  const valid = [];
  for (const pos of positions) {
    const width = pos.isHorizon ? shelf.depth : shelf.width;
    const height = pos.isHorizon ? shelf.width : shelf.depth;
    const trial = {
      ...shelf,
      x: pos.x,
      y: pos.y,
      width,
      height,
      isHorizon: pos.isHorizon
    };
    const overlap = elements.some(el =>
      el.type !== "room" && isOverlapping(trial, el)
    );
    if (!overlap) {
      const simulated = [...elements, trial];
      if (!hasFullySurroundedElement(simulated, room) && isEmptySpaceConnected(simulated, room)) {
        valid.push(pos);
      }
    }
  }
  if (valid.length === 0) {
    reasons.bookshelf.push("배치 가능한 유효한 위치 없음");
    return { elements, reasons };
  }
  const scoredPositions = valid.map(pos => {
    const { score, reasons: scoreReasons } = getBookshelfScore(pos, elements, room, shelf);
    return { ...pos, score,reasons: scoreReasons };
  });
  scoredPositions.sort((a, b) => b.score - a.score);
  console.log("📚 [책장 배치] 상위 위치 후보 점수:");
  scoredPositions.slice(0, 5).forEach((pos, idx) => {
    console.log(`#${idx + 1}: score=${pos.score}, x=${pos.x}, y=${pos.y}, isHorizon=${pos.isHorizon}`);
  });
  const bestPosition = scoredPositions[0];
  if (!bestPosition) {
    reasons.bookshelf.push("최적 위치를 찾지 못했습니다.");
    return { elements, reasons };
  }
  const finalWidth = bestPosition.isHorizon ? shelf.depth : shelf.width;
  const finalHeight = bestPosition.isHorizon ? shelf.width : shelf.depth;
  const bestPositionWithElement = {
    ...shelf,
    x: bestPosition.x,
    y: bestPosition.y,
    width: finalWidth,
    height: finalHeight,
    isHorizon: bestPosition.isHorizon
  };
  reasons.bookshelf.push(...(bestPosition.reasons || []));
  return { element: bestPositionWithElement, reasons };
};

module.exports = { placeBookshelf };
