console.log("=== Script Started ===");

const express = require('express');
const cors = require('cors');
const app = express();

const {
  recommendSets,
  convertRanksToWeights,
  fetchFromMongo,
  FurnitureItem,
  BeddingItem,
  MattressItem,
  CurtainItem
} = require('./recommendFurnitureWhat');
const { recommendFurniture } = require('./recommendFurniture');

app.use(cors());
app.use(express.json());

app.post('/api/furniture/recommend', async (req, res) => {
  try {
    const { userPreferenceRank, budget, perimeter, pointColor, room, design } = req.body;

    const mongoData = await fetchFromMongo();
    if (!mongoData) {
      return res.status(500).json({ error: 'MongoDB 연결 실패' });
    }

    const furnitureDb = mongoData.furnitureDb.map(item => new FurnitureItem(item));
    const beddingList = mongoData.beddingList.map(item => new BeddingItem(item));
    const mattressList = mongoData.mattressList.map(item => new MattressItem(item));
    const curtainList = mongoData.curtainList.map(item => new CurtainItem(item));

    const userWeights = convertRanksToWeights(userPreferenceRank);

    const recommendedSets = recommendSets(
      furnitureDb,
      beddingList,
      mattressList,
      curtainList,
      userWeights,
      budget,
      perimeter,
      pointColor
    );

    const firstFurnitureSet = recommendedSets[0]?.furnitureSet || [];
    const placementsJson = recommendFurniture(firstFurnitureSet, room, design);
    const placements = JSON.parse(placementsJson);

    const responseData = {
    recommendedSet: recommendedSets[0],
    placements: placements.placements
    };

      console.log("📤 API 응답 데이터:", JSON.stringify(responseData, null, 2));
         res.json(responseData);

  } catch (err) {
    console.error("추천 API 오류:", err);
    res.status(500).json({ error: '추천 실패' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
