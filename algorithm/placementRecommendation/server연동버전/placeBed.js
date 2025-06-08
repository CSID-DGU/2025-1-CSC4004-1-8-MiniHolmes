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
        other !== el && other.type !== "room" && isOverlapping(other, testBox)
      );
      if (outOfRoom || blockedByOther) blocked++;
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
      const nx = x + dx, ny = y + dy;
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

function restPlace(elements) {
  const room = elements.find(el => el.type === "room");
  if (!room) return 0;
  const roomArea = room.width * room.depth;
  const occupied = elements.filter(el => el.type !== "room")
    .reduce((sum, el) => sum + el.width * el.height, 0);
  return roomArea - occupied;
}

function findAvailableWalls(elements, room) {
  const windowWalls = [];
  for (const el of elements) {
    if (el.type === "window") {
      if (el.y === 0) windowWalls.push("top");
      else if (el.x === 0) windowWalls.push("left");
      else if (el.x + el.width === room.width) windowWalls.push("right");
      else if (el.y + el.height === room.depth) windowWalls.push("bottom");
    }
  }
  return ["top", "bottom", "left", "right"].filter(w => !windowWalls.includes(w));
}

function filterValidPositions(positions, elements, furniture, room) {
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
    const overlaps = elements.some(el => el.type !== "room" && isOverlapping(trial, el));
    if (!overlaps) {
      const trialElements = [...elements, trial];
      const connected = isEmptySpaceConnected(trialElements, room);
      const notTrapped = !hasFullySurroundedElement(trialElements, room);
      if (connected && notTrapped) valid.push(trial);
    }
  }
  return valid;
}

function getWallAndFurnitureTightnessScore(p, elements, room, design) {
  windowDistance = 1000;
  if(design=="cozy"){design="natural"}
  let score = 0;
  const reasons = [];
  let wallTouch = 0;
  if (p.x === 0) wallTouch++;
  if (p.x + p.width === room.width) wallTouch++;
  if (p.y === 0) wallTouch++;
  if (p.y + p.height === room.depth) wallTouch++;
  if (wallTouch > 0) {
    const bonus = wallTouch === 1 ? 10 : wallTouch === 2 ? 30 : 50;
    score += bonus;
    reasons.push(`벽 ${wallTouch}면에 인접`);
  }
  for (const el of elements) {
    if (el.type === "room") continue;

    const dx = Math.max(el.x - (p.x + p.width), p.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (p.y + p.height), p.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (el.type === "door") {
      if (dist < 10) {
        score -= 100;
        reasons.push("문 주변 배치");
      } else {
        score += 2;
        reasons.push("문 회피");
      }
    }
    
    if (el.type === "window") {
      if (design === "modern" && dist < windowDistance) {
        score -= 50;
        reasons.push("창문 인접 배치");
      }
      if (design === "natural" && dist < windowDistance) {
        score += 30;
        reasons.push("내추럴 스타일: 창문 근처 배치");
      }
    }
    
  }
  return { score, reasons };
}

function selectRandomFromBestScored(positions, elements, room, design) {
  const scored = positions.map(p => {
    const width = p.isHorizon ? p.height : p.width;
    const height = p.isHorizon ? p.width : p.height;
    const { score, reasons } = getWallAndFurnitureTightnessScore(
      { ...p, width, height }, elements, room, design
    );
    return { ...p, score, reasons };
  });
  const max = Math.max(...scored.map(p => p.score));
  const top = scored.filter(p => p.score === max);
  return top.length > 0 ? top[Math.floor(Math.random() * top.length)] : null;
}

function placeBed(elements, design, bedData) {
  const reasons = { bed: [] };
  const room = elements.find(el => el.type === "room");
  if (!room) return { elements, reasons };

  const bed = {
    type: "bed",
    footprintWidth: bedData.dimensions.width,
    footprintDepth: bedData.dimensions.depth,
    oid: bedData.oid,
    name: bedData.name,
    glb_file: bedData.glb_file
  };
  const step = 10;
  if (restPlace(elements) < bed.footprintWidth * bed.footprintDepth) {
    reasons.bed.push("공간 부족");
    return { elements, reasons };
  }

  const allWalls = ["top", "bottom", "left", "right"];
  let positions = [];
  for (const wall of allWalls) {
    for (const isHorizon of [false, true]) {
      const width = isHorizon ? bed.footprintDepth : bed.footprintWidth;
      const height = isHorizon ? bed.footprintWidth : bed.footprintDepth;
      if (wall === "bottom") {
        const y = room.depth - height;
        for (let x = 0; x <= room.width - width; x += step) {
          positions.push({ x, y, isHorizon });
        }
      } else if (wall === "top") {
        for (let x = 0; x <= room.width - width; x += step) {
          positions.push({ x, y: 0, isHorizon });
        }
      } else if (wall === "left") {
        for (let y = 0; y <= room.depth - height; y += step) {
          positions.push({ x: 0, y, isHorizon });
        }
      } else if (wall === "right") {
        const x = room.width - width;
        for (let y = 0; y <= room.depth - height; y += step) {
          positions.push({ x, y, isHorizon });
        }
      }
    }
  }
  const valid = filterValidPositions(positions, elements, {
    type: "bed",
    width: bed.footprintWidth,
    height: bed.footprintDepth
  }, room);
  const best = selectRandomFromBestScored(valid, elements, room, design);
  if (best) {
    const width = best.isHorizon ? bed.footprintDepth : bed.footprintWidth;
    const height = best.isHorizon ? bed.footprintWidth : bed.footprintDepth;
    const placed = {
      type: "bed",
      oid: bed.oid,
      name: bed.name,
      glb_file: bed.glb_file,
      x: best.x,
      y: best.y,
      width,
      height,
      isHorizon: best.isHorizon
    };
    elements.push(placed);
    console.log("[placeBed] placed:", placed);
    if (best.reasons) reasons.bed.push(...best.reasons);
    return { element: placed, reasons };
  }

  reasons.bed.push("배치 실패: 유효한 위치 없음");
  return { elements, reasons };
}

module.exports = { placeBed };
