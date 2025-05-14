// [설명]
// 이 파일은 프로젝트의 메인 백엔드 서버(Node.js/Express)입니다.
// 프론트엔드와 Python 기반 가구 추천/배치 알고리즘(backend/algorithm/furnitureChoosing/*.py) 사이의 브릿지 역할을 하며,
// REST API를 통해 가구 데이터 제공, 추천/배치 요청을 받아 Python 알고리즘을 child_process로 실행해 결과를 반환합니다.
// 실제 추천/배치 로직은 이 파일이 아닌 Python 파일에 구현되어 있습니다.

// server.js 확장 - 파이썬 가구 배치 API 연동

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const { recommendFurniture } = require('./algorithm/placementRecommendation/recommendFurniture.cjs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24시간
}));

// 개발 환경에서만 요청 로깅 미들웨어
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
  });
}

app.use(express.json());

// static 파일 서빙 설정
const publicPath = path.join(__dirname, 'public');
if (process.env.NODE_ENV === 'development') {
  console.log('Static files directory:', publicPath);
}

// 모델 파일 요청 디버깅을 위한 미들웨어 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/models/')) {
      console.log('Model request:', {
        path: req.path,
        method: req.method,
        headers: req.headers
      });
    }
    next();
  });
}

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
  let { furniture, roomDimensions } = req.body;
  if (!roomDimensions) {
    return res.status(400).json({ message: '방 크기 정보가 필요합니다' });
  }
  // furniture가 undefined/null이면 빈 배열로 처리
  if (!Array.isArray(furniture)) furniture = [];
  try {
    const result = await recommendFurniture(furniture, roomDimensions);
    res.json(result);
  } catch (error) {
    console.error('자동 배치 오류:', error);
    res.status(500).json({ message: '자동 배치 중 오류가 발생했습니다', error: error.message });
  }
});

// 가구 추천 API
app.post('/api/furniture/recommend', async (req, res) => {
  try {
    const { user_weights, max_budget, perimeter } = req.body;
    
    // 모든 가구 데이터 가져오기
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
    
    // Python 알고리즘에 맞는 형식으로 데이터 변환
    const furnitureData = furnitureList.map(item => ({
      _id: item._id ? item._id.toString() : null,
      name: item.name,
      category: item.category,
      style: item.style,
      dimensions: item.dimensions,
      colortone: item.colortone,
      price: item.price,
      brand: item.brand,
      glb_file: item.glb_file,
      url: item.url
    }));

    // Python 스크립트 실행
    const pythonProcess = spawn('python3', [
      './algorithm/furnitureChoosing/furniture_choosing_algorithm.py'
    ]);

    // 입력 데이터를 JSON으로 변환하여 표준 입력으로 전달
    const inputData = {
      furniture_db: furnitureData,
      user_weights,
      max_budget,
      perimeter
    };
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      const logMessage = data.toString();
      error += logMessage;
      // Python 스크립트의 로그를 서버 콘솔에 출력
      console.log('[Python Log]', logMessage.trim());
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[Python Error]', error);
        return res.status(500).json({ message: '가구 추천 중 오류가 발생했습니다', error });
      }

      try {
        const recommendedSets = JSON.parse(result);
        // 추천된 가구 세트의 ID 목록 반환
        const recommendedIds = recommendedSets.recommended_sets.flat().map(item => item._id);
        
        // 추천 결과 요약 로그
        console.log('[Recommendation Summary]');
        console.log(`- 총 추천 가구 수: ${recommendedIds.length}개`);
        const categoryCounts = {};
        recommendedSets.recommended_sets.forEach(set => {
          set.forEach(item => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
          });
        });
        Object.entries(categoryCounts).forEach(([category, count]) => {
          console.log(`- ${category}: ${count}개`);
        });
        
        res.json({ recommendedIds });
      } catch (e) {
        console.error('[JSON Parse Error]', e);
        res.status(500).json({ message: '결과 처리 중 오류가 발생했습니다', error: e.message });
      }
    });
  } catch (error) {
    console.error('[Server Error]', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다', error: error.message });
  }
});

// 가구 배치 알고리즘 실행
app.post('/api/furniture/place', async (req, res) => {
    try {
        const { furniture_list, room_width, room_height } = req.body;
        
        // Python 스크립트 실행
        const pythonProcess = spawn('python3', [
            path.join(__dirname, 'algorithm/furnitureChoosing/furniture_placement_algorithm.py')
        ]);

        // 입력 데이터 전송
        pythonProcess.stdin.write(JSON.stringify({
            furniture_list,
            room_width,
            room_height
        }));
        pythonProcess.stdin.end();

        let result = '';
        let error = '';

        // 결과 수집
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        // 프로세스 완료 대기
        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${error}`));
                } else {
                    resolve();
                }
            });
        });

        // 결과 파싱 및 반환
        const placements = JSON.parse(result);
        res.json(placements);

    } catch (error) {
        console.error('가구 배치 중 오류 발생:', error);
        res.status(500).json({ error: error.message });
    }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
