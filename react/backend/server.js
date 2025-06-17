// server.js 확장 - 파이썬 가구 배치 API 연동

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // Import the file system module
// 기존 recommendFurniture 임포트 제거
// const { recommendFurniture } = require('./algorithm/placementRecommendation/recommendFurniture.js');
// const { spawn } = require('child_process'); // spawn은 더 이상 사용되지 않으므로 주석 처리 또는 제거
const authRoutes = require('./routes/auth');
const placementsRouter = require('./routes/placements');
const communityRoutes = require('./routes/community');
const furniturePlacementApiRoutes = require('./api/furniturePlacementRoute.js');

// furniture_choosing.js에서 recommendSets 함수와 convertRanksToWeights 함수를 임포트
// REMOVE or COMMENT OUT the old placementRecommendation/furnitureChoosing imports
// const {
//   recommendSets,
//   convertRanksToWeights,
//   FurnitureItem,
//   BeddingItem,
//   MattressItem,
//   CurtainItem
// } = require('./algorithm/furnitureChoosing/furniture_choosing.js');

// 개별 가구 배치 알고리즘 임포트 (경로 수정)
const { placeBed } = require('./algorithm/furnitureplacement/placeBed.js');
const { placeDesk } = require('./algorithm/furnitureplacement/placeDesk.js');
const { placeWardrobe } = require('./algorithm/furnitureplacement/placeCloset.js'); // Corrected to placeCloset.js
const { placeBookshelf } = require('./algorithm/furnitureplacement/placeBookshelf.js');

// recommendFurniture.js 에서 recommendFurniture 함수를 임포트 (경로 수정)
const { recommendFurniture } = require('./algorithm/furnitureplacement/recommendFurniture.js');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24시간
}));

// 요청 로깅 미들웨어 추가
app.use((req, res, next) => {
  console.log(new Date().toISOString() + ' - ' + req.method + ' ' + req.url);
  // console.log('Request Headers:', req.headers);
  // console.log('Request Body:', req.body); // body는 json() 파싱 후 로깅
  next();
});

app.use(express.json());

// JSON body 파싱 후 다시 로깅 (필요하다면)
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    // console.log('Parsed Request Body:', req.body);
  }
  next();
});

// 인증 라우트 추가
app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes);
app.use('/api', furniturePlacementApiRoutes);

// static 파일 서빙 설정
const publicPath = path.join(__dirname, 'public');
console.log('Static files directory:', publicPath);

// 모델 파일 및 텍스처 요청 디버깅을 위한 미들웨어
app.use((req, res, next) => {
  if (req.path.startsWith('/models/') || req.path.startsWith('/textures/')) {
    console.log('Static file request:', {
      path: req.path,
      method: req.method,
      headers: req.headers
    });
  }
  next();
});

// 모델 파일 서빙 설정
app.use('/models', express.static(path.join(publicPath, 'models'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.glb')) {
      res.set('Content-Type', 'model/gltf-binary');
    }
  }
}));

// 기타 static 파일 서빙
app.use('/thumbnails', express.static(path.join(publicPath, 'thumbnails')));
app.use('/textures', express.static(path.join(publicPath, 'textures')));
app.use('/draco', express.static(path.join(publicPath, 'draco')));

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/roomviz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 연결 성공');
}).catch(err => {
  console.error('MongoDB 연결 실패:', err);
});

// 가구 스키마 정의
const furnitureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // bed, desk, wardrobe, bookshelf
  style: { type: String }, // modern, classic, natural
  dimensions: {
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  colortone: { type: String },
  price: { type: Number },
  brand: { type: String },
  glb_file: { type: String, required: true },
  url: { type: String }
});

const Furniture = mongoose.models.Furniture || mongoose.model('Furniture', furnitureSchema, 'furniture');

// 침구 스키마 정의
const beddingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true }, // bedding
    style: { type: String },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true }
    },
    colortone: { type: String },
    material: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String }
});

const Bedding = mongoose.models.Bedding || mongoose.model('Bedding', beddingSchema, 'bedding');

// 매트리스 커버 스키마 정의
const mattressCoverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true }, // mattresscover
    style: { type: String },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true }
    },
    colortone: { type: String },
    material: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String }
});

