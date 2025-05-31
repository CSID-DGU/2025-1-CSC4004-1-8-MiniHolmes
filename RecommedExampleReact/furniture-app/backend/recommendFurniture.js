const { placeBed } = require('./placeBed');
const { placeDesk } = require('./placeDesk');
const { placeCloset } = require('./placeCloset');
const { placeBookshelf } = require('./placeBookshelf');

function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

function roundDimensions(furniture) {
  if (!furniture?.dimensions) return;
  furniture.dimensions.width = roundToNearestTen(furniture.dimensions.width);
  furniture.dimensions.height = roundToNearestTen(furniture.dimensions.height);
}

function recommendFurniture(furnitureList, room, design) {
  const elements = [...room];
  const results = [];

  const placementFunctions = {
    bed: placeBed,
    closet: placeCloset,
    desk: placeDesk,
    bookshelf: placeBookshelf
  };

  for (const category of Object.keys(placementFunctions)) {
    const furniture = furnitureList.find(f => f.category === category);

    if (!furniture) continue;

    roundDimensions(furniture);

    if (design === "cozy") design = "natural";

    let placed;
    if (category === "bed" || category === "desk") {
      placed = placementFunctions[category](elements, design, furniture);
    } else {
      placed = placementFunctions[category](elements, furniture);
    }

    if (placed?.element) {
      elements.push(placed.element);
      results.push({
        element: placed.element,
        reasons: placed.reason || placed.reasons || {}
      });
    }
  }

  return JSON.stringify({ placements: results });
}

module.exports = { recommendFurniture };
