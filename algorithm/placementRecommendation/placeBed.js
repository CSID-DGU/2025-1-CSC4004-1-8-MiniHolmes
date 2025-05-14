// ✅ 공통 유틸 함수들

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
      isHorizontal: pos.isHorizon
    };

    const overlaps = elements.some(el => {
      if (el.type === "room") return false;
      return isOverlapping(trial, el);
    });

    if (!overlaps) valid.push(trial);
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

function getWallTightnessScore(p, room) {
  let score = 0;
  if (p.x === 0 || p.x + p.width === room.x) score++;
  if (p.y === 0 || p.y + p.height === room.y) score++;
  return score;
}

function selectRandomFromBestScored(positions, room) {
  if (positions.length === 0) return null;

  const scored = positions.map(p => ({ ...p, score: getWallTightnessScore(p, room) }));
  const maxScore = Math.max(...scored.map(p => p.score));
  const topCandidates = scored.filter(p => p.score === maxScore);
  const index = Math.floor(Math.random() * topCandidates.length);

  const { score, ...cleaned } = topCandidates[index];
  return cleaned;
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

// ✅ 침대 배치 (모던 스타일 기준, 벽 우선 + 점수 기반)
function placeBed(elements, design) {
  let reasons = [];
  const room = elements.find(el => el.type === "room");
  const bed = {
    type: "bed",
    width: 150,
    height: 200
  };
  const step = 10;
  let positions = [];

  if (restPlace(elements) < bed.width * bed.height) {
    reasons.push({ type: "bed", reason: "배치공간 부족" });
    return { elements, reasons };
  }

  if (design === "modern") {
    const availableWalls = findAvailableWalls(elements, room);

    for (const wall of availableWalls) {
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

    let valid = filterValidPositions(positions, elements, bed);
    let chosen = selectRandomFromBestScored(valid, room);

    if (chosen) {
      addToElements(elements, chosen);
      reasons.push({ type: "bed", reason: "모던 스타일: 벽에 밀착된 위치 우선 배치" });
    } else {
      const fallbackPositions = generateWallBeltPositions(bed, room, step, 30);
      valid = filterValidPositions(fallbackPositions, elements, bed);
      chosen = selectRandomFromBestScored(valid, room);

      if (chosen) {
        addToElements(elements, chosen);
        reasons.push({ type: "bed", reason: "벽 띠 fallback 위치에 배치됨" });
      } else {
        reasons.push({ type: "bed", reason: "실패: 모든 벽 영역에도 배치 불가" });
      }
    }
  }

  return { elements, reasons };
}

module.exports = { placeBed };
