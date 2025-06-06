/*
// 원본이랑 달라진 점
// 1. mongoose로 DB 모델(Furniture, Bedding 등) 정의하는 코드가 추가됨
// 2. recommendFurnitureWhat에서 여러 객체(require)하는 부분 추가
*/
const mongoose = require('mongoose');
const { placeBed } = require('./placeBed');
const { placeDesk } = require('./placeDesk');
const { placeCloset } = require('./placeCloset'); // placeCloset이 존재한다고 가정 (이전 placeWardrobe)
const { placeBookshelf } = require('./placeBookshelf');
const {
  recommendSets,
  convertRanksToWeights,
  FurnitureItem,
  BeddingItem,
  MattressItem,
  CurtainItem
} = require('./recommendFurnitureWhat'); // 이 파일 기준으로 경로가 정확하다고 가정

// MongoDB 모델 (프로젝트에 정확하게 정의되어 있는지 확인)
const Furniture = mongoose.models.Furniture || mongoose.model('Furniture', new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  style: { type: String },
  dimensions: {
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  colortone: { type: String },
  price: { type: Number },
  brand: { type: String },
  glb_file: { type: String, required: true },
  url: { type: String },
  oid: {type: String }
}), 'furniture');

const Bedding = mongoose.models.Bedding || mongoose.model('Bedding', new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    style: { type: String },
    dimensions: { length: { type: Number, required: true }, width: { type: Number, required: true }},
    colortone: { type: String },
    material: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String },
    oid: {type: String }
}), 'bedding');

const MattressCover = mongoose.models.MattressCover || mongoose.model('MattressCover', new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    style: { type: String },
    dimensions: { length: { type: Number, required: true }, width: { type: Number, required: true }},
    colortone: { type: String },
    material: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String },
    oid: {type: String }
}), 'mattresscover');

const Curtain = mongoose.models.Curtain || mongoose.model('Curtain', new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    style: { type: String },
    dimensions: { length: { type: Number, required: true }, width: { type: Number, required: true }},
    colortone: { type: String },
    opaqueness: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String },
    oid: {type: String }
}), 'curtain');

function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

function roundDimensions(furniture) {
  if (!furniture?.dimensions) return;
  furniture.dimensions.width = roundToNearestTen(furniture.dimensions.width);
  furniture.dimensions.depth = roundToNearestTen(furniture.dimensions.depth);
}

// Helper function to calculate x, y for items based on wall and offset
function calculateWallItemCoordinates(item, roomWidth, roomDepth) {
    let x = 0, y = 0;
    const offset = Number(item.offset || 0);
    const itemWidth = Number(item.width);
    const itemHeight = Number(item.height);

    // 참고: 'north'는 상단(y=0), 'south'는 하단(y=roomDepth-itemHeight)
    // 'west'는 좌측(x=0), 'east'는 우측(x=roomWidth-itemWidth)
    switch (item.wall?.toLowerCase()) {
        case 'north': // 상단 벽
            x = offset;
            y = 0;
            break;
        case 'south': // 하단 벽
            x = offset;
            y = roomDepth - itemHeight;
            break;
        case 'west': // 좌측 벽
            x = 0;
            y = offset;
            break;
        case 'east': // 우측 벽
            x = roomWidth - itemWidth;
            y = offset;
            break;
        default:
            console.warn(`[calculateWallItemCoordinates] 알 수 없거나 누락된 벽: '${item.wall}' (아이템 유형: '${item.type}'). x,y를 0,0으로 기본 설정합니다.`);
            // 기존 x,y 좌표가 있으면 유지하고, 없으면 0,0으로 설정
            x = Number(item.x || 0); 
            y = Number(item.y || 0);
            break;
    }
    return { ...item, x, y, width: itemWidth, height: itemHeight }; // width/height가 숫자인지 확인
}

