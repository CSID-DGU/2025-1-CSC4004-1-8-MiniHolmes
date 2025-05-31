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

function isEmptySpaceConnected(elements, room, cellSize = 10) {
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
          grid[y][x] = 1; // 1은 장애물(가구)
        }
      }
    }
  }

  const key = (x, y) => `${x},${y}`;
  const visited = new Set();
  let totalEmpty = 0;
  let start = null;

  // 0 (빈 공간) 위치 탐색
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 0) {
        totalEmpty++;
        if (!start) start = [x, y];
      }
    }
  }

  if (!start) return true; // 빈 공간 자체가 없음

  // BFS
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
      isHorizon: pos.isHorizon
    };

    const overlaps = elements.some(el => {
      if (el.type === "room") return false;
      return isOverlapping(trial, el);
    });

    if (!overlaps) {
      const trialElements = [...elements, trial];
      const room = elements.find(el => el.type === "room");

      const connected = isEmptySpaceConnected(trialElements, room);
      const notTrapped = !hasFullySurroundedElement(trialElements, room);

      if (connected && notTrapped) {
        valid.push(trial);
      }
    }
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

function getWallAndFurnitureTightnessScore(p, elements, room) {
  let score = 0;
  const reasons = [];

  if (p.x === 0 || p.x + p.width === room.x) score = score + 2;
  if (p.y === 0 || p.y + p.height === room.y) score = score + 2;

  let scoreflag = 0;

  let wallTouchCount = 0;
    if (p.x === 0) wallTouchCount++;
    if (p.x + p.width === room.x) wallTouchCount++;
    if (p.y === 0) wallTouchCount++;
    if (p.y + p.height === room.y) wallTouchCount++;

    
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
    x: furniture.x,
    y: furniture.y,
    width: furniture.width,
    height: furniture.height
  });
}

function placeBed(elements, design,bedData) {
  const reasons = { bed: [] };
  const room = elements.find(el => el.type === "room");
  const bed = {
    type: "bed",
    width: bedData.dimensions.width,
    height: bedData.dimensions.height
  };
  const step = 10;

  if (restPlace(elements) < bed.width * bed.height) {
    reasons.bed.push("배치공간 부족");
    return { elements, reasons };
  }

  const allWalls = ["top", "bottom", "left", "right"];
  const nonWindowWalls = findAvailableWalls(elements, room);
  const windowWalls = allWalls.filter(w => !nonWindowWalls.includes(w));

  if (design === "natural") {
    const tryWallsList = [windowWalls, nonWindowWalls];

    for (const wallGroup of tryWallsList) {
      let positions = [];

      for (const wall of wallGroup) {
        for (const isHorizon of [false, true]) {
          const width = isHorizon ? bed.height : bed.width;
          const height = isHorizon ? bed.width : bed.height;

          if (wall === "bottom") {
            const y = room.y - height;
            for (let x = 0; x <= room.x - width; x += step) {
              positions.push({ x, y, isHorizon });
            }
          } else if (wall === "top") {
            const y = 0;
            for (let x = 0; x <= room.x - width; x += step) {
              positions.push({ x, y, isHorizon });
            }
          } else if (wall === "left") {
            const x = 0;
            for (let y = 0; y <= room.y - height; y += step) {
              positions.push({ x, y, isHorizon });
            }
          } else if (wall === "right") {
            const x = room.x - width;
            for (let y = 0; y <= room.y - height; y += step) {
              positions.push({ x, y, isHorizon });
            }
          }
        }
      }

      const valid = filterValidPositions(positions, elements, bed);
      const chosen = selectRandomFromBestScored(valid, elements, room);

      if (chosen) {
        addToElements(elements, chosen);
        reasons.bed.push(
          wallGroup === windowWalls
            ? "자연 스타일: 창문 벽에 배치"
            : "자연 스타일: 일반 벽에 배치"
        );
        if (chosen.reasons) {
       Array.prototype.push.apply(reasons.bed, chosen.reasons);
      }
        return {
        element: {
          name: bedData.name,
          x: chosen.x,
          y: chosen.y,
          width: chosen.width,
          height: chosen.height,
          type: "bed",
          isHorizon: chosen.isHorizon ?? false
        },
        reason: reasons
      };
      }
    }
  }

  if (design === "modern") {
    const tryWalls = nonWindowWalls;
    let positions = [];

    for (const wall of tryWalls) {
      for (const isHorizon of [false, true]) {
        const width = isHorizon ? bed.height : bed.width;
        const height = isHorizon ? bed.width : bed.height;

        if (wall === "bottom") {
          const y = room.y - height;
          for (let x = 0; x <= room.x - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        } else if (wall === "top") {
          const y = 0;
          for (let x = 0; x <= room.x - width; x += step) {
            positions.push({ x, y, isHorizon });
          }
        } else if (wall === "left") {
          const x = 0;
          for (let y = 0; y <= room.y - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        } else if (wall === "right") {
          const x = room.x - width;
          for (let y = 0; y <= room.y - height; y += step) {
            positions.push({ x, y, isHorizon });
          }
        }
      }
    }

    const valid = filterValidPositions(positions, elements, bed);
    const chosen = selectRandomFromBestScored(valid, elements, room);
    
    if (chosen) {
      addToElements(elements, chosen);
      reasons.bed.push("모던 스타일: 창문 없는 벽에 배치");
      if (chosen.reasons) {
      Array.prototype.push.apply(reasons.bed, chosen.reasons);
      }
      return {
        element: {
          name: bedData.name,
          x: chosen.x,
          y: chosen.y,
          width: chosen.width,
          height: chosen.height,
          type: "bed",
          isHorizon: chosen.isHorizon ?? false
        },
        reason: reasons
      };
    }
  }

  const fallbackPositions = generateWallBeltPositions(bed, room, step, 30);
  const valid = filterValidPositions(fallbackPositions, elements, bed);
  const chosen = selectRandomFromBestScored(valid, elements, room);

  if (chosen) {
    addToElements(elements, chosen);
    reasons.bed.push("벽 띠 fallback 위치에 배치됨");
  } else {
    reasons.bed.push("실패: 모든 벽 영역에도 배치 불가");
  }

  return { elements, reasons };
}


module.exports = { placeBed };
