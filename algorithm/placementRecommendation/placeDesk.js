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
  let width, height;
  let backArea;

  if (pos.isHorizontal) {
    width = desk.height;
    height = desk.width;
    backArea = {
      x: pos.x,
      y: pos.y + height,
      width,
      height: chairGap
    };
  } else {
    width = desk.width;
    height = desk.height;
    backArea = {
      x: pos.x + width,
      y: pos.y,
      width: chairGap,
      height
    };
  }

  return !elements.some(el => el.type !== "room" && isOverlapping(el, backArea));
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

function getPlacementScore(pos, elements, room) {
  const { x, y, width, height } = pos;

  let score = 0;
  const longSide = Math.max(width, height);

  const longSideTouchingWall =
    (width === longSide && (y === 0 || y + height === room.y)) ||
    (height === longSide && (x === 0 || x + width === room.x));

  if (longSideTouchingWall) score += 6;

  const touchesWall =
    x === 0 || x + width === room.x ||
    y === 0 || y + height === room.y;

  if (touchesWall) score += 4;

  const touchingFurniture = elements.some(el => {
    if (el.type === "room") return false;
    const box = {
      x: x - 1,
      y: y - 1,
      width: width + 2,
      height: height + 2
    };
    return isOverlapping(el, box);
  });
  if (touchingFurniture) score += 2;

  const nearFurniture = elements.some(el => {
    if (el.type === "room") return false;
    const dx = Math.max(el.x - (x + width), x - (el.x + el.width), 0);
    const dy = Math.max(el.y - (y + height), y - (el.y + el.height), 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > 0 && dist <= 20;
  });
  if (nearFurniture) score += 1;

  return score;
}


function placeDesk(elements, reason = []) {
  const room = elements.find(el => el.type === "room");
  const desk = { type: "desk", width: 120, height: 60 };
  const chairGap = 70;

  if (restPlace(elements) < desk.width * desk.height) {
    reason.push({ type: "desk", reason: "공간이 부족합니다." });
    return { elements, reason };
  }

  const positions = generateWallBeltPositions(desk, room, 10, 30);
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
    if (isTooCloseToDoor(pos, elements, desk)) continue;

    const score = getPlacementScore(trial, elements, room);
    valid.push({ ...trial, score });
  }

  if (valid.length === 0) {
    reason.push({ type: "desk", reason: "적절한 위치를 찾을 수 없습니다." });
    return { elements, reason };
  }

  const maxScore = Math.max(...valid.map(p => p.score));
  const best = valid.filter(p => p.score === maxScore);
  const selected = best[Math.floor(Math.random() * best.length)];
  console.log(best);
  elements.push({
    type: selected.type,
    x: selected.x,
    y: selected.y,
    width: selected.width,
    height: selected.height,
    isHorizontal: selected.isHorizontal // ✅ 회전 정보 저장
  });

  reason.push({ type: "desk", reason: "벽에 길게 붙인 최적 위치에 배치됨" });
  return { elements, reason };
}

module.exports = { placeDesk };