// partition_wall용 변환 함수 추가 (두께 10cm 고정)
function partitionWallToElement(partition, roomWidth, roomDepth) {
  const wall = partition.wall?.toLowerCase();
  const length = Number(partition.length);
  const height = Number(partition.height);
  const wallOffset = Number(partition.wallOffset || 0);
  const thickness = 10; // 가벽 두께 10cm 고정

  let x = 0, y = 0, width = 0, h = 0;
  if (wall === 'north') {
    x = wallOffset;
    y = 0;
    width = length;
    h = thickness;
  } else if (wall === 'south') {
    x = wallOffset;
    y = roomDepth - thickness;
    width = length;
    h = thickness;
  } else if (wall === 'west') {
    x = 0;
    y = wallOffset;
    width = thickness;
    h = length;
  } else if (wall === 'east') {
    x = roomWidth - thickness;
    y = wallOffset;
    width = thickness;
    h = length;
  } else {
    // 기본값: 'north' (상단 벽) 기준으로 처리
    x = wallOffset;
    y = 0;
    width = length;
    h = thickness;
  }
  return {
    ...partition,
    type: 'partition_wall',
    x, y,
    width, height: h
  };
}

async function recommendFurniture(userPreferenceRank, currentBudget, perimeter, currentPointColor, roomInfo) {
  console.log("[recommendFurniture in furnitureplacement] Received roomInfo:", JSON.stringify(roomInfo, null, 2));
  const { width: roomWidth, depth: roomDepth, doors, windows, roomDividers, colorZones } = roomInfo;

  if (!roomWidth || !roomDepth) {
    throw new Error('Room width and depth are required in roomInfo.');
  }
  
  // 1. Fetch data from MongoDB
  const furnitureData = await Furniture.find({}).lean();
  const beddingData = await Bedding.find({}).lean();
  const mattressData = await MattressCover.find({}).lean(); // MattressCover 모델로 가정
  const curtainData = await Curtain.find({}).lean();

  const furnitureDb = furnitureData.map(item => new FurnitureItem(item));
  const beddingList = beddingData.map(item => new BeddingItem(item));
  const mattressList = mattressData.map(item => new MattressItem(item));
  const curtainList = curtainData.map(item => new CurtainItem(item));

  // 2. Convert ranks to weights
  const userWeights = convertRanksToWeights(userPreferenceRank);
  let design = userWeights.target_style || 'modern'; // 사용자 목표 스타일 추출, 없으면 'modern'으로 기본 설정

  // 3. Recommend sets
  const allRecommendedSets = recommendSets(
    furnitureDb,
    beddingList,
    mattressList,
    curtainList,
    userWeights,
    currentBudget,
    perimeter,
    currentPointColor
  );

  if (!allRecommendedSets || allRecommendedSets.length === 0) {
    // 기준에 맞는 추천 가구 세트가 없는 경우, null 또는 빈 배열 반환 가능
    console.warn("기준에 따라 추천할 수 있는 가구 세트가 없습니다.");
    return { recommendedSet: null, placements: [] }; 
  }

  const firstRecommendedSet = allRecommendedSets[0]; // 가장 첫 번째 추천 세트를 사용
  const furnitureListToPlace = firstRecommendedSet.furnitureSet;

  // 4. Prepare elements for placement, now with calculated x, y for doors/windows
  const elements = [
    { type: 'room', width: Number(roomWidth), depth: Number(roomDepth) },
    ...(doors || []).map(door => calculateWallItemCoordinates({ ...door, type: 'door' }, Number(roomWidth), Number(roomDepth))),
    ...(windows || []).map(window => calculateWallItemCoordinates({ ...window, type: 'window' }, Number(roomWidth), Number(roomDepth))),
    ...(roomDividers || []).map(divider => partitionWallToElement(divider, Number(roomWidth), Number(roomDepth))),
    ...(colorZones || []).map(zone => ({ ...zone, type: 'color_zone' }))
  ];
  
  console.log("[recommendFurniture in furnitureplacement] Elements for placement (with x,y for doors/windows):", JSON.stringify(elements, null, 2));


  const placementResults = [];

  const placementFunctions = {
    bed: placeBed,
    closet: placeCloset,
    desk: placeDesk,
    bookshelf: placeBookshelf
  };

  // Create a mutable copy of elements for this trial
  let currentElementsInTrial = JSON.parse(JSON.stringify(elements));

  for (const category of ['bed', 'closet', 'desk', 'bookshelf']) { // 미리 정의된 가구 배치 순서
    const furniture = furnitureListToPlace.find(f => f.category === category);

    if (!furniture) {
      console.log(`[recommendFurniture] No furniture of category '${category}' in the recommended set.`);
      continue;
    }
    
    // 나중에 필터링 및 식별을 위해 가구에 OID가 있는지 확인
    if (!furniture.oid) {
        console.warn(`[recommendFurniture] 가구 아이템 ${furniture.name}에 OID가 없습니다. 배치용 임시 OID를 할당합니다.`);
        furniture.oid = `temp_${category}_${Date.now()}`;
    }


    // 배치 로직에 사용될 가구 객체 생성 (치수 반올림 적용).
    // 원본 furnitureListToPlace의 가구 객체는 변경되지 않아야 함.
    const furnitureForPlacement = JSON.parse(JSON.stringify(furniture));
    roundDimensions(furnitureForPlacement); // furnitureForPlacement 객체의 치수를 수정

    if (design === "cozy") design = "natural"; // 'cozy' 스타일은 'natural'로 처리

    let placed; // 배치 결과 저장 변수
    if (category === "bed" || category === "desk") { // 침대 또는 책상인 경우 디자인 스타일 전달
      placed = placementFunctions[category](currentElementsInTrial, design, furnitureForPlacement);
    } else { // 그 외 가구는 디자인 스타일 불필요
      placed = placementFunctions[category](currentElementsInTrial, furnitureForPlacement);
    }

    if (placed?.element) {
      // 현재 시행 중인 요소 목록에서 이전 버전의 아이템(OID 기준) 및 OID가 없는 아이템(방, 벽 등)을 제거
      currentElementsInTrial = currentElementsInTrial.filter(el => el.oid !== placed.element.oid || !el.oid );
      currentElementsInTrial.push(placed.element); // 새로 배치된 요소 추가
      
      // 최종 결과에 사용될 배치된 요소에 원본 전체 세부 정보 추가
      const originalFurnitureDetails = furnitureListToPlace.find(f => f.oid === placed.element.oid);
      const finalPlacedElement = {
          ...placed.element, // 배치된 요소의 정보 (x, y, isHorizon, 회전에 따른 너비/깊이 등)
          // 추천 세트의 모든 원본 세부 정보 다시 추가
          name: originalFurnitureDetails.name,
          glb_file: originalFurnitureDetails.glb_file,
          type: originalFurnitureDetails.category, // 유형이 카테고리인지 확인
          dimensions: originalFurnitureDetails.dimensions, // 원본 치수
          style: originalFurnitureDetails.style,
          colortone: originalFurnitureDetails.colortone,
          price: originalFurnitureDetails.price,
          brand: originalFurnitureDetails.brand,
          url: originalFurnitureDetails.url,
          oid: originalFurnitureDetails.oid, // 중요: 원본 OID 사용
          _id: originalFurnitureDetails._id ? String(originalFurnitureDetails._id) : undefined // ObjectId 포함 (프론트엔드 저장용)
      };

      placementResults.push({
        element: finalPlacedElement,
        reasons: placed.reason || placed.reasons || {}
      });
    } else {
        console.warn(`[recommendFurniture] Placement failed for ${category}: ${furniture.name}`);
    }
  }

  console.log("[recommendFurniture in furnitureplacement] Final placement results:", JSON.stringify(placementResults, null, 2));
  
  return {
    recommendedSet: firstRecommendedSet, // 추천된 전체 가구 세트
    placements: placementResults // 전체 세부 정보가 포함된 배치된 요소들의 배열 반환
  };
}

module.exports = { recommendFurniture };
