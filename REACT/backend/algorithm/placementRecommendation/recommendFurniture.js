const fs = require('fs');
const { placeBed } = require('./placeBed');
const { placeWardrobe } = require('./placeWardrobe');
const { placeDesk } = require('./placeDesk');
const { placeBookshelf } = require('./placeBookshelf');
const { getRecommendedSets } = require('./recommendFurnitureWhat');

const userWeights = {
  style: 0.5,
  colortone: 0.1,
  size: 0.2,
  price: 0.2,
  target_style: "natural",
  target_colortone: "light"
};
const budget = 1000000;
const perimeter = 600;

function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

function roundDimensions(furniture) {
  if (!furniture?.dimensions) return;
  furniture.dimensions.width = roundToNearestTen(furniture.dimensions.width);
  furniture.dimensions.height = roundToNearestTen(furniture.dimensions.height);
}

function recommendFurniture() {
  const recommendedSets = getRecommendedSets(userWeights, budget, perimeter);
  const results = [];
  const MAX_TRIALS = 25;

  recommendedSets.forEach((set, setIdx) => {
    const furnitureSet = set.furnitureSet;
    const seenLayouts = new Set();
    let successfulTrials = 0;
    let trialCount = 0;

    while (successfulTrials < 3 && trialCount < MAX_TRIALS) {
      let elements = [
        { type: "room", x: 600, y: 500 },
        { type: "window", x: 200, y: 0, width: 100, height: 10 },
        { type: "door", x: 0, y: 0, width: 70, height: 50 },
        { type: "built-in", x: 0, y: 400, width: 80, height: 100 },
        { type: "toilet", x: 500, y: 400, width: 100, height: 100 }
      ];
      let reason = [];

      const bed = furnitureSet.find(f => f.category == 'bed');
      const closet = furnitureSet.find(f => f.category == 'closet');
      const desk = furnitureSet.find(f => f.category == 'desk');
      const bookshelf = furnitureSet.find(f => f.category == 'bookshelf');

      roundDimensions(bed);
      roundDimensions(closet);
      roundDimensions(desk);
      roundDimensions(bookshelf);


      let result = placeBed(elements, userWeights.target_style, bed);
      elements = result.elements;
      Object.entries(result.reasons ?? {}).forEach(([type, r]) => {
        reason.push({ type, reason: r.join(", ") });
      });

      result = placeWardrobe(elements, closet);
      elements = result.elements;
      Object.entries(result.reasons ?? {}).forEach(([type, r]) => {
        reason.push({ type, reason: r.join(", ") });
      });

      result = placeDesk(elements, userWeights.target_style, desk);
      elements = result.elements;
      Object.entries(result.reasons ?? {}).forEach(([type, r]) => {
        reason.push({ type, reason: r.join(", ") });
      });

      result = placeBookshelf(elements, bookshelf);
      elements = result.elements;
      Object.entries(result.reasons ?? {}).forEach(([type, r]) => {
        reason.push({ type, reason: r.join(", ") });
      });

      const layoutKey = JSON.stringify(
        elements
          .filter(e => !["room", "window", "door", "toilet", "built-in"].includes(e.type))
          .map(e => `${e.type}:${e.x},${e.y},${e.width},${e.height}`)
          .sort()
      );

      if (!seenLayouts.has(layoutKey)) {
        seenLayouts.add(layoutKey);
        results.push({ setIdx, trial: successfulTrials, elements, reason });
        successfulTrials++;
      }

      trialCount++;
    }
  });

  generateHTML(results);
  exportResultsToJson(results);
  console.log("multi_layout_preview.html 파일이 생성되었습니다.");
  console.log("result.json 파일이 생성되었습니다.");
}

function generateHTML(resultSets) {
  const canvasDivs = resultSets.map(({ setIdx, trial, reason }, idx) => {
    const reasonText = reason
      .map(r => {
    const items = r.reason.split(",").map(s => s.trim());
    return `<li><b>${r.type}</b><ul>` +
      items.map(item => `<li>${item}</li>`).join("") +
      `</ul></li>`;
     })
      .join("");

    return `
      <div style="display:inline-block; margin:20px; vertical-align:top;">
        <h3>추천 세트 ${setIdx + 1} - 시도 ${trial + 1}</h3>
        <canvas id="canvas${idx}" style="border:1px solid #999;"></canvas>
        <ul style="max-width: ${600}px; padding-left: 20px;">${reasonText}</ul>
      </div>`;
  });

  const elementData = resultSets.map(({ elements }, idx) => {
    return `{ id: "canvas${idx}", elements: ${JSON.stringify(elements)} }`;
  });

  const html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>추천 가구 배치 결과</title>
    </head>
    <body>
      <h1>추천 가구 배치 결과 (${resultSets.length}개 시도)</h1>
      ${canvasDivs.join('\n')}

      <script>
        window.onload = function() {
          const allElements = [${elementData.join(',\n')}];

          allElements.forEach(({ id, elements }) => {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext("2d");
            const room = elements.find(e => e.type === "room");
            canvas.width = room.x;
            canvas.height = room.y;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, room.x, room.y);
            ctx.strokeStyle = "black";
            ctx.strokeRect(0, 0, room.x, room.y);

            for (const el of elements) {
              if (el.type === "room") continue;
              ctx.fillStyle = getColor(el.type);
              ctx.fillRect(el.x, el.y, el.width || 5, el.height || 5);
              ctx.fillStyle = "black";
              ctx.font = "12px sans-serif";
              ctx.fillText(el.type, el.x + 2, el.y + 12);
            }
          });

          function getColor(type) {
            switch(type) {
              case "window": return "skyblue";
              case "door": return "orange";
              case "toilet": return "gray";
              case "built-in": return "darkgray";
              case "bed": return "lightgreen";
              case "wardrobe": return "saddlebrown";
              case "desk": return "lightblue";
              case "bookshelf": return "gold";
              default: return "pink";
            }
          }
        };
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync('multi_layout_preview.html', html);
}


function exportResultsToJson(resultSets) {
  const exportData = resultSets.map(({ setIdx, trial, elements, reason }) => ({
    setIndex: setIdx,
    trialIndex: trial,
    elements: elements,
    reasons: reason
  }));

  fs.writeFileSync("result.json", JSON.stringify(exportData, null, 2), "utf-8");
}


// bookself 안고침

recommendFurniture();
