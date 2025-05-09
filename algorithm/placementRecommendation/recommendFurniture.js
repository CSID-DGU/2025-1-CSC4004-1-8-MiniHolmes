const { placeBed } = require('./placeBed');

function recommendFurniture()
{
    let design  = "modern"
    let elements = [
        { 
            type: "room",
            x: 1000,
            y: 800
          },
        { 
          type: "window",
          x: 300,
          y: 0,
          width: 100,
          height: 10
        },
        {
          type: "toilet",
          x: 0,
          y: 0,
          width: 80,
          height: 80
        },
        {
          type: "built-in",
          x: 0,
          y: 200,
          width: 80,
          height: 100
        },
        {
            type: "door",       
            x: 180,
            y: 0,
            width: 40,
            height: 10
          }
      ];
      
      let reason = [];
      elements,reason = placeBed(elements,design);
      // placeWardrobe();
      // placeDesk();
      // placeBookshelf();

      console.log("배치 결과:", elements,"\n");
      console.log(reason);
}

recommendFurniture();