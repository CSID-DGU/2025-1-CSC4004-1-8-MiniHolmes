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

    const touchingFurniture = elements.some(el => {
      if (el.type === "room") return false;
      return isOverlapping(sideBox, el);
    });
    if (touchingFurniture) {
      score += 2;
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

  const nearSensitive = elements.filter(el => el.type === "door" || el.type === "window").filter(el => {
    const dx = Math.max(el.x - (trial.x + trial.width), trial.x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (trial.y + trial.height), trial.y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 40;
  });

  score -= nearSensitive.length * 3;

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



  // 문이랑 창문 주변 아니게 해야됨
  // 침대도 주변 그렇게 해야되나? 일단 그냥 진행해