const MattressCover = mongoose.models.MattressCover || mongoose.model('MattressCover', mattressCoverSchema, 'mattresscover');

// 커튼 스키마 정의
const curtainSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true }, // curtain
    style: { type: String },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true }
    },
    colortone: { type: String },
    opaqueness: { type: String },
    price: { type: Number },
    brand: { type: String },
    jpg_file: { type: String },
    url: { type: String }
});

const Curtain = mongoose.models.Curtain || mongoose.model('Curtain', curtainSchema, 'curtain');


// API 라우트
app.get('/api/furniture', async (req, res) => {
  try {
    const furnitureList = await Furniture.find({}, {
      _id: 1,
      name: 1,
      category: 1,
      style: 1,
      dimensions: 1,
      colortone: 1,
      price: 1,
      brand: 1,
      glb_file: 1,
      url: 1
    }).lean();
    res.json(furnitureList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/furniture/:id', async (req, res) => {
  try {
    const furniture = await Furniture.findById(req.params.id);
    if (!furniture) return res.status(404).json({ message: '가구를 찾을 수 없습니다' });
    res.json(furniture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/furniture/category/:category', async (req, res) => {
  try {
    const furnitureList = await Furniture.find({ category: req.params.category });
    res.json(furnitureList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 가구 자동 배치 API
app.post('/api/furniture/auto-placement', async (req, res) => {
  let { furniture, roomDimensions, design } = req.body;

  if (!roomDimensions) {
    return res.status(400).json({ message: '방 크기 정보가 필요합니다' });
  }
  if (!furniture || !Array.isArray(furniture)) {
    return res.status(400).json({ message: '배치할 가구 목록이 필요합니다' });
  }

  try {
    // Convert door dimensions to numbers
    const formattedElements = [{ ...roomDimensions, type: 'room' }];
    if (roomDimensions.doors) {
      formattedElements.push(...roomDimensions.doors.map(door => ({
        ...door,
        type: 'door',
        width: Number(door.width),
        height: Number(door.height)
      })));
    }
    if (roomDimensions.windows) {
      formattedElements.push(...roomDimensions.windows.map(window => ({
        ...window,
        type: 'window',
        width: Number(window.width),
        height: Number(window.height)
      })));
    }
    if (roomDimensions.roomDividers) {
      formattedElements.push(...roomDimensions.roomDividers.map(divider => ({
        ...divider,
        type: 'roomDivider',
        width: Number(divider.width),
        height: Number(divider.height)
      })));
    }

    let placedElements = formattedElements;
    const placementResults = [];
    const categoryOrder = ['bed', 'closet', 'desk', 'bookshelf'];

    const sortedFurniture = furniture.sort((a, b) => {
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });

    for (const item of sortedFurniture) {
      let result;
      if (!item.dimensions || typeof item.dimensions.width === 'undefined' || typeof item.dimensions.height === 'undefined') {
        console.warn('Skipping item ' + item.name + ' due to missing or invalid dimensions', item);
        placementResults.push({ item: item.name, status: 'skipped', reason: 'Missing or invalid dimensions' });
        continue;
      }

      const furnitureDataForPlacement = {
        ...item,
        width: item.dimensions.width,
        depth: item.dimensions.depth,
        height: item.dimensions.height,
        type: item.category
      };

      switch (item.category) {
        case 'bed':
          result = placeBed([...placedElements], design, furnitureDataForPlacement);
          break;
        case 'desk':
          result = placeDesk([...placedElements], design, furnitureDataForPlacement);
          break;
        case 'closet':
          result = placeWardrobe([...placedElements], furnitureDataForPlacement);
          break;
        case 'bookshelf':
          result = placeBookshelf([...placedElements], furnitureDataForPlacement);
          break;
        default:
          console.warn('No placement algorithm for category: ' + item.category);
          placementResults.push({ item: item.name, status: 'skipped', reason: 'No algorithm for ' + item.category });
          continue;
      }

      if (result && result.bestPosition) {
        const placedItem = {
          ...furnitureDataForPlacement,
          name: item.name,
          oid: item.oid,
          glb_file: item.glb_file,
          url: item.url,
          x: result.bestPosition.x,
          y: result.bestPosition.y,
          isHorizon: result.bestPosition.isHorizon,
          width: result.bestPosition.isHorizon ? furnitureDataForPlacement.depth : furnitureDataForPlacement.width,
          height: result.bestPosition.isHorizon ? furnitureDataForPlacement.width : furnitureDataForPlacement.depth,
          placementScore: result.score,
          placementReasons: result.reasons
        };
        placedElements.push(placedItem);
        placementResults.push({ item: item.name, status: 'placed', details: placedItem });
      } else {
        placementResults.push({ item: item.name, status: 'failed', reason: 'Could not find suitable position', result: result });
        console.warn('Failed to place ' + item.category + ': ' + item.name, result);
      }
    }
    res.json({ placedItems: placedElements.filter(el => el.type !== 'room'), summary: placementResults });
  } catch (error) {
    console.error('자동 배치 중 오류 발생:', error);
    res.status(500).json({ message: '자동 배치 중 오류가 발생했습니다', error: error.message, stack: error.stack });
  }
});

// === FURNITUREPLACEMENT LOGIC START ===
// const fpPath = path.join(__dirname, 'algorithm', 'furnitureplacement'); // Not used directly it seems
// We are now using recommendFurniture from furnitureplacement which handles its own sub-imports

// 기존 /api/furniture/recommend 라우트 제거 또는 주석 처리 후 아래로 대체
/*
app.post('/api/furniture/recommend', async (req, res) => {
  console.log("[server.js] /api/furniture/recommend POST request received.");
  // Destructure user_weights from req.body and rename it to userPreferenceRank
  const { user_weights: userPreferenceRank, currentBudget, perimeter, currentPointColor, roomInfo } = req.body;

  console.log("[server.js] Request body for recommend:", JSON.stringify(req.body, null, 2));
  console.log("[server.js] userPreferenceRank after destructuring:", JSON.stringify(userPreferenceRank, null, 2));

  if (!userPreferenceRank || typeof currentBudget === 'undefined' || !roomInfo || typeof perimeter === 'undefined' || typeof currentPointColor === 'undefined') {
    console.error("[server.js] Missing required fields for recommendation:", { userPreferenceRank, currentBudget, perimeter, currentPointColor, roomInfo });
    return res.status(400).json({ message: '필수 입력 정보(선호도, 예산, 방 정보, 둘레, 포인트색상)가 누락되었습니다.' });
  }

  const { width: roomWidth, depth: roomDepth } = roomInfo;

  if (typeof roomWidth === 'undefined' || typeof roomDepth === 'undefined') {
    console.error("[server.js] Missing room dimensions:", { roomWidth, roomDepth });
    return res.status(400).json({ message: '방 크기(너비, 깊이) 정보가 필요합니다.' });
  }

  try {
    // recommendFurniture is now async and handles everything
    const result = await recommendFurniture(userPreferenceRank, currentBudget, perimeter, currentPointColor, roomInfo);
    
    console.log("[server.js] Result from recommendFurniture (furnitureplacement):");
    // console.log(JSON.stringify(result, null, 2)); // Can be very verbose

    if (!result || !result.recommendedSet || !result.placements) {
      console.error("[server.js] Recommendation logic failed to return expected structure.", result);
      return res.status(500).json({ error: 'Recommendation logic failed or returned unexpected structure' });
    }

    // The placements from recommendFurniture should already have enriched element details.
    const responsePayload = {
      recommendedSet: result.recommendedSet,
      placements: result.placements 
    };
    
    console.log("📤 API 응답 데이터 (from furnitureplacement/recommendFurniture):");
    // console.log(JSON.stringify(responsePayload, null, 2)); // Can be very verbose
    res.json(responsePayload);

  } catch (error) {
    console.error("[server.js] /api/furniture/recommend Error:", error.message, error.stack);
    res.status(500).json({ error: '추천 실패: ' + error.message });
  }
});
*/
// === FURNITUREPLACEMENT LOGIC END ===

app.use('/api/placements', placementsRouter);

// 루트 경로 리다이렉트 추가
app.get('/', (req, res) => {
  res.redirect('http://34.64.137.61:3000/miniholmes/mypage');
});

// 서버 실행
app.listen(PORT, '0.0.0.0', () => {
  console.log('서버가 포트 ' + PORT + '에서 실행 중입니다.');
  console.log('External access: http://34.64.137.61:' + PORT);
});
