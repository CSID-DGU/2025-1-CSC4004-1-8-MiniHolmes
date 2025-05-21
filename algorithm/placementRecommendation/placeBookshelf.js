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

const generateWallBeltPositions = (furniture, room, step = 10, belt = 30) => {
  const positions = [];
  for (let x = 0; x <= room.x - furniture.width; x += step) {
    for (let y = 0; y <= room.y - furniture.height; y += step) {
      positions.push({ x, y, isHorizontal: false });
      positions.push({ x, y, isHorizontal: true });
    }
  }
  return positions;
};

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

  return score;
};

const placeBookshelf = (elements, reason = []) => {
  const room = elements.find(el => el.type === "room");
  const shelf = { type: "bookshelf", width: 80, height: 30 };
  const step = 10;

  if (restPlace(elements) < shelf.width * shelf.height) {
    reason.push({ type: "bookshelf", reason: "공간 부족" });
    return { elements, reason };
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

    const score = getBookshelfScore(pos, elements, room);
    valid.push({ ...trial, score });
  }

  if (valid.length === 0) {
    reason.push({ type: "bookshelf", reason: "조건에 맞는 위치 없음" });
    return { elements, reason };
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

  reason.push({ type: "bookshelf", reason: "벽 또는 침대에 인접한 최적 위치에 배치됨" });
  return { elements, reason };
};

module.exports = { placeBookshelf };
