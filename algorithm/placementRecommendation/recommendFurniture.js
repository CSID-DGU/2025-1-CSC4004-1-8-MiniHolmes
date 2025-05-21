const fs = require('fs');
const { placeBed } = require('./placeBed');
const { placeWardrobe } = require('./placeWardrobe');
const { placeDesk } = require('./placeDesk');
const { placeBookshelf } = require('./placeBookshelf'); // ✅ 추가

function recommendFurniture() {
  let design = "modern";
  let room1 = [
    { type: "room", x: 400, y: 500 },
    { type: "window", x: 200, y: 0, width: 100, height: 10 },
    { type: "toilet", x: 300, y: 400, width: 100, height: 100 },
    { type: "built-in", x: 0, y: 400, width: 80, height: 100 },
    { type: "door", x: 180, y: 0, width: 40, height: 10 }
  ];

  room2 =  [
    { type: "room", x: 400, y: 500 }
  ];

  let reason = [];

  ({ elements, reason } = placeBed(room2, design));
  ({ elements, reason } = placeWardrobe(room2, reason));
  ({ elements, reason } = placeDesk(elements, reason));
  ({ elements, reason } = placeBookshelf(elements, reason)); // ✅ bookshelf 배치

  const elementsJson = JSON.stringify(elements, null, 2);

  const html = `
  <html>
  <body>
    <canvas id="roomCanvas" width="1000" height="800" style="border:1px solid black;"></canvas>
    <script>
      const ctx = document.getElementById("roomCanvas").getContext("2d");
      const elements = ${elementsJson};

      const room = elements.find(el => el.type === "room");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, room.x, room.y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, room.x, room.y);

      for (const el of elements) {
        if (el.type === "room") continue;

        ctx.fillStyle = getColor(el.type);
        ctx.fillRect(el.x, el.y, el.width || 5, el.height || 5);

        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.fillText(el.type, el.x + 2, el.y + 12);
      }

      function getColor(type) {
        switch(type) {
          case "window": return "skyblue";
          case "door": return "orange";
          case "toilet": return "gray";
          case "built-in": return "darkgray";
          case "bed": return "lightgreen";
          case "wardrobe": return "saddlebrown";
          case "desk": return "lightblue";
          case "bookshelf": return "gold"; // ✅ bookshelf 색상 추가
          default: return "pink";
        }
      }
    </script>
  </body>
  </html>
  `;

  console.log("배치 결과:", elements, "\n");
  console.log(reason);
  fs.writeFileSync("layout.html", html);
  console.log("✅ layout.html 파일이 생성되었습니다. 브라우저에서 확인하세요.");
}

recommendFurniture();
