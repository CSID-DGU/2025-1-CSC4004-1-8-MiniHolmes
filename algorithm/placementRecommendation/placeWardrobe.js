function isOverlapping(a, b) 
{
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }
  
  function restPlace(elements) 
  {
    const room = elements.find(el => el.type === "room");
    if (!room) return 0;
  
    const roomArea = room.x * room.y;
    const obstacleArea = elements
      .filter(el => el.type !== "room")
      .reduce((sum, el) => sum + el.width * el.height, 0);
  
    return roomArea - obstacleArea;
  }
  
  function filterValidPositions(positions, elements, furniture) 
  {
    const valid = [];
  
    for (const pos of positions) 
      {
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
  
      const overlaps = elements.some(el => 
        {
        if (el.type === "room") return false;
        return isOverlapping(trial, el);
      });
  
      if (!overlaps) valid.push(trial);
    }
  
    return valid;
  }
  
  function findAvailableWalls(elements, room) 
  {
    const windowWalls = [];
    for (const el of elements) 
      {
      if (el.type === "window") 
        {
        if (el.y === 0) windowWalls.push("top");
        else if (el.x === 0) windowWalls.push("left");
        else if (el.x + el.width === room.x) windowWalls.push("right");
        else if (el.y + el.height === room.y) windowWalls.push("bottom");
      }
    }
    return ["top", "bottom", "left", "right"].filter(w => !windowWalls.includes(w));
  }
  
  function generateWallBeltPositions(furniture, room, step = 10, belt = 30) 
  {
    const positions = [];
    const walls = ["top", "bottom", "left", "right"];
  
    for (const wall of walls) 
      {
      for (const isHorizon of [false, true]) 
        {
        const width = isHorizon ? furniture.height : furniture.width;
        const height = isHorizon ? furniture.width : furniture.height;
  
        if (wall === "bottom") {
          for (let dy = 0; dy <= belt; dy += step) 
            {
            const y = room.y - height - dy;
            for (let x = 0; x <= room.x - width; x += step) 
              {
              positions.push({ x, y, isHorizon });
            }
          }
        } else if (wall === "top") {
          for (let dy = 0; dy <= belt; dy += step) 
            {
            const y = dy;
            for (let x = 0; x <= room.x - width; x += step) 
              {
              positions.push({ x, y, isHorizon });
            }
          }
        } else if (wall === "left") {
          for (let dx = 0; dx <= belt; dx += step) 
            {
            const x = dx;
            for (let y = 0; y <= room.y - height; y += step) 
              {
              positions.push({ x, y, isHorizon });
            }
          }
        } else if (wall === "right") {
          for (let dx = 0; dx <= belt; dx += step) 
            {
            const x = room.x - width - dx;
            for (let y = 0; y <= room.y - height; y += step) 
              {
              positions.push({ x, y, isHorizon });
            }
          }
        }
      }
    }
    return positions;
  }
  
  function selectRandomFromTop(validPositions, topN = 10) 
  {
    const limited = validPositions.slice(0, topN);
    if (limited.length === 0) return null;
    const index = Math.floor(Math.random() * limited.length);
    return limited[index];
  }
  
  function addToElements(elements, furniture) 
  {
    elements.push({
      type: furniture.type,
      x: furniture.x,
      y: furniture.y,
      width: furniture.width,
      height: furniture.height
    });
  }
  
  function getTrueCornerScore(pos, elements, room) 
  {
    let score = 0;
    const margin = 20;
    const nearWall = (
      pos.x <= margin ||
      pos.y <= margin ||
      pos.x + 1 >= room.x - margin ||
      pos.y + 1 >= room.y - margin
    );

    if (nearWall) score += 1;

    const nearObstacles = elements.filter(el => el.type !== "room").filter(el => 
      {
      return isOverlapping({ x: pos.x, y: pos.y, width: 1, height: 1 }, el);
    });
  
    score += nearObstacles.length * 2;
    return score;
  }
  
  function prioritizeTrueCorners(positions, elements, room) 
  {
    return positions.sort((a, b) => 
      {
      const scoreA = getTrueCornerScore(a, elements, room);
      const scoreB = getTrueCornerScore(b, elements, room);
      return scoreB - scoreA;
    });
  }
  
  // 옷장 배치 (장애물+벽 기준의 구석 우선)
  function placeWardrobe(elements) 
  {
    const reasons = [];
    const room = elements.find(el => el.type === "room");
    const wardrobe = 
    {
      type: "wardrobe",
      width: 100,
      height: 180,
    };

    const step = 10;
    // 하이퍼파라미터 튜닝 필요
    if (restPlace(elements) < wardrobe.width * wardrobe.height) 
    {
      reasons.push({ type: "wardrobe", reason: "배치공간 부족" });
      return { elements, reasons };
    }
  
    let positions = generateWallBeltPositions(wardrobe, room, step, 30);
    positions = prioritizeTrueCorners(positions, elements, room);
    const valid = filterValidPositions(positions, elements, wardrobe);
    const chosen = selectRandomFromTop(valid, 10);
  
    if (chosen) 
      {
      addToElements(elements, chosen);
      reasons.push({ type: "wardrobe", reason: "구석(벽+장애물)에 우선 배치됨" });
    } 
    else 
    {
      // 여기 그냥 추가 랜덤배치 알고리즘 추가해야할듯
      console.log("옷장 배치 실패: 구석/벽 주변에도 공간 없음");
    }
  
    return { elements, reasons };
  }

  module.exports = { placeWardrobe };
